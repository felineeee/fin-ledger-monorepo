import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Kysely, sql, Transaction } from 'kysely';
import { DB } from '../../../db/types.js';
import {
  CreateFeeScheduleDto,
  UpdateFeeScheduleDto,
} from '../dto/finance.dto.js';
import { KYSELY_DB } from '@fin-ledger/databases';

@Injectable()
export class FeesService {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<DB>) {}

  async getFeeSchedules() {
    return this.db
      .selectFrom('fee_schedules')
      .selectAll()
      .orderBy('payment_method_id', 'asc')
      .execute();
  }

  // [x] POST /api/fee-schedules
  async createFeeSchedule(dto: CreateFeeScheduleDto) {
    return this.db
      .insertInto('fee_schedules')
      .values({
        payment_method_id: dto.payment_method_id,
        channel_code: dto.channel_code || null,
        flat_fee: dto.flat_fee,
        percentage_fee: dto.percentage_fee,
        vat_rate: dto.vat_rate,
        min_fee: dto.min_fee || null,
        max_fee: dto.max_fee || null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  // [x] PATCH /api/fee-schedules/:id
  async updateFeeSchedule(id: string, dto: UpdateFeeScheduleDto) {
    const record = await this.db
      .updateTable('fee_schedules')
      .set({
        ...dto,
        updated_at: new Date().toISOString(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!record) throw new NotFoundException('Fee schedule not found');
    return record;
  }

  // [x] GET /api/payments/:id/fees
  async calculatePaymentFees(paymentId: string) {
    const payment = await this.db
      .selectFrom('payments')
      .leftJoin(
        'fee_schedules',
        'payments.payment_method_id',
        'fee_schedules.payment_method_id',
      )
      .selectAll('payments')
      .select(['fee_schedules.flat_fee', 'fee_schedules.percentage_fee'])
      .where('payments.id', '=', paymentId)
      .executeTakeFirst();

    if (!payment)
      throw new NotFoundException(`Payment ${paymentId} not found.`);

    const amount = Number(payment.amount);
    const flatFee = Number(payment.flat_fee || 0);
    const percentageFee = Number(payment.percentage_fee || 0);

    // (Amount * Percentage) + Flat Fee
    const calculatedFee = amount * percentageFee + flatFee;
    // PPN (VAT) 11% on the fee itself (Standard Indonesian tax rule)
    const taxOnFee = calculatedFee * 0.11;
    const totalDeduction = calculatedFee + taxOnFee;

    return {
      payment_id: payment.id,
      gross_amount: amount,
      gateway_fee: calculatedFee,
      tax_on_fee: taxOnFee,
      total_deduction: totalDeduction,
      net_receivable: amount - totalDeduction,
    };
  }

  // --- INTERNAL CALCULATION ENGINE ---

  /**
   * Calculates and takes an immutable snapshot of the fees for a payment.
   * Call this from inside a database transaction during payment capture.
   */
  async calculateAndSnapshotFees(
    paymentId: string,
    // FIX: Allow either the main DB client or a Transaction client
    trxProvider?: Kysely<DB> | Transaction<DB>,
  ) {
    const dbClient = trxProvider || this.db;

    const payment = await dbClient
      .selectFrom('payments')
      .select(['id', 'amount', 'payment_method_id'])
      .where('id', '=', paymentId)
      .executeTakeFirst();

    if (!payment) throw new Error(`Payment ${paymentId} not found`);

    // 1. Fetch schedules linked strictly to this payment_method_id
    const schedules = await dbClient
      .selectFrom('fee_schedules')
      .selectAll()
      .where('payment_method_id', '=', payment.payment_method_id)
      .where('is_active', '=', true) // Ensure we only grab active fees
      .execute();

    // Prefer exact channel match, otherwise fallback to the generic schedule (null)
    const schedule =
      schedules.find((s) => s.channel_code !== null) ||
      schedules.find((s) => s.channel_code === null);

    const amount = Number(payment.amount);

    let flatFee = 0;
    let percentRate = 0;
    let vatRate = 0;
    let scheduleId = null;
    let baseFee = 0;
    let calculatedVat = 0;
    let totalFee = 0;

    if (schedule) {
      scheduleId = schedule.id;
      flatFee = Number(schedule.flat_fee || 0);
      percentRate = Number(schedule.percentage_fee || 0);
      vatRate = Number(schedule.vat_rate || 0);

      // Math: Base fee = Flat + (Amount * Percentage)
      baseFee = flatFee + amount * percentRate;

      // Boundaries
      if (schedule.min_fee !== null && baseFee < Number(schedule.min_fee)) {
        baseFee = Number(schedule.min_fee);
      }
      if (schedule.max_fee !== null && baseFee > Number(schedule.max_fee)) {
        baseFee = Number(schedule.max_fee);
      }

      // VAT is applied ON TOP of the base fee
      calculatedVat = baseFee * vatRate;
      totalFee = baseFee + calculatedVat;
    }

    const netPayout = amount - totalFee;

    await dbClient
      .updateTable('payments')
      .set({
        fee_schedule_id: scheduleId, // matches string | null
        snap_flat_fee: flatFee.toString(),
        snap_percentage_fee: percentRate.toString(),
        snap_vat_rate: vatRate.toString(),
        total_fee_deducted: totalFee.toString(),
        net_payout: netPayout.toString(),
        updated_at: new Date(),
      })
      .where('id', '=', paymentId)
      .execute();

    return { totalFee, netPayout };
  }

  // --- RETRIEVAL API ---

  async getPaymentFeesSnapshot(paymentId: string) {
    const payment = await this.db
      .selectFrom('payments')
      .select([
        'id',
        'amount',
        'currency',
        'fee_schedule_id',
        'snap_flat_fee',
        'snap_percentage_fee',
        'snap_vat_rate',
        'total_fee_deducted',
        'net_payout',
      ])
      .where('id', '=', paymentId)
      .executeTakeFirst();

    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.total_fee_deducted === null) {
      return {
        payment_id: payment.id,
        gross_amount: Number(payment.amount),
        status: 'FEES_NOT_YET_CALCULATED_OR_CAPTURED',
      };
    }

    return {
      payment_id: payment.id,
      gross_amount: Number(payment.amount),
      currency: payment.currency,
      fee_breakdown: {
        flat_fee_applied: Number(payment.snap_flat_fee),
        percentage_applied: Number(payment.snap_percentage_fee),
        vat_applied: Number(payment.snap_vat_rate),
        total_fees: Number(payment.total_fee_deducted),
      },
      net_payout: Number(payment.net_payout),
      schedule_id: payment.fee_schedule_id,
    };
  }
}

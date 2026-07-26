import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB } from '../../../db/types.js';
import {
  CreateFeeScheduleDto,
  UpdateFeeScheduleDto,
} from '../dto/finance.dto.js';

@Injectable()
export class FeesService {
  constructor(@Inject('DB_INSTANCE') private readonly db: Kysely<DB>) {}

  async getFeeSchedules() {
    return this.db
      .selectFrom('fee_schedules')
      .innerJoin(
        'payment_methods',
        'fee_schedules.payment_method_id',
        'payment_methods.id',
      )
      .select([
        'fee_schedules.id',
        'fee_schedules.payment_method_id',
        'payment_methods.name as method_name',
        'fee_schedules.flat_fee',
        'fee_schedules.percentage_fee',
      ])
      .execute();
  }

  // [x] POST /api/fee-schedules
  async createFeeSchedule(dto: CreateFeeScheduleDto) {
    return this.db
      .insertInto('fee_schedules')
      .values({
        payment_method_id: dto.payment_method_id,
        flat_fee: dto.flat_fee,
        percentage_fee: dto.percentage_fee,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  // [x] PATCH /api/fee-schedules/:id
  async updateFeeSchedule(id: string, dto: UpdateFeeScheduleDto) {
    const payload: any = { updated_at: sql`NOW()` };
    if (dto.flat_fee !== undefined) payload.flat_fee = dto.flat_fee;
    if (dto.percentage_fee !== undefined)
      payload.percentage_fee = dto.percentage_fee;

    return this.db
      .updateTable('fee_schedules')
      .set(payload)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow(
        () => new NotFoundException(`Fee schedule ${id} not found.`),
      );
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
}

// src/finance/finance.service.ts
import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB } from './../../db/types.js';
import { CreateFeeScheduleDto, UpdateFeeScheduleDto, ReportQueryDto } from './dto/finance.dto.js';

@Injectable()
export class FinanceService {
  constructor(@Inject('DB_INSTANCE') private readonly db: Kysely<DB>) {}

  // ==========================================
  // SETTLEMENTS & PAYOUTS
  // ==========================================

  // [x] GET /api/settlements
  async getSettlements() {
    return this.db.selectFrom('settlements').selectAll().orderBy('created_at', 'desc').execute();
  }

  // [x] GET /api/settlements/:id
  async getSettlementById(id: string) {
    const settlement = await this.db.selectFrom('settlements').selectAll().where('id', '=', id).executeTakeFirst();
    if (!settlement) throw new NotFoundException(`Settlement ${id} not found.`);
    return settlement;
  }

  // [x] POST /api/settlements/:id/mark-paid
  async markSettlementPaid(id: string) {
    const settlement = await this.getSettlementById(id);
    if (settlement.status === 'PAID') throw new ConflictException('Settlement is already marked as PAID.');

    return this.db.updateTable('settlements')
      .set({ 
        status: 'PAID', 
        settled_at: sql`NOW()`,
        updated_at: sql`NOW()` 
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  // ==========================================
  // FEES & MULTI-CURRENCY
  // ==========================================

  // [x] GET /api/fee-schedules
  async getFeeSchedules() {
    return this.db.selectFrom('fee_schedules')
      .innerJoin('payment_methods', 'fee_schedules.payment_method_id', 'payment_methods.id')
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
    return this.db.insertInto('fee_schedules')
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
    if (dto.percentage_fee !== undefined) payload.percentage_fee = dto.percentage_fee;

    return this.db.updateTable('fee_schedules')
      .set(payload)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow(() => new NotFoundException(`Fee schedule ${id} not found.`));
  }

  // [x] GET /api/payments/:id/fees
  async calculatePaymentFees(paymentId: string) {
    const payment = await this.db.selectFrom('payments')
      .leftJoin('fee_schedules', 'payments.payment_method_id', 'fee_schedules.payment_method_id')
      .selectAll('payments')
      .select(['fee_schedules.flat_fee', 'fee_schedules.percentage_fee'])
      .where('payments.id', '=', paymentId)
      .executeTakeFirst();

    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found.`);

    const amount = Number(payment.amount);
    const flatFee = Number(payment.flat_fee || 0);
    const percentageFee = Number(payment.percentage_fee || 0);
    
    // (Amount * Percentage) + Flat Fee
    const calculatedFee = (amount * percentageFee) + flatFee;
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

  // [x] GET /api/currencies & /api/exchange-rates
  async getCurrencies() {
    return [{ code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' }, { code: 'USD', name: 'US Dollar', symbol: '$' }];
  }

  async getExchangeRates() {
    return { base: 'IDR', rates: { USD: 0.000062 } }; // Mocked static rates for boilerplate
  }

  // ==========================================
  // FINANCIAL REPORTING
  // ==========================================

  // [x] GET /api/locations/:id/reports/payment-methods-breakdown
  async getPaymentMethodBreakdown(locationId: string, query: ReportQueryDto) {
    let q = this.db.selectFrom('payments')
      .innerJoin('payment_methods', 'payments.payment_method_id', 'payment_methods.id')
      .leftJoin('shifts', 'payments.shift_id', 'shifts.id')
      .select([
        'payment_methods.name as method',
        ({ fn }) => fn.sum('payments.amount').as('total_volume'),
        ({ fn }) => fn.count('payments.id').as('transaction_count')
      ])
      .where('shifts.location_id', '=', locationId)
      .where('payments.status', '=', 'CAPTURED')
      .groupBy('payment_methods.name');

    if (query.start_date) q = q.where('payments.created_at', '>=', new Date(query.start_date));
    if (query.end_date) q = q.where('payments.created_at', '<=', new Date(query.end_date));

    return q.execute();
  }

  // [x] GET /api/locations/:id/reports/failed-payments
  async getFailedPaymentsReport(locationId: string, query: ReportQueryDto) {
    let q = this.db.selectFrom('payments')
      .leftJoin('shifts', 'payments.shift_id', 'shifts.id')
      .select([
        'payments.status',
        ({ fn }) => fn.count('payments.id').as('count'),
        ({ fn }) => fn.sum('payments.amount').as('lost_volume')
      ])
      .where('shifts.location_id', '=', locationId)
      .where('payments.status', 'in', ['FAILED', 'VOIDED'])
      .groupBy('payments.status');

    if (query.start_date) q = q.where('payments.created_at', '>=', new Date(query.start_date));
    if (query.end_date) q = q.where('payments.created_at', '<=', new Date(query.end_date));

    return q.execute();
  }

  // [x] GET /api/reports/revenue/company-wide
  async getCompanyWideRevenue(query: ReportQueryDto) {
    // 1. Gross Volume
    let grossQuery = this.db.selectFrom('payments')
      .select(({ fn }) => fn.sum('amount').as('gross_volume'))
      .where('status', 'in', ['CAPTURED', 'PARTIALLY_REFUNDED']);
    
    // 2. Refund Volume
    let refundQuery = this.db.selectFrom('refunds')
      .select(({ fn }) => fn.sum('amount').as('total_refunded'))
      .where('status', '=', 'COMPLETED');

    if (query.start_date) {
      grossQuery = grossQuery.where('created_at', '>=', new Date(query.start_date));
      refundQuery = refundQuery.where('created_at', '>=', new Date(query.start_date));
    }
    if (query.end_date) {
      grossQuery = grossQuery.where('created_at', '<=', new Date(query.end_date));
      refundQuery = refundQuery.where('created_at', '<=', new Date(query.end_date));
    }

    const grossResult = await grossQuery.executeTakeFirst();
    const refundResult = await refundQuery.executeTakeFirst();

    const gross = Number(grossResult?.gross_volume || 0);
    const refunds = Number(refundResult?.total_refunded || 0);

    return {
      date_range: { start: query.start_date || null, end: query.end_date || null },
      gross_volume: gross,
      total_refunded: refunds,
      net_revenue: gross - refunds,
    };
  }
}
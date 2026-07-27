// src/finance/finance.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB } from './../../db/types.js';
import {
  CreateFeeScheduleDto,
  UpdateFeeScheduleDto,
  ReportQueryDto,
} from './dto/finance.dto.js';
import { KYSELY_DB } from '@fin-ledger/databases';

@Injectable()
export class FinanceService {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<DB>) {}
  // [x] GET /api/locations/:id/reports/payment-methods-breakdown
  async getPaymentMethodBreakdown(locationId: string, query: ReportQueryDto) {
    let q = this.db
      .selectFrom('payments')
      .innerJoin(
        'payment_methods',
        'payments.payment_method_id',
        'payment_methods.id',
      )
      .leftJoin('shifts', 'payments.shift_id', 'shifts.id')
      .select([
        'payment_methods.name as method',
        ({ fn }) => fn.sum('payments.amount').as('total_volume'),
        ({ fn }) => fn.count('payments.id').as('transaction_count'),
      ])
      .where('shifts.location_id', '=', locationId)
      .where('payments.status', '=', 'CAPTURED')
      .groupBy('payment_methods.name');

    if (query.start_date)
      q = q.where('payments.created_at', '>=', new Date(query.start_date));
    if (query.end_date)
      q = q.where('payments.created_at', '<=', new Date(query.end_date));

    return q.execute();
  }

  // [x] GET /api/locations/:id/reports/failed-payments
  async getFailedPaymentsReport(locationId: string, query: ReportQueryDto) {
    let q = this.db
      .selectFrom('payments')
      .leftJoin('shifts', 'payments.shift_id', 'shifts.id')
      .select([
        'payments.status',
        ({ fn }) => fn.count('payments.id').as('count'),
        ({ fn }) => fn.sum('payments.amount').as('lost_volume'),
      ])
      .where('shifts.location_id', '=', locationId)
      .where('payments.status', 'in', ['FAILED', 'VOIDED'])
      .groupBy('payments.status');

    if (query.start_date)
      q = q.where('payments.created_at', '>=', new Date(query.start_date));
    if (query.end_date)
      q = q.where('payments.created_at', '<=', new Date(query.end_date));

    return q.execute();
  }

  // [x] GET /api/reports/revenue/company-wide
  async getCompanyWideRevenue(query: ReportQueryDto) {
    // 1. Gross Volume
    let grossQuery = this.db
      .selectFrom('payments')
      .select(({ fn }) => fn.sum('amount').as('gross_volume'))
      .where('status', 'in', ['CAPTURED', 'PARTIALLY_REFUNDED']);

    // 2. Refund Volume
    let refundQuery = this.db
      .selectFrom('refunds')
      .select(({ fn }) => fn.sum('amount').as('total_refunded'))
      .where('status', '=', 'COMPLETED');

    if (query.start_date) {
      grossQuery = grossQuery.where(
        'created_at',
        '>=',
        new Date(query.start_date),
      );
      refundQuery = refundQuery.where(
        'created_at',
        '>=',
        new Date(query.start_date),
      );
    }
    if (query.end_date) {
      grossQuery = grossQuery.where(
        'created_at',
        '<=',
        new Date(query.end_date),
      );
      refundQuery = refundQuery.where(
        'created_at',
        '<=',
        new Date(query.end_date),
      );
    }

    const grossResult = await grossQuery.executeTakeFirst();
    const refundResult = await refundQuery.executeTakeFirst();

    const gross = Number(grossResult?.gross_volume || 0);
    const refunds = Number(refundResult?.total_refunded || 0);

    return {
      date_range: {
        start: query.start_date || null,
        end: query.end_date || null,
      },
      gross_volume: gross,
      total_refunded: refunds,
      net_revenue: gross - refunds,
    };
  }
}

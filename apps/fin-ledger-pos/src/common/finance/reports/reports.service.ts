// src/finance/reports.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB } from '../../../db/types.js';
import { ReportQueryDto } from '../dto/reports.dto.js';
import { KYSELY_DB } from '@fin-ledger/databases';

@Injectable()
export class ReportsService {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<DB>) {}

  // [x] GET /api/locations/:id/reports/payment-methods-breakdown
  async getPaymentMethodsBreakdown(locationId: string, query: ReportQueryDto) {
    const { start_date, end_date } = query;

    let baseQuery = this.db
      .selectFrom('payments')
      .innerJoin(
        'payment_methods',
        'payments.payment_method_id',
        'payment_methods.id',
      )
      .where('payments.location_id', '=', locationId)
      .where('payments.status', '=', 'CAPTURED');

    if (start_date)
      baseQuery = baseQuery.where(
        'payments.created_at',
        '>=',
        new Date(start_date),
      );
    if (end_date)
      baseQuery = baseQuery.where(
        'payments.created_at',
        '<=',
        new Date(end_date),
      );

    const breakdown = await baseQuery
      .select([
        'payment_methods.type as method_type',
        'payment_methods.name as method_name',
        'payment_methods.provider',
        sql<number>`SUM(payments.amount)`.as('total_revenue'),
        sql<number>`COUNT(payments.id)`.as('transaction_count'),
      ])
      .groupBy([
        'payment_methods.type',
        'payment_methods.name',
        'payment_methods.provider',
      ])
      .orderBy('total_revenue', 'desc')
      .execute();

    const totalRevenue = breakdown.reduce(
      (sum, row) => sum + Number(row.total_revenue),
      0,
    );

    return {
      location_id: locationId,
      total_revenue: totalRevenue,
      breakdown: breakdown.map((b) => ({
        provider: b.provider,
        method_type: b.method_type,
        method_name: b.method_name,
        total_revenue: Number(b.total_revenue),
        transaction_count: Number(b.transaction_count),
        percentage_of_total:
          totalRevenue > 0
            ? ((Number(b.total_revenue) / totalRevenue) * 100).toFixed(2)
            : '0.00',
      })),
    };
  }

  // [x] GET /api/locations/:id/reports/failed-payments
  async getFailedPayments(locationId: string, query: ReportQueryDto) {
    const { start_date, end_date } = query;

    let baseQuery = this.db
      .selectFrom('payments')
      .innerJoin(
        'payment_methods',
        'payments.payment_method_id',
        'payment_methods.id',
      )
      .where('payments.location_id', '=', locationId)
      .where('payments.status', '=', 'FAILED');

    if (start_date)
      baseQuery = baseQuery.where(
        'payments.created_at',
        '>=',
        new Date(start_date),
      );
    if (end_date)
      baseQuery = baseQuery.where(
        'payments.created_at',
        '<=',
        new Date(end_date),
      );

    const failures = await baseQuery
      .select([
        'payments.id',
        'payments.amount',
        'payments.currency',
        'payments.created_at',
        'payment_methods.type as method_type',
        'payment_methods.provider',
      ])
      .orderBy('payments.created_at', 'desc')
      .execute();

    const totalFailedAmount = failures.reduce(
      (sum, row) => sum + Number(row.amount),
      0,
    );

    return {
      location_id: locationId,
      total_failed_count: failures.length,
      total_failed_amount: totalFailedAmount,
      data: failures.map((f) => ({
        ...f,
        amount: Number(f.amount), // Cast Decimal string to JS number
      })),
    };
  }

  // [x] GET /api/reports/revenue/company-wide
  async getCompanyWideRevenue(query: ReportQueryDto) {
    const { start_date, end_date } = query;

    // Use payments table directly, no locations join needed
    let baseQuery = this.db
      .selectFrom('payments')
      .where('status', '=', 'CAPTURED')
      .where('location_id', 'is not', null);

    if (start_date)
      baseQuery = baseQuery.where('created_at', '>=', new Date(start_date));
    if (end_date)
      baseQuery = baseQuery.where('created_at', '<=', new Date(end_date));

    // 1. Total aggregate
    const totals = await baseQuery
      .select([
        sql<number>`SUM(amount)`.as('gross_revenue'),
        sql<number>`COUNT(id)`.as('total_transactions'),
      ])
      .executeTakeFirst();

    // 2. Location breakdown
    const locationBreakdown = await baseQuery
      .select([
        'location_id',
        sql<number>`SUM(amount)`.as('location_revenue'),
        sql<number>`COUNT(id)`.as('location_transactions'),
      ])
      .groupBy('location_id')
      .orderBy('location_revenue', 'desc')
      .execute();

    return {
      company_gross_revenue: Number(totals?.gross_revenue || 0),
      company_total_transactions: Number(totals?.total_transactions || 0),
      locations: locationBreakdown.map((l) => ({
        location_id: l.location_id,
        revenue: Number(l.location_revenue),
        transactions: Number(l.location_transactions),
      })),
    };
  }
}

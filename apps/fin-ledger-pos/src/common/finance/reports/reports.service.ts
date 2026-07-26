// src/finance/reports.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB } from '../../../db/types.js';
import { ReportQueryDto } from '../dto/reports.dto.js';

@Injectable()
export class ReportsService {
  constructor(@Inject('DB_INSTANCE') private readonly db: Kysely<DB>) {}

  // [x] GET /api/locations/:id/reports/payment-methods-breakdown
  async getPaymentMethodBreakdown(locationId: string, query: ReportQueryDto) {
    let q = this.db.selectFrom('payments')
      .innerJoin('payment_methods', 'payments.payment_method_id', 'payment_methods.id')
      .leftJoin('shifts', 'payments.shift_id', 'shifts.id')
      .select([
        'payment_methods.name as method',
        'payment_methods.type as type',
        ({ fn }) => fn.sum('payments.amount').as('total_volume'),
        ({ fn }) => fn.count('payments.id').as('transaction_count')
      ])
      // Only count actual realized revenue
      .where('payments.status', 'in', ['CAPTURED', 'PARTIALLY_REFUNDED'])
      // Match the physical location (or explicit online routing if locationId represents an e-comm store)
      .where('shifts.location_id', '=', locationId)
      .groupBy(['payment_methods.name', 'payment_methods.type']);

    if (query.start_date) q = q.where('payments.created_at', '>=', new Date(query.start_date));
    if (query.end_date) q = q.where('payments.created_at', '<=', new Date(query.end_date));

    const results = await q.execute();

    return {
      location_id: locationId,
      date_range: { start: query.start_date || 'All Time', end: query.end_date || 'Now' },
      breakdown: results.map(row => ({
        method: row.method,
        type: row.type,
        total_volume: Number(row.total_volume || 0),
        transaction_count: Number(row.transaction_count || 0),
      })),
    };
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
      // Group both explicitly failed and manually voided/abandoned transactions
      .where('payments.status', 'in', ['FAILED', 'VOIDED'])
      .groupBy('payments.status');

    if (query.start_date) q = q.where('payments.created_at', '>=', new Date(query.start_date));
    if (query.end_date) q = q.where('payments.created_at', '<=', new Date(query.end_date));

    const results = await q.execute();

    return {
      location_id: locationId,
      date_range: { start: query.start_date || 'All Time', end: query.end_date || 'Now' },
      breakdown: results.map(row => ({
        status: row.status,
        count: Number(row.count || 0),
        lost_volume: Number(row.lost_volume || 0),
      })),
    };
  }

  // [x] GET /api/reports/revenue/company-wide
  async getCompanyWideRevenue(query: ReportQueryDto) {
    // 1. Calculate Gross Volume (Money that came in)
    let grossQuery = this.db.selectFrom('payments')
      .select(({ fn }) => fn.sum('amount').as('gross_volume'))
      .where('status', 'in', ['CAPTURED', 'PARTIALLY_REFUNDED']);
    
    // 2. Calculate Total Refunded (Money that went back out)
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

    const [grossResult, refundResult] = await Promise.all([
      grossQuery.executeTakeFirst(),
      refundQuery.executeTakeFirst()
    ]);

    const gross = Number(grossResult?.gross_volume || 0);
    const refunds = Number(refundResult?.total_refunded || 0);
    const net = gross - refunds;

    return {
      report_type: 'COMPANY_WIDE_REVENUE',
      date_range: { 
        start: query.start_date || 'All Time', 
        end: query.end_date || 'Now' 
      },
      metrics: {
        gross_volume: gross,
        total_refunded: refunds,
        net_revenue: net,
      }
    };
  }
}
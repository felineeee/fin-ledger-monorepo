// src/reconciliation/reconciliation.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB } from '../../db/types.js';
import {
  LedgerQueryDto,
  DailyReconciliationQueryDto,
  DiscrepancyQueryDto,
  CloseDailyReconciliationDto,
} from './dto/reconciliation.dto.js';
import { KYSELY_DB } from '@fin-ledger/databases';

@Injectable()
export class ReconciliationService {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<DB>) {}

  // [x] GET /api/payments/ledger
  async getLedgerRecords(query: LedgerQueryDto) {
    let q = this.db
      .selectFrom('payment_ledger')
      .selectAll()
      .orderBy('created_at', 'desc');

    if (query.payment_id) q = q.where('payment_id', '=', query.payment_id);
    if (query.entry_type) q = q.where('entry_type', '=', query.entry_type);

    return q.execute();
  }

  // [x] GET /api/payments/ledger/:id
  async getLedgerRecordById(id: string) {
    const record = await this.db
      .selectFrom('payment_ledger')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!record) throw new NotFoundException(`Ledger entry ${id} not found.`);
    return record;
  }

  // [x] GET /api/locations/:id/reconciliation/daily
  async getDailyReconciliation(
    locationId: string,
    query: DailyReconciliationQueryDto,
  ) {
    const targetDate = query.date || new Date().toISOString().split('T')[0];

    // 1. Check if period is already locked/closed
    const existingClose = await this.db
      .selectFrom('daily_reconciliations')
      .selectAll()
      .where('location_id', '=', locationId)
      .where('reconciliation_date', '=', new Date(targetDate))
      .executeTakeFirst();

    // 2. Aggregate Shift Data (Cash basis)
    // 2. Aggregate Shift Data (Cash basis)
    const shiftsAgg = await this.db
      .selectFrom('shifts')
      .select([
        ({ fn }) => fn.sum('starting_float').as('total_starting_float'),
        ({ fn }) => fn.sum('ending_cash_expected').as('total_expected_cash'),
        ({ fn }) => fn.sum('ending_cash_actual').as('total_actual_cash'),
        ({ fn }) => fn.sum('total_cash_drops').as('total_cash_drops'),
        ({ fn }) => fn.sum('variance').as('net_variance'),
        ({ fn }) => fn.count('id').as('total_shifts'),
      ])
      .where('location_id', '=', locationId)
      .where(sql`DATE(opened_at)`, '=', targetDate)
      .executeTakeFirst();

    // 3. Fetch individual shifts for the detailed breakdown
    const shifts = await this.db
      .selectFrom('shifts')
      .selectAll()
      .where('location_id', '=', locationId)
      .where(sql`DATE(opened_at)`, '=', targetDate)
      .execute();

    const shiftIds = shifts.map((s) => s.id);

    // 4. Payment breakdown per payment method
    let paymentBreakdown: any[] = [];
    if (shiftIds.length > 0) {
      paymentBreakdown = await this.db
        .selectFrom('payments')
        .innerJoin(
          'payment_methods',
          'payments.payment_method_id',
          'payment_methods.id',
        )
        .select([
          'payment_methods.type as method_type',
          'payment_methods.name as method_name',
          sql<number>`SUM(payments.amount)`.as('total_amount'),
          sql<number>`COUNT(payments.id)`.as('transaction_count'),
        ])
        .where('payments.shift_id', 'in', shiftIds)
        .where('payments.status', '=', 'CAPTURED')
        .groupBy(['payment_methods.type', 'payment_methods.name'])
        .execute();
    }

    return {
      location_id: locationId,
      date: targetDate,
      is_closed: !!existingClose,
      closed_at: existingClose?.closed_at || null,
      summary: {
        total_shifts: Number(shiftsAgg?.total_shifts || 0),
        open_shifts: shifts.filter((s) => s.status === 'OPEN').length,
        closed_shifts: shifts.filter((s) => s.status === 'CLOSED').length,
        total_starting_float: Number(shiftsAgg?.total_starting_float || 0),
        total_expected_cash: Number(shiftsAgg?.total_expected_cash || 0),
        total_actual_cash: Number(shiftsAgg?.total_actual_cash || 0),
        total_cash_drops: Number(shiftsAgg?.total_cash_drops || 0),
        net_variance: Number(shiftsAgg?.net_variance || 0),
      },
      payment_breakdown: paymentBreakdown.map((p) => ({
        method_type: p.method_type,
        method_name: p.method_name,
        total_amount: Number(p.total_amount || 0),
        transaction_count: Number(p.transaction_count || 0),
      })),
      shift_breakdown: shifts,
    };
  }

  // [x] GET /api/reconciliation/discrepancies
  async getDiscrepancies(query: DiscrepancyQueryDto) {
    let q = this.db
      .selectFrom('shifts')
      .selectAll()
      // Discrepancy defined as non-zero variance or an abandoned shift (null variance)
      .where((eb) =>
        eb.or([eb('variance', '!=', '0'), eb('variance', 'is', null)]),
      )
      .where('status', 'in', ['CLOSED', 'FORCE_CLOSED'])
      .orderBy('closed_at', 'desc');

    if (query.location_id) {
      q = q.where('location_id', '=', query.location_id);
    }
    if (query.date) {
      q = q.where(sql`DATE(closed_at)`, '=', query.date);
    }

    return q.execute();
  }

  // [x] POST /api/locations/:id/reconciliation/close
  async closeDailyReconciliation(
    locationId: string,
    dto: CloseDailyReconciliationDto,
  ) {
    const targetDate = dto.date || new Date().toISOString().split('T')[0];

    // Check if period is already locked
    const existing = await this.db
      .selectFrom('daily_reconciliations')
      .select('id')
      .where('location_id', '=', locationId)
      .where('reconciliation_date', '=', new Date(targetDate))
      .executeTakeFirst();

    if (existing) {
      throw new ConflictException(
        `Daily reconciliation for location ${locationId} on ${targetDate} is already closed.`,
      );
    }

    return this.db.transaction().execute(async (trx) => {
      // 1. Find all OPEN shifts for this location on this date
      const openShifts = await trx
        .selectFrom('shifts')
        .select('id')
        .where('location_id', '=', locationId)
        .where('status', '=', 'OPEN')
        .where(sql`DATE(opened_at)`, '<=', targetDate)
        .execute();

      // 2. Force close any abandoned shifts to lock the day
      if (openShifts.length > 0) {
        const openShiftIds = openShifts.map((s) => s.id);
        await trx
          .updateTable('shifts')
          .set({
            status: 'FORCE_CLOSED',
            closed_at: sql`NOW()`,
          })
          .where('id', 'in', openShiftIds)
          .execute();
      }

      // 3. Fetch summary metrics
      const dailyData = await this.getDailyReconciliation(locationId, {
        date: targetDate,
      });

      // 4. Save daily reconciliation snapshot
      const record = await trx
        .insertInto('daily_reconciliations')
        .values({
          location_id: locationId,
          reconciliation_date: targetDate,
          total_shifts: dailyData.summary.total_shifts,
          total_opening_float: dailyData.summary.total_starting_float,
          total_ending_cash_actual: dailyData.summary.total_actual_cash,
          total_cash_drops: dailyData.summary.total_cash_drops,
          total_variance: dailyData.summary.net_variance,
          notes: dto.notes || null,
          closed_at: sql`NOW()`,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return {
        message: 'Daily financial period successfully reconciled and locked.',
        force_closed_abandoned_shifts: openShifts.length,
        reconciliation: record,
      };
    });
  }
}

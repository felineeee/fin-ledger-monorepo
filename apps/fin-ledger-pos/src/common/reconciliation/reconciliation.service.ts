// src/reconciliation/reconciliation.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB } from './../../db/types.js';
import {
  LedgerQueryDto,
  DailyReconciliationQueryDto,
  DiscrepancyQueryDto,
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
    // Default to current date if none provided
    const targetDate = query.date || new Date().toISOString().split('T')[0];

    // Aggregate Shift Data (Cash basis)
    const shiftsAgg = await this.db
      .selectFrom('shifts')
      .select([
        ({ fn }) => fn.sum('starting_float').as('total_starting_float'),
        ({ fn }) => fn.sum('expected_cash').as('total_expected_cash'),
        ({ fn }) => fn.sum('actual_cash').as('total_actual_cash'),
        ({ fn }) => fn.sum('variance').as('net_variance'),
        ({ fn }) => fn.count('id').as('total_shifts'),
      ])
      .where('location_id', '=', locationId)
      .where(sql`DATE(opened_at)`, '=', targetDate)
      .executeTakeFirst();

    // Fetch individual shifts to include in the breakdown
    const shifts = await this.db
      .selectFrom('shifts')
      .selectAll()
      .where('location_id', '=', locationId)
      .where(sql`DATE(opened_at)`, '=', targetDate)
      .execute();

    return {
      location_id: locationId,
      date: targetDate,
      summary: {
        total_shifts: Number(shiftsAgg?.total_shifts || 0),
        total_starting_float: Number(shiftsAgg?.total_starting_float || 0),
        total_expected_cash: Number(shiftsAgg?.total_expected_cash || 0),
        total_actual_cash: Number(shiftsAgg?.total_actual_cash || 0),
        net_variance: Number(shiftsAgg?.net_variance || 0),
      },
      shift_breakdown: shifts,
    };
  }

  // [x] GET /api/reconciliation/discrepancies
  async getDiscrepancies(query: DiscrepancyQueryDto) {
    let q = this.db
      .selectFrom('shifts')
      .selectAll()
      // Discrepancy defined as a non-zero variance OR an abandoned/force-closed shift (null variance)
      .where((eb) =>
        eb.or([eb('variance', '!=', '0'), eb('variance', 'is', null)]),
      )
      // Only check closed or force_closed shifts
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
    query: DailyReconciliationQueryDto,
  ) {
    const targetDate = query.date || new Date().toISOString().split('T')[0];

    return this.db.transaction().execute(async (trx) => {
      // 1. Find all OPEN shifts for this location on this date
      const openShifts = await trx
        .selectFrom('shifts')
        .select('id')
        .where('location_id', '=', locationId)
        .where('status', '=', 'OPEN')
        .where(sql`DATE(opened_at)`, '<=', targetDate)
        .execute();

      // 2. Force close any abandoned shifts to secure the day's books
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

      // 3. Generate the final locked daily report (using the GET method logic within transaction)
      const shiftsAgg = await trx
        .selectFrom('shifts')
        .select([
          ({ fn }) => fn.sum('starting_float').as('total_starting_float'),
          ({ fn }) => fn.sum('expected_cash').as('total_expected_cash'),
          ({ fn }) => fn.sum('actual_cash').as('total_actual_cash'),
          ({ fn }) => fn.sum('variance').as('net_variance'),
          ({ fn }) => fn.count('id').as('total_shifts'),
        ])
        .where('location_id', '=', locationId)
        .where(sql`DATE(opened_at)`, '=', targetDate)
        .executeTakeFirst();

      return {
        message: 'Daily reconciliation closed successfully.',
        force_closed_abandoned_shifts: openShifts.length,
        locked_report: {
          location_id: locationId,
          date: targetDate,
          total_shifts: Number(shiftsAgg?.total_shifts || 0),
          net_variance: Number(shiftsAgg?.net_variance || 0),
        },
      };
    });
  }
}

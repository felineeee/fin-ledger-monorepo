// src/shifts/shifts.service.ts
import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB } from '../../db/types.js';
import { OpenShiftDto, CashDropDto, CloseShiftDto, ShiftQueryDto } from './dto/shifts.dto.js';

@Injectable()
export class ShiftsService {
  constructor(@Inject('DB_INSTANCE') private readonly db: Kysely<DB>) {}

  // [x] POST /api/shifts/open
  async openShift(dto: OpenShiftDto) {
    try {
      return await this.db.insertInto('shifts')
        .values({
          location_id: dto.location_id,
          cashier_id: dto.cashier_id,
          starting_float: dto.starting_float,
          status: 'OPEN',
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error: any) {
      // Catch unique index violation (idx_one_open_shift_per_location_cashier)
      if (error.code === '23505') {
        throw new ConflictException('An open shift already exists for this cashier at this location.');
      }
      throw error;
    }
  }

  // [x] GET /api/shifts
  async findAll(query: ShiftQueryDto) {
    let q = this.db.selectFrom('shifts').selectAll().orderBy('opened_at', 'desc');
    
    if (query.location_id) q = q.where('location_id', '=', query.location_id);
    if (query.cashier_id) q = q.where('cashier_id', '=', query.cashier_id);
    if (query.status) q = q.where('status', '=', query.status);

    return q.execute();
  }

  // [x] GET /api/locations/:id/shifts
  async findByLocation(locationId: string) {
    return this.db.selectFrom('shifts')
      .selectAll()
      .where('location_id', '=', locationId)
      .orderBy('opened_at', 'desc')
      .execute();
  }

  // [x] GET /api/shifts/:id
  async findOne(id: string) {
    const shift = await this.db.selectFrom('shifts').selectAll().where('id', '=', id).executeTakeFirst();
    if (!shift) throw new NotFoundException(`Shift ${id} not found.`);

    // Fetch related drops and payments to provide a detailed summary
    const drops = await this.db.selectFrom('cash_drops').selectAll().where('shift_id', '=', id).execute();
    const payments = await this.db.selectFrom('payments').selectAll().where('shift_id', '=', id).execute();

    return { ...shift, cash_drops: drops, payments };
  }

  // [x] POST /api/shifts/cash-drop
  async recordCashDrop(dto: CashDropDto) {
    const shift = await this.db.selectFrom('shifts').selectAll().where('id', '=', dto.shift_id).executeTakeFirst();
    
    if (!shift) throw new NotFoundException('Shift not found.');
    if (shift.status !== 'OPEN') throw new ConflictException(`Cannot drop cash on a ${shift.status} shift.`);

    return this.db.insertInto('cash_drops')
      .values({
        shift_id: dto.shift_id,
        amount: dto.amount,
        recorded_by: dto.recorded_by,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  // [x] POST /api/shifts/close
  async closeShift(dto: CloseShiftDto) {
    return this.db.transaction().execute(async (trx) => {
      const shift = await trx.selectFrom('shifts').selectAll().where('id', '=', dto.shift_id).executeTakeFirst();
      
      if (!shift) throw new NotFoundException('Shift not found.');
      if (shift.status !== 'OPEN') throw new ConflictException(`Shift is already ${shift.status}.`);

      const startingFloat = Number(shift.starting_float);

      // 1. Sum all mid-shift cash drops
      const dropsAgg = await trx.selectFrom('cash_drops')
        .select(({ fn }) => fn.sum('amount').as('total_drops'))
        .where('shift_id', '=', dto.shift_id)
        .executeTakeFirst();
      const totalDrops = Number(dropsAgg?.total_drops || 0);

      // 2. Sum all captured cash sales tied to this shift
      const salesAgg = await trx.selectFrom('payments')
        .innerJoin('payment_methods', 'payments.payment_method_id', 'payment_methods.id')
        .select(({ fn }) => fn.sum('payments.amount').as('total_cash_sales'))
        .where('payments.shift_id', '=', dto.shift_id)
        .where('payments.status', '=', 'CAPTURED')
        .where('payment_methods.type', '=', 'CASH')
        .executeTakeFirst();
      const totalCashSales = Number(salesAgg?.total_cash_sales || 0);

      // Math: Float + Sales - Drops = What should be in the drawer right now
      const expectedCash = startingFloat + totalCashSales - totalDrops;
      const variance = dto.actual_cash - expectedCash;

      return trx.updateTable('shifts')
        .set({
          status: 'CLOSED',
          closed_at: sql`NOW()`,
          expected_cash: expectedCash,
          actual_cash: dto.actual_cash,
          variance: variance,
        })
        .where('id', '=', dto.shift_id)
        .returningAll()
        .executeTakeFirstOrThrow();
    });
  }

  // [x] POST /api/shifts/:id/force-close
  async forceClose(id: string) {
    const shift = await this.db.selectFrom('shifts').selectAll().where('id', '=', id).executeTakeFirst();
    if (!shift) throw new NotFoundException('Shift not found.');
    if (shift.status !== 'OPEN') throw new ConflictException(`Shift is already ${shift.status}.`);

    return this.db.updateTable('shifts')
      .set({
        status: 'FORCE_CLOSED',
        closed_at: sql`NOW()`,
        // Leaving actual_cash and variance null deliberately so audits flag this record
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
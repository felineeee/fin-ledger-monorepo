var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
// src/shifts/shifts.service.ts
import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
let ShiftsService = class ShiftsService {
    db;
    constructor(db) {
        this.db = db;
    }
    // [x] POST /api/shifts/open
    async openShift(dto) {
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
        }
        catch (error) {
            // Catch unique index violation (idx_one_open_shift_per_location_cashier)
            if (error.code === '23505') {
                throw new ConflictException('An open shift already exists for this cashier at this location.');
            }
            throw error;
        }
    }
    // [x] GET /api/shifts
    async findAll(query) {
        let q = this.db.selectFrom('shifts').selectAll().orderBy('opened_at', 'desc');
        if (query.location_id)
            q = q.where('location_id', '=', query.location_id);
        if (query.cashier_id)
            q = q.where('cashier_id', '=', query.cashier_id);
        if (query.status)
            q = q.where('status', '=', query.status);
        return q.execute();
    }
    // [x] GET /api/locations/:id/shifts
    async findByLocation(locationId) {
        return this.db.selectFrom('shifts')
            .selectAll()
            .where('location_id', '=', locationId)
            .orderBy('opened_at', 'desc')
            .execute();
    }
    // [x] GET /api/shifts/:id
    async findOne(id) {
        const shift = await this.db.selectFrom('shifts').selectAll().where('id', '=', id).executeTakeFirst();
        if (!shift)
            throw new NotFoundException(`Shift ${id} not found.`);
        // Fetch related drops and payments to provide a detailed summary
        const drops = await this.db.selectFrom('cash_drops').selectAll().where('shift_id', '=', id).execute();
        const payments = await this.db.selectFrom('payments').selectAll().where('shift_id', '=', id).execute();
        return { ...shift, cash_drops: drops, payments };
    }
    // [x] POST /api/shifts/cash-drop
    async recordCashDrop(dto) {
        const shift = await this.db.selectFrom('shifts').selectAll().where('id', '=', dto.shift_id).executeTakeFirst();
        if (!shift)
            throw new NotFoundException('Shift not found.');
        if (shift.status !== 'OPEN')
            throw new ConflictException(`Cannot drop cash on a ${shift.status} shift.`);
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
    async closeShift(dto) {
        return this.db.transaction().execute(async (trx) => {
            const shift = await trx.selectFrom('shifts').selectAll().where('id', '=', dto.shift_id).executeTakeFirst();
            if (!shift)
                throw new NotFoundException('Shift not found.');
            if (shift.status !== 'OPEN')
                throw new ConflictException(`Shift is already ${shift.status}.`);
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
                closed_at: sql `NOW()`,
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
    async forceClose(id) {
        const shift = await this.db.selectFrom('shifts').selectAll().where('id', '=', id).executeTakeFirst();
        if (!shift)
            throw new NotFoundException('Shift not found.');
        if (shift.status !== 'OPEN')
            throw new ConflictException(`Shift is already ${shift.status}.`);
        return this.db.updateTable('shifts')
            .set({
            status: 'FORCE_CLOSED',
            closed_at: sql `NOW()`,
            // Leaving actual_cash and variance null deliberately so audits flag this record
        })
            .where('id', '=', id)
            .returningAll()
            .executeTakeFirstOrThrow();
    }
};
ShiftsService = __decorate([
    Injectable(),
    __param(0, Inject('DB_INSTANCE')),
    __metadata("design:paramtypes", [Kysely])
], ShiftsService);
export { ShiftsService };

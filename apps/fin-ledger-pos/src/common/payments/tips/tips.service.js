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
// src/payments/tips.service.ts
import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
let TipsService = class TipsService {
    db;
    constructor(db) {
        this.db = db;
    }
    // [x] PATCH /api/payments/:id/tip
    async adjustTip(id, dto) {
        return this.db.transaction().execute(async (trx) => {
            const payment = await trx.selectFrom('payments')
                .selectAll()
                .where('id', '=', id)
                .executeTakeFirst();
            if (!payment) {
                throw new NotFoundException(`Payment ${id} not found.`);
            }
            // Usually, tips are added to AUTHORIZED or CAPTURED payments
            if (payment.status === 'VOIDED' || payment.status === 'FAILED') {
                throw new ConflictException(`Cannot add a tip to a ${payment.status} payment.`);
            }
            const currentTip = Number(payment.tip_amount || 0);
            const newTip = dto.amount;
            const tipDelta = newTip - currentTip;
            // If they submit the exact same tip amount, do nothing to spare the ledger
            if (tipDelta === 0) {
                return payment;
            }
            // 1. Update the absolute tip amount on the state record
            const updatedPayment = await trx.updateTable('payments')
                .set({
                tip_amount: newTip,
                updated_at: sql `NOW()`,
            })
                .where('id', '=', id)
                .returningAll()
                .executeTakeFirstOrThrow();
            // 2. Write the delta to the Immutable Ledger
            await trx.insertInto('payment_ledger')
                .values({
                payment_id: id,
                entry_type: 'TIP_ADDED',
                amount: tipDelta, // Negative delta handles tip reductions properly
                currency: payment.currency,
                metadata: JSON.stringify({ previous_tip: currentTip, new_tip: newTip }),
            })
                .execute();
            return updatedPayment;
        });
    }
    // [x] GET /api/locations/:id/reports/tips
    async getTipTotals(locationId, query) {
        let q = this.db.selectFrom('payments')
            .innerJoin('shifts', 'payments.shift_id', 'shifts.id')
            .select([
            'shifts.cashier_id',
            ({ fn }) => fn.sum('payments.tip_amount').as('total_tips'),
            ({ fn }) => fn.count('payments.id').as('tipped_transactions')
        ])
            .where('shifts.location_id', '=', locationId)
            .where('payments.tip_amount', '>', '0')
            .where('payments.status', 'in', ['CAPTURED', 'AUTHORIZED'])
            .groupBy('shifts.cashier_id');
        if (query.start_date) {
            q = q.where('payments.created_at', '>=', new Date(query.start_date));
        }
        if (query.end_date) {
            q = q.where('payments.created_at', '<=', new Date(query.end_date));
        }
        const breakdown = await q.execute();
        // Calculate Grand Total for the location
        const locationTotal = breakdown.reduce((acc, row) => acc + Number(row.total_tips || 0), 0);
        return {
            location_id: locationId,
            date_range: {
                start: query.start_date || 'beginning of time',
                end: query.end_date || 'now',
            },
            grand_total_tips: locationTotal,
            cashier_breakdown: breakdown.map(b => ({
                cashier_id: b.cashier_id,
                total_tips: Number(b.total_tips),
                tipped_transactions: Number(b.tipped_transactions),
            })),
        };
    }
};
TipsService = __decorate([
    Injectable(),
    __param(0, Inject('DB_INSTANCE')),
    __metadata("design:paramtypes", [Kysely])
], TipsService);
export { TipsService };

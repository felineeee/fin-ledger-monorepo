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
// src/payments/capture.service.ts
import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
let CaptureService = class CaptureService {
    db;
    constructor(db) {
        this.db = db;
    }
    // [x] POST /api/payments/:id/capture-cash
    async captureCash(id) {
        return this.db.transaction().execute(async (trx) => {
            const payment = await trx.selectFrom('payments').selectAll().where('id', '=', id).executeTakeFirst();
            if (!payment)
                throw new NotFoundException(`Payment ${id} not found.`);
            if (payment.status !== 'PENDING')
                throw new ConflictException(`Cannot capture cash. Payment is in ${payment.status} state.`);
            if (payment.channel !== 'IN_PERSON')
                throw new ConflictException('This endpoint only supports IN_PERSON channel payments.');
            // 1. Update State
            const captured = await trx.updateTable('payments')
                .set({
                status: 'CAPTURED',
                updated_at: sql `NOW()`
            })
                .where('id', '=', id)
                .returningAll()
                .executeTakeFirstOrThrow();
            // 2. Write Realization to Ledger
            await trx.insertInto('payment_ledger')
                .values({
                payment_id: id,
                entry_type: 'CAPTURED',
                amount: payment.amount,
                currency: payment.currency,
            })
                .execute();
            return captured;
        });
    }
    // [x] POST /api/payments/:id/capture-card-present
    async captureCardPresent(id, dto) {
        return this.db.transaction().execute(async (trx) => {
            const payment = await trx.selectFrom('payments').selectAll().where('id', '=', id).executeTakeFirst();
            if (!payment)
                throw new NotFoundException(`Payment ${id} not found.`);
            if (payment.status !== 'PENDING' && payment.status !== 'AUTHORIZED') {
                throw new ConflictException(`Cannot capture card. Payment is in ${payment.status} state.`);
            }
            const captured = await trx.updateTable('payments')
                .set({
                status: 'CAPTURED',
                updated_at: sql `NOW()`
            })
                .where('id', '=', id)
                .returningAll()
                .executeTakeFirstOrThrow();
            // Write Realization to Ledger (storing terminal metadata)
            await trx.insertInto('payment_ledger')
                .values({
                payment_id: id,
                entry_type: 'CAPTURED',
                amount: payment.amount,
                currency: payment.currency,
                metadata: JSON.stringify({
                    auth_code: dto.auth_code,
                    entry_method: dto.entry_method,
                }),
            })
                .execute();
            return captured;
        });
    }
    // [x] POST /api/payments/:id/cancel
    async cancel(id) {
        return this.db.transaction().execute(async (trx) => {
            const payment = await trx.selectFrom('payments').selectAll().where('id', '=', id).executeTakeFirst();
            if (!payment)
                throw new NotFoundException(`Payment ${id} not found.`);
            if (payment.status !== 'PENDING' && payment.status !== 'AUTHORIZED') {
                throw new ConflictException(`Cannot cancel. Payment is in ${payment.status} state. It must be uncaptured.`);
            }
            const voided = await trx.updateTable('payments')
                .set({
                status: 'VOIDED',
                updated_at: sql `NOW()`
            })
                .where('id', '=', id)
                .returningAll()
                .executeTakeFirstOrThrow();
            // Write Reversal to Ledger (Negative amount to zero out the pending expectation)
            await trx.insertInto('payment_ledger')
                .values({
                payment_id: id,
                entry_type: 'VOIDED',
                amount: sql `${payment.amount} * -1`,
                currency: payment.currency,
            })
                .execute();
            return voided;
        });
    }
    // [x] POST /api/payments/:id/reverse
    async reverse(id, dto) {
        return this.db.transaction().execute(async (trx) => {
            const payment = await trx.selectFrom('payments').selectAll().where('id', '=', id).executeTakeFirst();
            if (!payment)
                throw new NotFoundException(`Payment ${id} not found.`);
            if (payment.status !== 'CAPTURED') {
                throw new ConflictException(`Cannot reverse. Payment is in ${payment.status} state. Only CAPTURED payments can be reversed.`);
            }
            // 1. Same-day reversals push the payment state straight to VOIDED
            const reversed = await trx.updateTable('payments')
                .set({
                status: 'VOIDED',
                updated_at: sql `NOW()`
            })
                .where('id', '=', id)
                .returningAll()
                .executeTakeFirstOrThrow();
            // 2. Write Reversal to Ledger (Negative amount reverses the actual captured funds)
            await trx.insertInto('payment_ledger')
                .values({
                payment_id: id,
                entry_type: 'VOIDED',
                amount: sql `${payment.amount} * -1`,
                currency: payment.currency,
                metadata: JSON.stringify({ reason: dto.reason }),
            })
                .execute();
            return reversed;
        });
    }
};
CaptureService = __decorate([
    Injectable(),
    __param(0, Inject('DB_INSTANCE')),
    __metadata("design:paramtypes", [Kysely])
], CaptureService);
export { CaptureService };

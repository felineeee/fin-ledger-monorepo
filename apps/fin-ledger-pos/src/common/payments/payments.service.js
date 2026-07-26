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
// src/payments/payments.service.ts
import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
let PaymentsService = class PaymentsService {
    db;
    constructor(db) {
        this.db = db;
    }
    // [x] POST /api/payments
    async createPayment(dto, idempotencyKey) {
        // 1. Enforce physical constraints
        if (dto.channel === 'IN_PERSON' && !dto.shift_id) {
            throw new ConflictException('shift_id is required for IN_PERSON payments.');
        }
        // 2. Check Idempotency Outside Transaction (Fast failure)
        if (idempotencyKey) {
            const existing = await this.db.selectFrom('payments')
                .selectAll()
                .where('idempotency_key', '=', idempotencyKey)
                .executeTakeFirst();
            if (existing)
                return existing;
        }
        // 3. Transactional Write to State & Ledger
        return this.db.transaction().execute(async (trx) => {
            const payment = await trx.insertInto('payments')
                .values({
                order_id: dto.order_id,
                payment_method_id: dto.payment_method_id,
                shift_id: dto.shift_id ?? null,
                terminal_id: dto.terminal_id ?? null,
                channel: dto.channel,
                amount: dto.amount,
                status: 'PENDING',
                idempotency_key: idempotencyKey ?? null,
            })
                .returningAll()
                .executeTakeFirstOrThrow();
            // Write Immutable Ledger Event (Positive expectation)
            await trx.insertInto('payment_ledger')
                .values({
                payment_id: payment.id,
                entry_type: 'PAYMENT_CREATED',
                amount: dto.amount,
                currency: payment.currency,
            })
                .execute();
            return payment;
        });
    }
    // [x] GET /api/payments
    async findAll() {
        return this.db
            .selectFrom('payments')
            .selectAll()
            .orderBy('created_at', 'desc')
            .execute();
    }
    // [x] GET /api/payments/:id
    async findOne(id) {
        const payment = await this.db
            .selectFrom('payments')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirst();
        if (!payment) {
            throw new NotFoundException(`Payment with ID ${id} not found.`);
        }
        return payment;
    }
    // [x] GET /api/orders/:orderId/payments
    async findByOrderId(orderId) {
        return this.db
            .selectFrom('payments')
            .selectAll()
            .where('order_id', '=', orderId)
            .orderBy('created_at', 'desc')
            .execute();
    }
    // [x] PATCH /api/payments/:id
    async updatePayment(id, dto) {
        const payment = await this.findOne(id);
        // Core Business Rule: Only edit if PENDING
        if (payment.status !== 'PENDING') {
            throw new ConflictException(`Cannot edit a payment in ${payment.status} state. Void and recreate instead.`);
        }
        const updatePayload = { updated_at: sql `NOW()` };
        if (dto.amount !== undefined)
            updatePayload.amount = dto.amount;
        if (dto.payment_method_id !== undefined)
            updatePayload.payment_method_id = dto.payment_method_id;
        if (Object.keys(updatePayload).length === 1)
            return payment; // Only updated_at is present
        return this.db
            .updateTable('payments')
            .set(updatePayload)
            .where('id', '=', id)
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    // [x] DELETE /api/payments/:id
    async cancelPayment(id) {
        return this.db.transaction().execute(async (trx) => {
            const payment = await trx.selectFrom('payments')
                .selectAll()
                .where('id', '=', id)
                .executeTakeFirstOrThrow(() => new NotFoundException(`Payment ${id} not found`));
            // Can only void if money hasn't moved yet
            if (payment.status !== 'PENDING' && payment.status !== 'AUTHORIZED') {
                throw new ConflictException(`Cannot cancel payment in ${payment.status} state. Issue a refund instead.`);
            }
            // 1. Set State to VOIDED
            const updated = await trx.updateTable('payments')
                .set({ status: 'VOIDED', updated_at: sql `NOW()` })
                .where('id', '=', id)
                .returningAll()
                .executeTakeFirstOrThrow();
            // 2. Balance the Ledger (Negative entry to zero out the PAYMENT_CREATED expectation)
            await trx.insertInto('payment_ledger')
                .values({
                payment_id: id,
                entry_type: 'VOIDED',
                amount: sql `${payment.amount} * -1`,
                currency: payment.currency,
            })
                .execute();
            return updated;
        });
    }
};
PaymentsService = __decorate([
    Injectable(),
    __param(0, Inject('DB_INSTANCE')),
    __metadata("design:paramtypes", [Kysely])
], PaymentsService);
export { PaymentsService };

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
// src/payments/split.service.ts
import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
let SplitTenderService = class SplitTenderService {
    db;
    constructor(db) {
        this.db = db;
    }
    // [x] POST /api/orders/:orderId/payments/split
    async processSplitTender(orderId, dto, idempotencyKey) {
        // 1. Validation constraints
        for (const item of dto.payments) {
            if (item.channel === 'IN_PERSON' && !item.shift_id) {
                throw new ConflictException('shift_id is required for all IN_PERSON payment parts.');
            }
        }
        // 2. Idempotency Check
        if (idempotencyKey) {
            const existing = await this.db
                .selectFrom('payments')
                .selectAll()
                .where('idempotency_key', '=', idempotencyKey)
                .execute();
            if (existing.length > 0)
                return existing;
        }
        // 3. Atomic Transaction
        return this.db.transaction().execute(async (trx) => {
            const processedPayments = [];
            for (const [index, item] of dto.payments.entries()) {
                // Append an index to the idempotency key so each row has a unique identifier
                const rowIdempotency = idempotencyKey
                    ? `${idempotencyKey}-part-${index}`
                    : null;
                // Insert Payment (Assume split tenders submitted together are already CAPTURED/Finalized at the POS)
                const payment = await trx
                    .insertInto('payments')
                    .values({
                    order_id: orderId,
                    payment_method_id: item.payment_method_id,
                    shift_id: item.shift_id ?? null,
                    terminal_id: item.terminal_id ?? null,
                    channel: item.channel,
                    amount: item.amount,
                    status: 'CAPTURED', // Skip PENDING since split tenders are usually executed atomically post-auth
                    idempotency_key: rowIdempotency,
                })
                    .returningAll()
                    .executeTakeFirstOrThrow();
                // Write Immutable Ledger Event
                await trx
                    .insertInto('payment_ledger')
                    .values({
                    payment_id: payment.id,
                    entry_type: 'CAPTURED',
                    amount: item.amount,
                    currency: payment.currency,
                    metadata: JSON.stringify(item.auth_code ? { auth_code: item.auth_code } : {}),
                })
                    .execute();
                processedPayments.push(payment);
            }
            return processedPayments;
        });
    }
    // [x] GET /api/orders/:orderId/payments/balance
    async getOrderBalance(orderId, query) {
        const orderTotal = query.order_total;
        // Sum all successful captures for this order
        const result = await this.db
            .selectFrom('payments')
            .select(({ fn }) => fn.sum('amount').as('total_paid'))
            .where('order_id', '=', orderId)
            .where('status', 'in', ['CAPTURED', 'AUTHORIZED']) // Include authorized funds that hold balance
            .executeTakeFirst();
        const totalPaid = Number(result?.total_paid || 0);
        const balanceRemaining = orderTotal - totalPaid;
        return {
            order_id: orderId,
            order_total: orderTotal,
            total_paid: totalPaid,
            balance_remaining: balanceRemaining > 0 ? balanceRemaining : 0,
            is_fully_paid: balanceRemaining <= 0,
            overpaid_amount: balanceRemaining < 0 ? Math.abs(balanceRemaining) : 0,
        };
    }
};
SplitTenderService = __decorate([
    Injectable(),
    __param(0, Inject('DB_INSTANCE')),
    __metadata("design:paramtypes", [Kysely])
], SplitTenderService);
export { SplitTenderService };

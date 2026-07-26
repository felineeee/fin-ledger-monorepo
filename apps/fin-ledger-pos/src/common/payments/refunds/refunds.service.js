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
// src/payments/refunds.service.ts
import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
let RefundsService = class RefundsService {
    db;
    constructor(db) {
        this.db = db;
    }
    // [x] POST /api/payments/:id/refunds
    async issueRefund(paymentId, dto) {
        return this.db.transaction().execute(async (trx) => {
            const payment = await trx.selectFrom('payments')
                .selectAll()
                .where('id', '=', paymentId)
                .executeTakeFirst();
            if (!payment)
                throw new NotFoundException(`Payment ${paymentId} not found.`);
            if (payment.status !== 'CAPTURED' && payment.status !== 'PARTIALLY_REFUNDED') {
                throw new ConflictException(`Cannot refund a payment in ${payment.status} state.`);
            }
            // Calculate total amount already refunded or currently pending
            const existingRefunds = await trx.selectFrom('refunds')
                .select(({ fn }) => fn.sum('amount').as('total_refunded'))
                .where('payment_id', '=', paymentId)
                .where('status', 'in', ['PENDING', 'COMPLETED'])
                .executeTakeFirst();
            const totalRefunded = Number(existingRefunds?.total_refunded || 0);
            const remainingBalance = Number(payment.amount) - totalRefunded;
            if (dto.amount > remainingBalance) {
                throw new ConflictException(`Refund amount (${dto.amount}) exceeds the remaining refundable balance (${remainingBalance}).`);
            }
            // Initialize the refund in PENDING state
            return trx.insertInto('refunds')
                .values({
                payment_id: paymentId,
                amount: dto.amount,
                reason: dto.reason ?? null,
                status: 'PENDING',
            })
                .returningAll()
                .executeTakeFirstOrThrow();
        });
    }
    // [x] GET /api/payments/:id/refunds
    async getRefundsByPayment(paymentId) {
        return this.db.selectFrom('refunds')
            .selectAll()
            .where('payment_id', '=', paymentId)
            .orderBy('created_at', 'desc')
            .execute();
    }
    // [x] GET /api/refunds
    async getAllRefunds() {
        return this.db.selectFrom('refunds')
            .selectAll()
            .orderBy('created_at', 'desc')
            .execute();
    }
    // [x] GET /api/refunds/:id
    async getRefundById(id) {
        const refund = await this.db.selectFrom('refunds')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirst();
        if (!refund)
            throw new NotFoundException(`Refund ${id} not found.`);
        return refund;
    }
    // [x] PATCH /api/refunds/:id/status
    async updateRefundStatus(id, dto) {
        return this.db.transaction().execute(async (trx) => {
            const refund = await trx.selectFrom('refunds').selectAll().where('id', '=', id).executeTakeFirst();
            if (!refund)
                throw new NotFoundException(`Refund ${id} not found.`);
            // Prevent redundant updates
            if (refund.status === dto.status)
                return refund;
            // Once completed or failed, it's terminal
            if (refund.status === 'COMPLETED' || refund.status === 'FAILED') {
                throw new ConflictException(`Cannot change status of a ${refund.status} refund.`);
            }
            // 1. Update the Refund Record
            const updatedRefund = await trx.updateTable('refunds')
                .set({
                status: dto.status,
                updated_at: sql `NOW()`
            })
                .where('id', '=', id)
                .returningAll()
                .executeTakeFirstOrThrow();
            // 2. If it completed, we must update the ledger and payment status
            if (dto.status === 'COMPLETED') {
                const payment = await trx.selectFrom('payments').selectAll().where('id', '=', refund.payment_id).executeTakeFirstOrThrow();
                // Write the negative financial event to the ledger
                await trx.insertInto('payment_ledger')
                    .values({
                    payment_id: payment.id,
                    entry_type: 'REFUNDED',
                    amount: sql `${refund.amount} * -1`,
                    currency: payment.currency,
                    metadata: JSON.stringify({ refund_id: refund.id, reason: refund.reason }),
                })
                    .execute();
                // Determine if this makes the payment FULLY or PARTIALLY refunded
                const completedRefunds = await trx.selectFrom('refunds')
                    .select(({ fn }) => fn.sum('amount').as('total_completed'))
                    .where('payment_id', '=', payment.id)
                    .where('status', '=', 'COMPLETED')
                    .executeTakeFirst();
                const totalCompleted = Number(completedRefunds?.total_completed || 0);
                const newPaymentStatus = totalCompleted >= Number(payment.amount) ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
                await trx.updateTable('payments')
                    .set({
                    status: newPaymentStatus,
                    updated_at: sql `NOW()`
                })
                    .where('id', '=', payment.id)
                    .execute();
            }
            return updatedRefund;
        });
    }
};
RefundsService = __decorate([
    Injectable(),
    __param(0, Inject('DB_INSTANCE')),
    __metadata("design:paramtypes", [Kysely])
], RefundsService);
export { RefundsService };

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
// src/payments/disputes.service.ts
import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
let DisputesService = class DisputesService {
    db;
    constructor(db) {
        this.db = db;
    }
    // [x] GET /api/disputes
    async getAllDisputes() {
        return this.db.selectFrom('disputes').selectAll().orderBy('created_at', 'desc').execute();
    }
    // [x] GET /api/disputes/:id
    async getDisputeDetails(id) {
        const dispute = await this.db.selectFrom('disputes').selectAll().where('id', '=', id).executeTakeFirst();
        if (!dispute)
            throw new NotFoundException(`Dispute ${id} not found.`);
        return dispute;
    }
    // [x] POST /api/disputes/:id/respond
    async respondToDispute(id, dto) {
        const dispute = await this.getDisputeDetails(id);
        if (dispute.status !== 'PENDING') {
            throw new ConflictException(`Cannot respond to a dispute that is already ${dispute.status}.`);
        }
        return this.db.updateTable('disputes')
            .set({
            evidence_text: dto.evidence_text,
            evidence_url: dto.evidence_url ?? null,
            updated_at: sql `NOW()`,
        })
            .where('id', '=', id)
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    // [x] PATCH /api/disputes/:id/status
    async updateDisputeStatus(id, dto) {
        return this.db.transaction().execute(async (trx) => {
            const dispute = await trx.selectFrom('disputes').selectAll().where('id', '=', id).executeTakeFirstOrThrow();
            const updated = await trx.updateTable('disputes')
                .set({ status: dto.status, updated_at: sql `NOW()` })
                .where('id', '=', id)
                .returningAll()
                .executeTakeFirstOrThrow();
            // If the merchant lost the chargeback, we must reverse the captured funds in the ledger
            if (dto.status === 'LOST') {
                const payment = await trx.selectFrom('payments').selectAll().where('id', '=', dispute.payment_id).executeTakeFirstOrThrow();
                await trx.updateTable('payments')
                    .set({ status: 'VOIDED', updated_at: sql `NOW()` })
                    .where('id', '=', payment.id)
                    .execute();
                await trx.insertInto('payment_ledger')
                    .values({
                    payment_id: payment.id,
                    entry_type: 'VOIDED',
                    amount: sql `${dispute.amount} * -1`,
                    currency: payment.currency,
                    metadata: JSON.stringify({ reason: 'CHARGEBACK_LOST', dispute_id: dispute.id }),
                })
                    .execute();
            }
            return updated;
        });
    }
};
DisputesService = __decorate([
    Injectable(),
    __param(0, Inject('DB_INSTANCE')),
    __metadata("design:paramtypes", [Kysely])
], DisputesService);
export { DisputesService };

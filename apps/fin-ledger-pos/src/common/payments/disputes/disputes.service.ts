// src/payments/disputes.service.ts
import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB } from '../../../db/types.js';
import { DisputeResponseDto, UpdateDisputeStatusDto } from '../dto/webhooks.dto.js';

@Injectable()
export class DisputesService {
  constructor(@Inject('DB_INSTANCE') private readonly db: Kysely<DB>) {}

  // [x] GET /api/disputes
  async getAllDisputes() {
    return this.db.selectFrom('disputes').selectAll().orderBy('created_at', 'desc').execute();
  }

  // [x] GET /api/disputes/:id
  async getDisputeDetails(id: string) {
    const dispute = await this.db.selectFrom('disputes').selectAll().where('id', '=', id).executeTakeFirst();
    if (!dispute) throw new NotFoundException(`Dispute ${id} not found.`);
    return dispute;
  }

  // [x] POST /api/disputes/:id/respond
  async respondToDispute(id: string, dto: DisputeResponseDto) {
    const dispute = await this.getDisputeDetails(id);
    
    if (dispute.status !== 'PENDING') {
      throw new ConflictException(`Cannot respond to a dispute that is already ${dispute.status}.`);
    }

    return this.db.updateTable('disputes')
      .set({
        evidence_text: dto.evidence_text,
        evidence_url: dto.evidence_url ?? null,
        updated_at: sql`NOW()`,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  // [x] PATCH /api/disputes/:id/status
  async updateDisputeStatus(id: string, dto: UpdateDisputeStatusDto) {
    return this.db.transaction().execute(async (trx) => {
      const dispute = await trx.selectFrom('disputes').selectAll().where('id', '=', id).executeTakeFirstOrThrow();
      
      const updated = await trx.updateTable('disputes')
        .set({ status: dto.status, updated_at: sql`NOW()` })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow();

      // If the merchant lost the chargeback, we must reverse the captured funds in the ledger
      if (dto.status === 'LOST') {
        const payment = await trx.selectFrom('payments').selectAll().where('id', '=', dispute.payment_id).executeTakeFirstOrThrow();
        
        await trx.updateTable('payments')
          .set({ status: 'VOIDED', updated_at: sql`NOW()` })
          .where('id', '=', payment.id)
          .execute();

        await trx.insertInto('payment_ledger')
          .values({
            payment_id: payment.id,
            entry_type: 'VOIDED',
            amount: sql`${dispute.amount} * -1`, 
            currency: payment.currency,
            metadata: JSON.stringify({ reason: 'CHARGEBACK_LOST', dispute_id: dispute.id }),
          })
          .execute();
      }

      return updated;
    });
  }
}
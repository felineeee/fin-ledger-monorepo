// src/payments/disputes.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB } from '../../../db/types.js';
import {
  DisputeResponseDto,
  UpdateDisputeStatusDto,
} from '../dto/webhooks.dto.js';
import { KYSELY_DB } from '@fin-ledger/databases';

@Injectable()
export class DisputesService {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<DB>) {}

  // [x] GET /api/disputes
  async getAllDisputes() {
    return this.db
      .selectFrom('disputes')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
  }

  // [x] GET /api/disputes/:id
  async getDisputeDetails(id: string) {
    const dispute = await this.db
      .selectFrom('disputes')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!dispute) throw new NotFoundException(`Dispute ${id} not found.`);
    return dispute;
  }

  // [x] POST /api/disputes/:id/respond
  async respondToDispute(id: string, dto: DisputeResponseDto) {
    const dispute = await this.getDisputeDetails(id);

    if (dispute.status !== 'PENDING') {
      throw new ConflictException(
        `Cannot respond to a dispute that is already ${dispute.status}.`,
      );
    }

    try {
      return await this.db
        .updateTable('disputes')
        .set({
          evidence_text: dto.evidence_text,
          evidence_url: dto.evidence_url ?? null,
          updated_at: sql`NOW()`,
        })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error) {
      throw new BadRequestException(
        `Failed to submit dispute evidence: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // [x] PATCH /api/disputes/:id/status
  async updateDisputeStatus(id: string, dto: UpdateDisputeStatusDto) {
    return this.db.transaction().execute(async (trx) => {
      const dispute = await trx
        .selectFrom('disputes')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();

      if (!dispute) throw new NotFoundException(`Dispute ${id} not found.`);

      const updated = await trx
        .updateTable('disputes')
        .set({ status: dto.status, updated_at: sql`NOW()` })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow();

      // If the merchant lost the chargeback, reverse the captured funds in the ledger & update payment
      if (dto.status === 'LOST') {
        const payment = await trx
          .selectFrom('payments')
          .selectAll()
          .where('id', '=', dispute.payment_id)
          .executeTakeFirst();

        if (payment) {
          await trx
            .updateTable('payments')
            .set({ status: 'VOIDED', updated_at: sql`NOW()` })
            .where('id', '=', payment.id)
            .execute();

          await trx
            .insertInto('payment_ledger')
            .values({
              payment_id: payment.id,
              entry_type: 'VOIDED',
              amount: sql`${dispute.amount} * -1`,
              currency: payment.currency || 'IDR',
              metadata: JSON.stringify({
                reason: 'CHARGEBACK_LOST',
                dispute_id: dispute.id,
              }),
            })
            .execute();
        }
      }

      return updated;
    });
  }
}

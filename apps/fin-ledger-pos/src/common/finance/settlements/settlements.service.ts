import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB } from '../../../db/types.js';

@Injectable()
export class SettlementsService {
  constructor(@Inject('DB_INSTANCE') private readonly db: Kysely<DB>) {}

  // [x] GET /api/settlements
  async getSettlements() {
    return this.db
      .selectFrom('settlements')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
  }

  // [x] GET /api/settlements/:id
  async getSettlementById(id: string) {
    const settlement = await this.db
      .selectFrom('settlements')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!settlement) throw new NotFoundException(`Settlement ${id} not found.`);
    return settlement;
  }

  // [x] POST /api/settlements/:id/mark-paid
  async markSettlementPaid(id: string) {
    const settlement = await this.getSettlementById(id);
    if (settlement.status === 'PAID')
      throw new ConflictException('Settlement is already marked as PAID.');

    return this.db
      .updateTable('settlements')
      .set({
        status: 'PAID',
        settled_at: sql`NOW()`,
        updated_at: sql`NOW()`,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}

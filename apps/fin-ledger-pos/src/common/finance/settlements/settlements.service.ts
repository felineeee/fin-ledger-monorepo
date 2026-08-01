// src/common/finance/settlements/settlements.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DB } from '../../../db/types.js';
import {
  QuerySettlementsDto,
  MarkSettlementPaidDto,
} from '../dto/finance.dto.js';
import { KYSELY_DB } from '@fin-ledger/databases';

@Injectable()
export class SettlementsService {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<DB>) {}

  // [x] GET /api/settlements
  async getSettlements(query: QuerySettlementsDto) {
    const {
      provider,
      status,
      start_date,
      end_date,
      page = 1,
      limit = 20,
    } = query;
    const offset = (page - 1) * limit;

    let baseQuery = this.db.selectFrom('settlements');

    if (provider) {
      baseQuery = baseQuery.where('provider', '=', provider);
    }
    if (status) {
      baseQuery = baseQuery.where('status', '=', status); // @ TODO tba
    }
    if (start_date) {
      baseQuery = baseQuery.where(sql`DATE(created_at)`, '>=', start_date);
    }
    if (end_date) {
      baseQuery = baseQuery.where(sql`DATE(created_at)`, '<=', end_date);
    }

    const countResult = await baseQuery
      .select((eb) => eb.fn.count<number>('id').as('total'))
      .executeTakeFirst();

    const total = Number(countResult?.total || 0);

    const data = await baseQuery
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // [x] GET /api/settlements/:id
  async getSettlementById(id: string) {
    const settlement = await this.db
      .selectFrom('settlements')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!settlement) {
      throw new NotFoundException(`Settlement with ID ${id} not found.`);
    }

    return settlement;
  }

  // [x] POST /api/settlements/:id/mark-paid
  async markSettlementPaid(id: string, dto: MarkSettlementPaidDto) {
    const settlement = await this.getSettlementById(id);

    if (settlement.status === 'PAID') {
      throw new BadRequestException('Settlement is already marked as PAID.');
    }

    const settledAt = dto.actual_deposit_date
      ? new Date(dto.actual_deposit_date)
      : (sql`NOW()` as any);

    const updated = await this.db
      .updateTable('settlements')
      .set({
        status: 'PAID',
        settled_at: settledAt,
        updated_at: sql`NOW()`,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      message: 'Settlement successfully marked as paid.',
      settlement: updated,
    };
  }
}

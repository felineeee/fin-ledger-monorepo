import {
  Inject,
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { Kysely, KYSELY_DB, PG_POOL } from '@fin-ledger/databases';
import { LedgerRepository } from './ledger.repository.js';
import * as crypto from 'crypto';
import { DB } from '../../db/types.js';
import { QueryLedgerDto } from './dto/query-ledger.dto.js';
@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly ledgerRepository: LedgerRepository,
    @Inject(KYSELY_DB) private readonly db: Kysely<DB>,
  ) {}

  async executeTransfer(
    senderUserId: string,
    targetAccountId: string,
    sourceAccountId: string,
    amount: bigint,
    description?: string,
  ): Promise<{ transaction_id: string }> {
    const client: PoolClient = await this.pool.connect();
    const transactionId = crypto.randomUUID();

    this.logger.log({
      message: 'Initiating atomic ledger asset transfer transaction block',
      senderUserId,
      targetAccountId: targetAccountId,
      amountCents: amount.toString(),
    });

    try {
      await client.query('BEGIN');

      const senderAccountQuery = `
        SELECT id, balance FROM account_snapshots 
        WHERE id = $1 AND user_id = $2;
      `;
      const senderAccountRes = await client.query(senderAccountQuery, [
        sourceAccountId,
        senderUserId,
      ]);

      if (senderAccountRes.rows.length === 0) {
        throw new NotFoundException('Source account profile record not found');
      }

      const senderAccountId = senderAccountRes.rows[0].id;
      if (senderAccountId === targetAccountId) {
        throw new BadRequestException(
          'Asset transfer cannot execute out of and into the identical account destination target',
        );
      }

      const lockOrderIds = [sourceAccountId, targetAccountId].sort();
      for (const accountIdToLock of lockOrderIds) {
        await client.query(
          `SELECT balance FROM account_snapshots WHERE id = $1 FOR UPDATE;`,
          [accountIdToLock],
        );
      }

      const freshSenderRes = await client.query(
        `SELECT balance FROM account_snapshots WHERE id = $1;`,
        [senderAccountId],
      );
      const senderCurrentBalance = BigInt(freshSenderRes.rows[0].balance);

      if (senderCurrentBalance < amount) {
        throw new BadRequestException(
          'Transaction rejected: Insufficient available funds within the source wallet snapshot',
        );
      }

      const targetCheckRes = await client.query(
        `SELECT balance FROM account_snapshots WHERE id = $1;`,
        [targetAccountId],
      );
      if (targetCheckRes.rows.length === 0) {
        throw new NotFoundException(
          'Target destination account profile record not found',
        );
      }
      const targetCurrentBalance = BigInt(targetCheckRes.rows[0].balance);

      const deductQuery = `UPDATE account_snapshots SET balance = balance - $1, updated_at = NOW() WHERE id = $2;`;
      await client.query(deductQuery, [amount.toString(), sourceAccountId]);

      const creditQuery = `UPDATE account_snapshots SET balance = balance + $1, updated_at = NOW() WHERE id = $2;`;
      await client.query(creditQuery, [amount.toString(), targetAccountId]);

      const senderPreviousHash = await this.ledgerRepository.getLastEntryHash(
        senderAccountId,
        client,
      );
      await this.ledgerRepository.insertLedgerEntry(
        {
          transaction_id: transactionId,
          account_id: senderAccountId,
          amount: -amount,
          description: description || 'Point-to-point transfer asset debit',
          previous_hash: senderPreviousHash,
        },
        client,
      );

      const targetPreviousHash = await this.ledgerRepository.getLastEntryHash(
        targetAccountId,
        client,
      );
      await this.ledgerRepository.insertLedgerEntry(
        {
          transaction_id: transactionId,
          account_id: targetAccountId,
          amount: amount,
          description: description || 'Point-to-point transfer asset credit',
          previous_hash: targetPreviousHash,
        },
        client,
      );

      await client.query('COMMIT');
      return { transaction_id: transactionId };
    } catch (error) {
      await client.query('ROLLBACK');

      if (error instanceof HttpException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new InternalServerErrorException(
        `Fintech Transfer Engine Exception Failure: ${errorMessage}`,
      );
    } finally {
      client.release();
    }
  }
  async createAccount(
    userId: string,
    type: string = 'primary',
    currency: string = 'USD',
  ): Promise<{ account_id: string }> {
    const query = `
      INSERT INTO account_snapshots (user_id, balance, type, currency)
      VALUES ($1, 0, $2, $3)
      RETURNING id;
    `;
    const res = await this.pool.query(query, [userId, type, currency]);
    return { account_id: res.rows[0].id };
  }

  // [x] GET /api/payments/ledger
  async getLedgerEntries(query: QueryLedgerDto) {
    const {
      payment_id,
      entry_type,
      start_date,
      end_date,
      page = 1,
      limit = 20,
    } = query;
    const offset = (page - 1) * limit;

    let baseQuery = this.db.selectFrom('payment_ledger');

    if (payment_id) {
      baseQuery = baseQuery.where('payment_id', '=', payment_id);
    }
    if (entry_type) {
      baseQuery = baseQuery.where('entry_type', '=', entry_type); // @ TODO Check type after migration
    }
    if (start_date) {
      baseQuery = baseQuery.where('created_at', '>=', new Date(start_date));
    }
    if (end_date) {
      baseQuery = baseQuery.where('created_at', '<=', new Date(end_date));
    }

    // Fetch total count for pagination metadata
    const countResult = await baseQuery
      .select((eb) => eb.fn.count<number>('id').as('total'))
      .executeTakeFirst();

    const total = Number(countResult?.total || 0);

    // Fetch paginated rows
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

  // [x] GET /api/payments/ledger/:id
  async getLedgerEntryById(id: string) {
    const entry = await this.db
      .selectFrom('payment_ledger')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!entry) {
      throw new NotFoundException(`Ledger entry with ID ${id} not found`);
    }

    return entry;
  }
}

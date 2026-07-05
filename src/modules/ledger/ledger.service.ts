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
import { PG_POOL } from 'src/common/database/database.module';
import { LedgerRepository } from './ledger.repository';
import * as crypto from 'crypto';
@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly ledgerRepository: LedgerRepository,
  ) {}

  async executeTransfer(
    senderUserId: string,
    targetAccountId: string,
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
      const senderAccountQuery = `SELECT id, balance FROM account_snapshots WHERE user_id = $1 LIMIT 1;`;
      const senderAccountRes = await client.query(senderAccountQuery, [
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

      const lockOrderIds = [senderAccountId, targetAccountId].sort();
      for (const accountIdToLock of lockOrderIds) {
        await client.query(
          `SELECT balance FROM account_snaphots WHERE id = $1 FOR UPDATE;`,
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
      await client.query(deductQuery, [amount.toString(), senderAccountId]);

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
}

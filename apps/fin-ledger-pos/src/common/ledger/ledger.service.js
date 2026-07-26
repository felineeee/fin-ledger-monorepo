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
var LedgerService_1;
import { Inject, Injectable, Logger, BadRequestException, InternalServerErrorException, NotFoundException, HttpException, } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '@fin-ledger/database';
import { LedgerRepository } from './ledger.repository.js';
import * as crypto from 'crypto';
let LedgerService = LedgerService_1 = class LedgerService {
    pool;
    ledgerRepository;
    logger = new Logger(LedgerService_1.name);
    constructor(pool, ledgerRepository) {
        this.pool = pool;
        this.ledgerRepository = ledgerRepository;
    }
    async executeTransfer(senderUserId, targetAccountId, sourceAccountId, amount, description) {
        const client = await this.pool.connect();
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
                throw new BadRequestException('Asset transfer cannot execute out of and into the identical account destination target');
            }
            const lockOrderIds = [sourceAccountId, targetAccountId].sort();
            for (const accountIdToLock of lockOrderIds) {
                await client.query(`SELECT balance FROM account_snapshots WHERE id = $1 FOR UPDATE;`, [accountIdToLock]);
            }
            const freshSenderRes = await client.query(`SELECT balance FROM account_snapshots WHERE id = $1;`, [senderAccountId]);
            const senderCurrentBalance = BigInt(freshSenderRes.rows[0].balance);
            if (senderCurrentBalance < amount) {
                throw new BadRequestException('Transaction rejected: Insufficient available funds within the source wallet snapshot');
            }
            const targetCheckRes = await client.query(`SELECT balance FROM account_snapshots WHERE id = $1;`, [targetAccountId]);
            if (targetCheckRes.rows.length === 0) {
                throw new NotFoundException('Target destination account profile record not found');
            }
            const targetCurrentBalance = BigInt(targetCheckRes.rows[0].balance);
            const deductQuery = `UPDATE account_snapshots SET balance = balance - $1, updated_at = NOW() WHERE id = $2;`;
            await client.query(deductQuery, [amount.toString(), sourceAccountId]);
            const creditQuery = `UPDATE account_snapshots SET balance = balance + $1, updated_at = NOW() WHERE id = $2;`;
            await client.query(creditQuery, [amount.toString(), targetAccountId]);
            const senderPreviousHash = await this.ledgerRepository.getLastEntryHash(senderAccountId, client);
            await this.ledgerRepository.insertLedgerEntry({
                transaction_id: transactionId,
                account_id: senderAccountId,
                amount: -amount,
                description: description || 'Point-to-point transfer asset debit',
                previous_hash: senderPreviousHash,
            }, client);
            const targetPreviousHash = await this.ledgerRepository.getLastEntryHash(targetAccountId, client);
            await this.ledgerRepository.insertLedgerEntry({
                transaction_id: transactionId,
                account_id: targetAccountId,
                amount: amount,
                description: description || 'Point-to-point transfer asset credit',
                previous_hash: targetPreviousHash,
            }, client);
            await client.query('COMMIT');
            return { transaction_id: transactionId };
        }
        catch (error) {
            await client.query('ROLLBACK');
            if (error instanceof HttpException) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new InternalServerErrorException(`Fintech Transfer Engine Exception Failure: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async createAccount(userId, type = 'primary', currency = 'USD') {
        const query = `
      INSERT INTO account_snapshots (user_id, balance, type, currency)
      VALUES ($1, 0, $2, $3)
      RETURNING id;
    `;
        const res = await this.pool.query(query, [userId, type, currency]);
        return { account_id: res.rows[0].id };
    }
};
LedgerService = LedgerService_1 = __decorate([
    Injectable(),
    __param(0, Inject(PG_POOL)),
    __metadata("design:paramtypes", [Pool,
        LedgerRepository])
], LedgerService);
export { LedgerService };

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
import { Inject, Injectable, InternalServerErrorException, } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '@fin-ledger/database';
import * as crypto from 'crypto';
const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
let LedgerRepository = class LedgerRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async getLastEntryHash(accountId, client) {
        const query = `SELECT current_hash FROM ledger_entries WHERE account_id = $1 ORDER BY created_at DESC LIMIT 1`;
        try {
            const res = await client.query(query, [accountId]);
            if (res.rows.length === 0) {
                return GENESIS_HASH;
            }
            return res.rows[0].current_hash;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new InternalServerErrorException(`Database read failure during hash audit fetchL ${errorMessage}`);
        }
    }
    async insertLedgerEntry(entry, client) {
        const rawData = `${entry.transaction_id}|${entry.account_id}|${entry.amount.toString()}|${entry.previous_hash}`;
        entry.current_hash = crypto
            .createHash('sha256')
            .update(rawData)
            .digest('hex');
        const query = `INSERT INTO ledger_entries (transaction_id, account_id, amount, description, previous_hash, current_hash) VALUES($1, $2, $3, $4, $5, $6) RETURNING id, created_at`;
        try {
            const res = await client.query(query, [
                entry.transaction_id,
                entry.account_id,
                entry.amount.toString(),
                entry.description || null,
                entry.previous_hash,
                entry.current_hash,
            ]);
            return {
                ...entry,
                id: parseInt(res.rows[0].id, 10),
                created_at: res.rows[0].created_at,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new InternalServerErrorException(`Database append failure on ledger writing: ${errorMessage}`);
        }
    }
};
LedgerRepository = __decorate([
    Injectable(),
    __param(0, Inject(PG_POOL)),
    __metadata("design:paramtypes", [Pool])
], LedgerRepository);
export { LedgerRepository };

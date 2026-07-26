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
var ReconciliationService_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Pool } from 'pg';
import { PG_POOL } from '@fin-ledger/database';
let ReconciliationService = ReconciliationService_1 = class ReconciliationService {
    pool;
    logger = new Logger(ReconciliationService_1.name);
    RECONCILIATION_LOCK_ID = 987654321;
    constructor(pool) {
        this.pool = pool;
    }
    async handleDailyReconciliation() {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const lockQuery = `SELECT pg_try_advisory_xact_lock($1) AS acquired;`;
            const lockRes = await client.query(lockQuery, [
                this.RECONCILIATION_LOCK_ID,
            ]);
            const isLockAcquired = lockRes.rows[0].acquired;
            if (!isLockAcquired) {
                this.logger.log('Daily reconciliation script execution bypassed: Lock already held by a parallel cluster node');
                await client.query(`ROLLBACK`);
                return;
            }
            this.logger.log('Distributed Advisory Lock safely claimed. Initiating systemic wallet asset reconciliation audits...');
            const auditQuery = `SELECT (SELECT COALESCE(SUM(amount), 0) FROM ledger_entries) = (SELECT COALESCE(SUM(balance), 0) FROM account_snapshots) AS balances_match;`;
            const auditRes = await client.query(auditQuery);
            const balancesMatch = auditRes.rows[0].balances_match;
            if (!balancesMatch) {
                this.logger.error('CRITICAL ALARM: Systemic asset imbalance discovered between immutable entries and account balance snapshots!');
            }
            else {
                this.logger.log('Ledger validation verified successfully. All global accounts are perfectly balanced to zero');
            }
            await client.query('COMMIT');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occured';
            this.logger.error(`Fatal crash encountered during active cron auditing lifecycle: ${errorMessage}`);
            await client.query('ROLLBACK');
        }
        finally {
            client.release();
        }
    }
};
__decorate([
    Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReconciliationService.prototype, "handleDailyReconciliation", null);
ReconciliationService = ReconciliationService_1 = __decorate([
    Injectable(),
    __param(0, Inject(PG_POOL)),
    __metadata("design:paramtypes", [Pool])
], ReconciliationService);
export { ReconciliationService };

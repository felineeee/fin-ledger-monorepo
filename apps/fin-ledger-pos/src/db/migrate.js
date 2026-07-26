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
import { Injectable, Inject } from '@nestjs/common';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { Migrator, FileMigrationProvider } from 'kysely/migration';
import { PG_POOL } from '@fin-ledger/database';
let MigrationService = class MigrationService {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async runMigrations() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const db = new Kysely({
            dialect: new PostgresDialect({ pool: this.pool }),
        });
        const migrator = new Migrator({
            db,
            provider: new FileMigrationProvider({
                fs,
                path,
                migrationFolder: path.join(__dirname, 'migrations'),
            }),
        });
        const { error, results } = await migrator.migrateToLatest();
        results?.forEach((it) => {
            if (it.status === 'Success') {
                console.log(`Migration "${it.migrationName}" was executed successfully`);
            }
            else if (it.status === 'Error') {
                console.error(`Failed to execute migration "${it.migrationName}"`);
            }
        });
        if (error) {
            console.error('Failed to migrate:', error);
            await db.destroy();
            process.exit(1);
        }
        await db.destroy();
    }
};
MigrationService = __decorate([
    Injectable(),
    __param(0, Inject(PG_POOL)),
    __metadata("design:paramtypes", [Pool])
], MigrationService);
export { MigrationService };

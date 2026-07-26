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
import { Injectable, Inject, NotFoundException, ConflictException, } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
let SettlementsService = class SettlementsService {
    db;
    constructor(db) {
        this.db = db;
    }
    // [x] GET /api/settlements
    async getSettlements() {
        return this.db
            .selectFrom('settlements')
            .selectAll()
            .orderBy('created_at', 'desc')
            .execute();
    }
    // [x] GET /api/settlements/:id
    async getSettlementById(id) {
        const settlement = await this.db
            .selectFrom('settlements')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirst();
        if (!settlement)
            throw new NotFoundException(`Settlement ${id} not found.`);
        return settlement;
    }
    // [x] POST /api/settlements/:id/mark-paid
    async markSettlementPaid(id) {
        const settlement = await this.getSettlementById(id);
        if (settlement.status === 'PAID')
            throw new ConflictException('Settlement is already marked as PAID.');
        return this.db
            .updateTable('settlements')
            .set({
            status: 'PAID',
            settled_at: sql `NOW()`,
            updated_at: sql `NOW()`,
        })
            .where('id', '=', id)
            .returningAll()
            .executeTakeFirstOrThrow();
    }
};
SettlementsService = __decorate([
    Injectable(),
    __param(0, Inject('DB_INSTANCE')),
    __metadata("design:paramtypes", [Kysely])
], SettlementsService);
export { SettlementsService };

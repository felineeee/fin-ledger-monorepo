var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException } from '@nestjs/common';
import { Kysely } from 'kysely';
let PaymentMethodsService = class PaymentMethodsService {
    db;
    constructor(db) {
        this.db = db;
    }
    // [x] GET /api/payment-methods
    async findAll() {
        return this.db
            .selectFrom('payment_methods')
            .selectAll()
            .orderBy('created_at', 'desc')
            .execute();
    }
    // [x] GET /api/payment-methods/:id
    async findOne(id) {
        const paymentMethod = await this.db
            .selectFrom('payment_methods')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirst();
        if (!paymentMethod) {
            throw new NotFoundException(`Payment method with ID ${id} not found.`);
        }
        return paymentMethod;
    }
    // [x] POST /api/payment-methods
    async create(dto) {
        return this.db
            .insertInto('payment_methods')
            .values({
            name: dto.name,
            type: dto.type,
            is_active: dto.is_active ?? true,
            config: dto.config ? JSON.stringify(dto.config) : '{}',
        })
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    // [x] PATCH /api/payment-methods/:id
    async update(id, dto) {
        // 1. Ensure it exists first
        const existing = await this.findOne(id);
        // 2. Build the update payload dynamically
        const updatePayload = {};
        if (dto.name !== undefined)
            updatePayload.name = dto.name;
        if (dto.type !== undefined)
            updatePayload.type = dto.type;
        if (dto.is_active !== undefined)
            updatePayload.is_active = dto.is_active;
        if (dto.config !== undefined)
            updatePayload.config = JSON.stringify(dto.config);
        // If payload is empty, just return existing record
        if (Object.keys(updatePayload).length === 0) {
            return existing;
        }
        // 3. Apply the update
        return this.db
            .updateTable('payment_methods')
            .set(updatePayload)
            .where('id', '=', id)
            .returningAll()
            .executeTakeFirstOrThrow();
    }
};
PaymentMethodsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Kysely])
], PaymentMethodsService);
export { PaymentMethodsService };

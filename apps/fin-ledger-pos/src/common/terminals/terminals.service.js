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
// src/terminals/terminals.service.ts
import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
let TerminalsService = class TerminalsService {
    db;
    constructor(db) {
        this.db = db;
    }
    // [x] POST /api/terminals
    async create(dto) {
        try {
            return await this.db.insertInto('terminals')
                .values({
                location_id: dto.location_id,
                name: dto.name,
                serial_number: dto.serial_number ?? null,
                status: 'ACTIVE',
            })
                .returningAll()
                .executeTakeFirstOrThrow();
        }
        catch (error) {
            // Catch unique violation for serial_number
            if (error.code === '23505') {
                throw new ConflictException('A terminal with this serial number is already registered.');
            }
            throw error;
        }
    }
    // [x] GET /api/terminals
    async findAll(query) {
        let q = this.db.selectFrom('terminals').selectAll().orderBy('created_at', 'desc');
        if (query.location_id) {
            q = q.where('location_id', '=', query.location_id);
        }
        return q.execute();
    }
    // [x] GET /api/terminals/:id
    async findOne(id) {
        const terminal = await this.db.selectFrom('terminals')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirst();
        if (!terminal) {
            throw new NotFoundException(`Terminal ${id} not found.`);
        }
        return terminal;
    }
    // [x] PATCH /api/terminals/:id
    async update(id, dto) {
        await this.findOne(id); // Ensure exists
        const updatePayload = {};
        if (dto.location_id !== undefined)
            updatePayload.location_id = dto.location_id;
        if (dto.name !== undefined)
            updatePayload.name = dto.name;
        if (dto.serial_number !== undefined)
            updatePayload.serial_number = dto.serial_number;
        if (dto.status !== undefined)
            updatePayload.status = dto.status;
        if (Object.keys(updatePayload).length === 0) {
            return this.findOne(id);
        }
        try {
            return await this.db.updateTable('terminals')
                .set(updatePayload)
                .where('id', '=', id)
                .returningAll()
                .executeTakeFirstOrThrow();
        }
        catch (error) {
            if (error.code === '23505') {
                throw new ConflictException('Another terminal is already registered with this serial number.');
            }
            throw error;
        }
    }
    // [x] POST /api/terminals/:id/ping
    async ping(id) {
        const terminal = await this.findOne(id);
        if (terminal.status !== 'ACTIVE') {
            throw new ConflictException(`Cannot ping terminal because its status is ${terminal.status}`);
        }
        // In a real-world scenario, this is where you would trigger an API call to Stripe/Adyen 
        // to check the hardware connection. For the boilerplate, we return a simulated success.
        return {
            terminal_id: terminal.id,
            status: 'online',
            message: 'Terminal is reachable and responding.',
            pinged_at: new Date().toISOString(),
        };
    }
};
TerminalsService = __decorate([
    Injectable(),
    __param(0, Inject('DB_INSTANCE')),
    __metadata("design:paramtypes", [Kysely])
], TerminalsService);
export { TerminalsService };

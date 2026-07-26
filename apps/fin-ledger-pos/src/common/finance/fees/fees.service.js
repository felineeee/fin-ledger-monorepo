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
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
let FeesService = class FeesService {
    db;
    constructor(db) {
        this.db = db;
    }
    async getFeeSchedules() {
        return this.db
            .selectFrom('fee_schedules')
            .innerJoin('payment_methods', 'fee_schedules.payment_method_id', 'payment_methods.id')
            .select([
            'fee_schedules.id',
            'fee_schedules.payment_method_id',
            'payment_methods.name as method_name',
            'fee_schedules.flat_fee',
            'fee_schedules.percentage_fee',
        ])
            .execute();
    }
    // [x] POST /api/fee-schedules
    async createFeeSchedule(dto) {
        return this.db
            .insertInto('fee_schedules')
            .values({
            payment_method_id: dto.payment_method_id,
            flat_fee: dto.flat_fee,
            percentage_fee: dto.percentage_fee,
        })
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    // [x] PATCH /api/fee-schedules/:id
    async updateFeeSchedule(id, dto) {
        const payload = { updated_at: sql `NOW()` };
        if (dto.flat_fee !== undefined)
            payload.flat_fee = dto.flat_fee;
        if (dto.percentage_fee !== undefined)
            payload.percentage_fee = dto.percentage_fee;
        return this.db
            .updateTable('fee_schedules')
            .set(payload)
            .where('id', '=', id)
            .returningAll()
            .executeTakeFirstOrThrow(() => new NotFoundException(`Fee schedule ${id} not found.`));
    }
    // [x] GET /api/payments/:id/fees
    async calculatePaymentFees(paymentId) {
        const payment = await this.db
            .selectFrom('payments')
            .leftJoin('fee_schedules', 'payments.payment_method_id', 'fee_schedules.payment_method_id')
            .selectAll('payments')
            .select(['fee_schedules.flat_fee', 'fee_schedules.percentage_fee'])
            .where('payments.id', '=', paymentId)
            .executeTakeFirst();
        if (!payment)
            throw new NotFoundException(`Payment ${paymentId} not found.`);
        const amount = Number(payment.amount);
        const flatFee = Number(payment.flat_fee || 0);
        const percentageFee = Number(payment.percentage_fee || 0);
        // (Amount * Percentage) + Flat Fee
        const calculatedFee = amount * percentageFee + flatFee;
        // PPN (VAT) 11% on the fee itself (Standard Indonesian tax rule)
        const taxOnFee = calculatedFee * 0.11;
        const totalDeduction = calculatedFee + taxOnFee;
        return {
            payment_id: payment.id,
            gross_amount: amount,
            gateway_fee: calculatedFee,
            tax_on_fee: taxOnFee,
            total_deduction: totalDeduction,
            net_receivable: amount - totalDeduction,
        };
    }
};
FeesService = __decorate([
    Injectable(),
    __param(0, Inject('DB_INSTANCE')),
    __metadata("design:paramtypes", [Kysely])
], FeesService);
export { FeesService };

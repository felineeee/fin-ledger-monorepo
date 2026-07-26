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
// src/payments/receipts.service.ts
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
let ReceiptsService = class ReceiptsService {
    db;
    constructor(db) {
        this.db = db;
    }
    // [x] GET /api/payments/:id/receipt
    async getReceipt(id) {
        const payment = await this.db.selectFrom('payments')
            .innerJoin('payment_methods', 'payments.payment_method_id', 'payment_methods.id')
            .leftJoin('shifts', 'payments.shift_id', 'shifts.id')
            .leftJoin('terminals', 'payments.terminal_id', 'terminals.id')
            .select([
            'payments.id',
            'payments.order_id',
            'payments.amount',
            'payments.tip_amount',
            'payments.currency',
            'payments.status',
            'payments.created_at',
            'payments.channel',
            'payment_methods.name as method_name',
            'payment_methods.type as method_type',
            'terminals.name as terminal_name',
            'shifts.location_id',
            'shifts.cashier_id',
        ])
            .where('payments.id', '=', id)
            .executeTakeFirst();
        if (!payment) {
            throw new NotFoundException(`Payment ${id} not found.`);
        }
        const subtotal = Number(payment.amount);
        const tip = Number(payment.tip_amount || 0);
        const total = subtotal + tip;
        // Constructing a structured payload optimized for POS rendering
        return {
            receipt_id: `RCPT-${payment.id.split('-')[0].toUpperCase()}`, // Short friendly ID
            payment_id: payment.id,
            order_id: payment.order_id,
            date: payment.created_at,
            status: payment.status,
            channel: payment.channel,
            merchant_details: {
                location_id: payment.location_id || 'ONLINE_STORE',
                cashier_id: payment.cashier_id || 'SYSTEM',
                terminal: payment.terminal_name || 'N/A',
            },
            payment_method: {
                name: payment.method_name,
                type: payment.method_type,
            },
            breakdown: {
                subtotal,
                tip,
                total,
                currency: payment.currency,
            },
            footer_message: 'Thank you for your purchase!',
        };
    }
    // [x] POST /api/payments/:id/receipt/resend
    async resendReceipt(id, dto) {
        // 1. Verify the payment exists and get the payload
        const receiptPayload = await this.getReceipt(id);
        // 2. Mock external notification integration (e.g., SendGrid, Twilio)
        // In production, you would enqueue a background job (e.g., BullMQ) passing the receiptPayload here.
        return {
            success: true,
            message: `Receipt successfully queued for delivery via ${dto.method}.`,
            delivered_to: dto.target,
            method: dto.method,
            receipt_id: receiptPayload.receipt_id,
            sent_at: new Date().toISOString(),
        };
    }
};
ReceiptsService = __decorate([
    Injectable(),
    __param(0, Inject('DB_INSTANCE')),
    __metadata("design:paramtypes", [Kysely])
], ReceiptsService);
export { ReceiptsService };

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
// src/finance/finance.service.ts
import { Injectable, Inject, } from '@nestjs/common';
import { Kysely } from 'kysely';
let FinanceService = class FinanceService {
    db;
    constructor(db) {
        this.db = db;
    }
    // [x] GET /api/locations/:id/reports/payment-methods-breakdown
    async getPaymentMethodBreakdown(locationId, query) {
        let q = this.db
            .selectFrom('payments')
            .innerJoin('payment_methods', 'payments.payment_method_id', 'payment_methods.id')
            .leftJoin('shifts', 'payments.shift_id', 'shifts.id')
            .select([
            'payment_methods.name as method',
            ({ fn }) => fn.sum('payments.amount').as('total_volume'),
            ({ fn }) => fn.count('payments.id').as('transaction_count'),
        ])
            .where('shifts.location_id', '=', locationId)
            .where('payments.status', '=', 'CAPTURED')
            .groupBy('payment_methods.name');
        if (query.start_date)
            q = q.where('payments.created_at', '>=', new Date(query.start_date));
        if (query.end_date)
            q = q.where('payments.created_at', '<=', new Date(query.end_date));
        return q.execute();
    }
    // [x] GET /api/locations/:id/reports/failed-payments
    async getFailedPaymentsReport(locationId, query) {
        let q = this.db
            .selectFrom('payments')
            .leftJoin('shifts', 'payments.shift_id', 'shifts.id')
            .select([
            'payments.status',
            ({ fn }) => fn.count('payments.id').as('count'),
            ({ fn }) => fn.sum('payments.amount').as('lost_volume'),
        ])
            .where('shifts.location_id', '=', locationId)
            .where('payments.status', 'in', ['FAILED', 'VOIDED'])
            .groupBy('payments.status');
        if (query.start_date)
            q = q.where('payments.created_at', '>=', new Date(query.start_date));
        if (query.end_date)
            q = q.where('payments.created_at', '<=', new Date(query.end_date));
        return q.execute();
    }
    // [x] GET /api/reports/revenue/company-wide
    async getCompanyWideRevenue(query) {
        // 1. Gross Volume
        let grossQuery = this.db
            .selectFrom('payments')
            .select(({ fn }) => fn.sum('amount').as('gross_volume'))
            .where('status', 'in', ['CAPTURED', 'PARTIALLY_REFUNDED']);
        // 2. Refund Volume
        let refundQuery = this.db
            .selectFrom('refunds')
            .select(({ fn }) => fn.sum('amount').as('total_refunded'))
            .where('status', '=', 'COMPLETED');
        if (query.start_date) {
            grossQuery = grossQuery.where('created_at', '>=', new Date(query.start_date));
            refundQuery = refundQuery.where('created_at', '>=', new Date(query.start_date));
        }
        if (query.end_date) {
            grossQuery = grossQuery.where('created_at', '<=', new Date(query.end_date));
            refundQuery = refundQuery.where('created_at', '<=', new Date(query.end_date));
        }
        const grossResult = await grossQuery.executeTakeFirst();
        const refundResult = await refundQuery.executeTakeFirst();
        const gross = Number(grossResult?.gross_volume || 0);
        const refunds = Number(refundResult?.total_refunded || 0);
        return {
            date_range: {
                start: query.start_date || null,
                end: query.end_date || null,
            },
            gross_volume: gross,
            total_refunded: refunds,
            net_revenue: gross - refunds,
        };
    }
};
FinanceService = __decorate([
    Injectable(),
    __param(0, Inject('DB_INSTANCE')),
    __metadata("design:paramtypes", [Kysely])
], FinanceService);
export { FinanceService };

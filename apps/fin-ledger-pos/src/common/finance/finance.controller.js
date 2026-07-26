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
// src/finance/finance.controller.ts
import { Controller, Get, Param, Query, ParseUUIDPipe, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, } from '@nestjs/swagger';
import { FinanceService } from './finance.service.js';
import { ReportQueryDto, } from './dto/finance.dto.js';
let FinanceController = class FinanceController {
    financeService;
    constructor(financeService) {
        this.financeService = financeService;
    }
    // --- REPORTING ---
    async getPaymentMethodBreakdown(id, query) {
        return this.financeService.getPaymentMethodBreakdown(id, query);
    }
    async getFailedPaymentsReport(id, query) {
        return this.financeService.getFailedPaymentsReport(id, query);
    }
    async getCompanyWideRevenue(query) {
        return this.financeService.getCompanyWideRevenue(query);
    }
};
__decorate([
    Get('locations/:id/reports/payment-methods-breakdown'),
    ApiOperation({
        summary: 'Breakdown of sales by payment method per location',
    }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ReportQueryDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getPaymentMethodBreakdown", null);
__decorate([
    Get('locations/:id/reports/failed-payments'),
    ApiOperation({
        summary: 'Report of failed/voided payment attempts per location',
    }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ReportQueryDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getFailedPaymentsReport", null);
__decorate([
    Get('reports/revenue/company-wide'),
    ApiOperation({ summary: 'Consolidated company-wide net revenue reporting' }),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ReportQueryDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getCompanyWideRevenue", null);
FinanceController = __decorate([
    ApiTags('finance-and-reporting'),
    ApiBearerAuth(),
    Controller('api'),
    __metadata("design:paramtypes", [FinanceService])
], FinanceController);
export { FinanceController };

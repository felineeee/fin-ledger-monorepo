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
// src/finance/reports.controller.ts
import { Controller, Get, Query, Param, ParseUUIDPipe, HttpCode, HttpStatus, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, } from '@nestjs/swagger';
import { ReportsService } from './reports.service.js';
import { ReportQueryDto } from '../dto/reports.dto.js';
let ReportsController = class ReportsController {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getPaymentMethodBreakdown(id, query) {
        return this.reportsService.getPaymentMethodBreakdown(id, query);
    }
    async getFailedPaymentsReport(id, query) {
        return this.reportsService.getFailedPaymentsReport(id, query);
    }
    async getCompanyWideRevenue(query) {
        return this.reportsService.getCompanyWideRevenue(query);
    }
};
__decorate([
    Get('locations/:id/reports/payment-methods-breakdown'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
        summary: 'Breakdown of realized sales by payment method per location',
    }),
    ApiParam({ name: 'id', description: 'Location UUID' }),
    ApiResponse({
        status: 200,
        description: 'Returns volume and count grouped by method',
    }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ReportQueryDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getPaymentMethodBreakdown", null);
__decorate([
    Get('locations/:id/reports/failed-payments'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
        summary: 'Report of failed and voided payment attempts per location',
    }),
    ApiParam({ name: 'id', description: 'Location UUID' }),
    ApiResponse({ status: 200, description: 'Returns lost volume and counts' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ReportQueryDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getFailedPaymentsReport", null);
__decorate([
    Get('reports/revenue/company-wide'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Consolidated company-wide net revenue reporting' }),
    ApiResponse({
        status: 200,
        description: 'Returns gross volume, total refunds, and net revenue',
    }),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ReportQueryDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getCompanyWideRevenue", null);
ReportsController = __decorate([
    ApiTags('financial-reporting'),
    ApiBearerAuth(),
    Controller('api'),
    __metadata("design:paramtypes", [ReportsService])
], ReportsController);
export { ReportsController };

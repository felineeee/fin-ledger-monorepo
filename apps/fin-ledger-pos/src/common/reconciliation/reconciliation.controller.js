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
// src/reconciliation/reconciliation.controller.ts
import { Controller, Get, Post, Query, Param, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ReconciliationService } from './reconciliation.service.js';
import { LedgerQueryDto, DailyReconciliationQueryDto, DiscrepancyQueryDto } from './dto/reconciliation.dto.js';
let ReconciliationController = class ReconciliationController {
    reconciliationService;
    constructor(reconciliationService) {
        this.reconciliationService = reconciliationService;
    }
    async getLedgerRecords(query) {
        return this.reconciliationService.getLedgerRecords(query);
    }
    async getLedgerRecordById(id) {
        return this.reconciliationService.getLedgerRecordById(id);
    }
    async getDailyReconciliation(id, query) {
        return this.reconciliationService.getDailyReconciliation(id, query);
    }
    async getDiscrepancies(query) {
        return this.reconciliationService.getDiscrepancies(query);
    }
    async closeDailyReconciliation(id, query) {
        return this.reconciliationService.closeDailyReconciliation(id, query);
    }
};
__decorate([
    Get('payments/ledger'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'List immutable transaction ledger records' }),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LedgerQueryDto]),
    __metadata("design:returntype", Promise)
], ReconciliationController.prototype, "getLedgerRecords", null);
__decorate([
    Get('payments/ledger/:id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Get single ledger entry details' }),
    ApiParam({ name: 'id', description: 'Ledger Entry UUID' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReconciliationController.prototype, "getLedgerRecordById", null);
__decorate([
    Get('locations/:id/reconciliation/daily'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Fetch daily shift reconciliation breakdown against shift records' }),
    ApiParam({ name: 'id', description: 'Location UUID' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, DailyReconciliationQueryDto]),
    __metadata("design:returntype", Promise)
], ReconciliationController.prototype, "getDailyReconciliation", null);
__decorate([
    Get('reconciliation/discrepancies'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'List cash drawer/terminal variance discrepancies system-wide' }),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DiscrepancyQueryDto]),
    __metadata("design:returntype", Promise)
], ReconciliationController.prototype, "getDiscrepancies", null);
__decorate([
    Post('locations/:id/reconciliation/close'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Lock and close shift/day financial reconciliation (Force closes open shifts)' }),
    ApiParam({ name: 'id', description: 'Location UUID' }),
    ApiResponse({ status: 200, description: 'Day is locked and final variance report returned' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, DailyReconciliationQueryDto]),
    __metadata("design:returntype", Promise)
], ReconciliationController.prototype, "closeDailyReconciliation", null);
ReconciliationController = __decorate([
    ApiTags('reconciliation-ledger'),
    ApiBearerAuth(),
    Controller('api'),
    __metadata("design:paramtypes", [ReconciliationService])
], ReconciliationController);
export { ReconciliationController };

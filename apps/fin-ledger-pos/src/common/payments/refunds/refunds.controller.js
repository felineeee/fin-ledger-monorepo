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
// src/payments/refunds.controller.ts
import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RefundsService } from './refunds.service.js';
import { CreateRefundDto, UpdateRefundStatusDto } from '../dto/refunds.dto.js';
let RefundsController = class RefundsController {
    refundsService;
    constructor(refundsService) {
        this.refundsService = refundsService;
    }
    async issueRefund(id, dto) {
        return this.refundsService.issueRefund(id, dto);
    }
    async getRefundsByPayment(id) {
        return this.refundsService.getRefundsByPayment(id);
    }
    async getAllRefunds() {
        return this.refundsService.getAllRefunds();
    }
    async getRefundById(id) {
        return this.refundsService.getRefundById(id);
    }
    async updateRefundStatus(id, dto) {
        return this.refundsService.updateRefundStatus(id, dto);
    }
};
__decorate([
    Post('payments/:id/refunds'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({ summary: 'Issue a new refund request against a captured payment' }),
    ApiParam({ name: 'id', description: 'Payment UUID' }),
    ApiResponse({ status: 201, description: 'Refund created in PENDING state' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateRefundDto]),
    __metadata("design:returntype", Promise)
], RefundsController.prototype, "issueRefund", null);
__decorate([
    Get('payments/:id/refunds'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'List all refunds associated with a specific payment' }),
    ApiParam({ name: 'id', description: 'Payment UUID' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RefundsController.prototype, "getRefundsByPayment", null);
__decorate([
    Get('refunds'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'List all refunds system-wide' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RefundsController.prototype, "getAllRefunds", null);
__decorate([
    Get('refunds/:id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Get details of a single refund' }),
    ApiParam({ name: 'id', description: 'Refund UUID' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RefundsController.prototype, "getRefundById", null);
__decorate([
    Patch('refunds/:id/status'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Update async refund status (Writes REFUNDED to ledger if COMPLETED)' }),
    ApiParam({ name: 'id', description: 'Refund UUID' }),
    ApiResponse({ status: 200, description: 'Refund status updated, ledger synchronized if completed' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateRefundStatusDto]),
    __metadata("design:returntype", Promise)
], RefundsController.prototype, "updateRefundStatus", null);
RefundsController = __decorate([
    ApiTags('refunds'),
    ApiBearerAuth(),
    Controller('api'),
    __metadata("design:paramtypes", [RefundsService])
], RefundsController);
export { RefundsController };

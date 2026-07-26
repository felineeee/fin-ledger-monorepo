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
// src/payments/split.controller.ts
import { Controller, Get, Post, Body, Param, Query, Headers, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiHeader } from '@nestjs/swagger';
import { SplitTenderService } from './split.service.js';
import { SplitPaymentDto, OrderBalanceQueryDto } from '../dto/split.dto.js';
let SplitTenderController = class SplitTenderController {
    splitService;
    constructor(splitService) {
        this.splitService = splitService;
    }
    async processSplitTender(orderId, dto, idempotencyKey) {
        return this.splitService.processSplitTender(orderId, dto, idempotencyKey);
    }
    async getOrderBalance(orderId, query) {
        return this.splitService.getOrderBalance(orderId, query);
    }
};
__decorate([
    Post(':orderId/payments/split'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({ summary: 'Atomically orchestrate multiple captures (part cash, part card)' }),
    ApiParam({ name: 'orderId', description: 'Order UUID' }),
    ApiHeader({ name: 'Idempotency-Key', required: false, description: 'UUID to prevent double-charging' }),
    ApiResponse({ status: 201, description: 'All split payments recorded successfully' }),
    __param(0, Param('orderId', ParseUUIDPipe)),
    __param(1, Body()),
    __param(2, Headers('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SplitPaymentDto, String]),
    __metadata("design:returntype", Promise)
], SplitTenderController.prototype, "processSplitTender", null);
__decorate([
    Get(':orderId/payments/balance'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Calculate remaining unpaid balance on an order' }),
    ApiParam({ name: 'orderId', description: 'Order UUID' }),
    ApiResponse({ status: 200, description: 'Returns total paid, remaining balance, and full-payment status' }),
    __param(0, Param('orderId', ParseUUIDPipe)),
    __param(1, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, OrderBalanceQueryDto]),
    __metadata("design:returntype", Promise)
], SplitTenderController.prototype, "getOrderBalance", null);
SplitTenderController = __decorate([
    ApiTags('split-tender'),
    ApiBearerAuth(),
    Controller('api/orders'),
    __metadata("design:paramtypes", [SplitTenderService])
], SplitTenderController);
export { SplitTenderController };

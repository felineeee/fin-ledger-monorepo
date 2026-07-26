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
// src/payments/receipts.controller.ts
import { Controller, Get, Post, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ReceiptsService } from './receipts.service.js';
import { ResendReceiptDto } from '../dto/receipts.dto.js';
let ReceiptsController = class ReceiptsController {
    receiptsService;
    constructor(receiptsService) {
        this.receiptsService = receiptsService;
    }
    async getReceipt(id) {
        return this.receiptsService.getReceipt(id);
    }
    async resendReceipt(id, dto) {
        return this.receiptsService.resendReceipt(id, dto);
    }
};
__decorate([
    Get(':id/receipt'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Retrieve formatted receipt payload for a payment' }),
    ApiParam({ name: 'id', description: 'Payment UUID' }),
    ApiResponse({ status: 200, description: 'Structured JSON payload for POS rendering' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReceiptsController.prototype, "getReceipt", null);
__decorate([
    Post(':id/receipt/resend'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Email or SMS a copy of the receipt to the customer' }),
    ApiParam({ name: 'id', description: 'Payment UUID' }),
    ApiResponse({ status: 200, description: 'Notification queued successfully' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ResendReceiptDto]),
    __metadata("design:returntype", Promise)
], ReceiptsController.prototype, "resendReceipt", null);
ReceiptsController = __decorate([
    ApiTags('receipts'),
    ApiBearerAuth(),
    Controller('api/payments'),
    __metadata("design:paramtypes", [ReceiptsService])
], ReceiptsController);
export { ReceiptsController };

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
import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiHeader } from '@nestjs/swagger';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payments.dto.js';
let PaymentsController = class PaymentsController {
    paymentsService;
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    async createPayment(dto, idempotencyKey) {
        return this.paymentsService.createPayment(dto, idempotencyKey);
    }
    async findAll() {
        return this.paymentsService.findAll();
    }
    async findOne(id) {
        return this.paymentsService.findOne(id);
    }
    async updatePayment(id, dto) {
        return this.paymentsService.updatePayment(id, dto);
    }
    async cancelPayment(id) {
        return this.paymentsService.cancelPayment(id);
    }
    async findByOrderId(orderId) {
        return this.paymentsService.findByOrderId(orderId);
    }
};
__decorate([
    Post('payments'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({ summary: 'Create a new payment attempt (Writes PENDING state and PAYMENT_CREATED ledger event)' }),
    ApiHeader({ name: 'Idempotency-Key', required: false, description: 'UUID to prevent double-charging on network retries' }),
    ApiResponse({ status: 201, description: 'Payment created successfully' }),
    __param(0, Body()),
    __param(1, Headers('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreatePaymentDto, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createPayment", null);
__decorate([
    Get('payments'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'List all payment attempts across the system' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "findAll", null);
__decorate([
    Get('payments/:id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Get details of a single payment attempt' }),
    ApiParam({ name: 'id', description: 'Payment UUID' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "findOne", null);
__decorate([
    Patch('payments/:id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Edit amount or method for PENDING payments prior to capture' }),
    ApiParam({ name: 'id', description: 'Payment UUID' }),
    ApiResponse({ status: 200, description: 'Payment updated' }),
    ApiResponse({ status: 409, description: 'Conflict: Payment is no longer in PENDING state' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdatePaymentDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "updatePayment", null);
__decorate([
    Delete('payments/:id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Cancel an uncaptured payment record (Writes VOIDED to ledger)' }),
    ApiParam({ name: 'id', description: 'Payment UUID' }),
    ApiResponse({ status: 200, description: 'Payment marked as VOIDED' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "cancelPayment", null);
__decorate([
    Get('orders/:orderId/payments'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Get all payment attempts linked to a specific order' }),
    ApiParam({ name: 'orderId', description: 'Order UUID' }),
    __param(0, Param('orderId', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "findByOrderId", null);
PaymentsController = __decorate([
    ApiTags('payments'),
    ApiBearerAuth(),
    Controller('api'),
    __metadata("design:paramtypes", [PaymentsService])
], PaymentsController);
export { PaymentsController };

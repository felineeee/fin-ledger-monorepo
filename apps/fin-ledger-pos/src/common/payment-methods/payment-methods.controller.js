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
import { Controller, Get, Post, Body, Patch, Param, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PaymentMethodsService } from './payment-methods.service.js';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './dto/payment-method.dto.js';
let PaymentMethodsController = class PaymentMethodsController {
    paymentMethodsService;
    constructor(paymentMethodsService) {
        this.paymentMethodsService = paymentMethodsService;
    }
    async findAll() {
        return this.paymentMethodsService.findAll();
    }
    async create(dto) {
        return this.paymentMethodsService.create(dto);
    }
    async findOne(id) {
        return this.paymentMethodsService.findOne(id);
    }
    async update(id, dto) {
        return this.paymentMethodsService.update(id, dto);
    }
};
__decorate([
    Get(),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'List all configured payment methods system-wide' }),
    ApiResponse({ status: 200, description: 'Array of payment methods returned' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentMethodsController.prototype, "findAll", null);
__decorate([
    Post(),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({ summary: 'Create a new payment method configuration' }),
    ApiResponse({ status: 201, description: 'Payment method successfully created' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreatePaymentMethodDto]),
    __metadata("design:returntype", Promise)
], PaymentMethodsController.prototype, "create", null);
__decorate([
    Get(':id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Get details of a single payment method' }),
    ApiParam({ name: 'id', description: 'Payment Method UUID' }),
    ApiResponse({ status: 200, description: 'Payment method details retrieved' }),
    ApiResponse({ status: 404, description: 'Payment method not found' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentMethodsController.prototype, "findOne", null);
__decorate([
    Patch(':id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Update payment method configuration or status (e.g. soft delete)' }),
    ApiParam({ name: 'id', description: 'Payment Method UUID' }),
    ApiResponse({ status: 200, description: 'Payment method updated successfully' }),
    ApiResponse({ status: 404, description: 'Payment method not found' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdatePaymentMethodDto]),
    __metadata("design:returntype", Promise)
], PaymentMethodsController.prototype, "update", null);
PaymentMethodsController = __decorate([
    Controller('payment-methods'),
    __metadata("design:paramtypes", [PaymentMethodsService])
], PaymentMethodsController);
export { PaymentMethodsController };

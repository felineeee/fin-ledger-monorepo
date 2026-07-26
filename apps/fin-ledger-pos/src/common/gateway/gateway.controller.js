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
// src/payments/gateway.controller.ts
import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { GatewayService } from './gateway.service.js';
import { CreateCheckoutSessionDto, UpdateGatewayConfigDto } from './dto/gateway.dto.js';
let GatewayController = class GatewayController {
    gatewayService;
    constructor(gatewayService) {
        this.gatewayService = gatewayService;
    }
    async createCheckoutSession(id, dto) {
        return this.gatewayService.createCheckoutSession(id, dto);
    }
    async getCheckoutSession(id) {
        return this.gatewayService.getCheckoutSession(id);
    }
    async retryCheckoutSession(id, dto) {
        return this.gatewayService.retryCheckoutSession(id, dto);
    }
    async cancelCheckoutSession(id) {
        return this.gatewayService.cancelCheckoutSession(id);
    }
    async getGatewayConfig() {
        return this.gatewayService.getGatewayConfig();
    }
    async updateGatewayConfig(dto) {
        return this.gatewayService.updateGatewayConfig(dto);
    }
};
__decorate([
    Post('payments/:id/create-checkout-session'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({ summary: 'Initialize online hosted checkout session via Xendit' }),
    ApiParam({ name: 'id', description: 'Payment UUID' }),
    ApiResponse({ status: 201, description: 'Checkout URL generated successfully' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateCheckoutSessionDto]),
    __metadata("design:returntype", Promise)
], GatewayController.prototype, "createCheckoutSession", null);
__decorate([
    Get('payments/:id/checkout-session'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Get checkout session status and payload directly from Xendit' }),
    ApiParam({ name: 'id', description: 'Payment UUID' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GatewayController.prototype, "getCheckoutSession", null);
__decorate([
    Post('payments/:id/retry'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({ summary: 'Expire old Xendit invoice and generate a new checkout session' }),
    ApiParam({ name: 'id', description: 'Payment UUID' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateCheckoutSessionDto]),
    __metadata("design:returntype", Promise)
], GatewayController.prototype, "retryCheckoutSession", null);
__decorate([
    Post('payments/:id/cancel-checkout-session'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Expire Xendit invoice and void the internal payment ledger' }),
    ApiParam({ name: 'id', description: 'Payment UUID' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GatewayController.prototype, "cancelCheckoutSession", null);
__decorate([
    Get('gateway-config'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Get active gateway providers and public keys (SuperAdmin)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GatewayController.prototype, "getGatewayConfig", null);
__decorate([
    Patch('gateway-config'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Configure/enable gateway provider settings (SuperAdmin)' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpdateGatewayConfigDto]),
    __metadata("design:returntype", Promise)
], GatewayController.prototype, "updateGatewayConfig", null);
GatewayController = __decorate([
    ApiTags('online-gateway'),
    ApiBearerAuth(),
    Controller('api'),
    __metadata("design:paramtypes", [GatewayService])
], GatewayController);
export { GatewayController };

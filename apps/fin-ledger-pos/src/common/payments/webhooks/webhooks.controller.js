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
// src/payments/webhooks.controller.ts
import { Controller, Get, Post, Body, Param, Headers, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service.js';
let WebhooksController = class WebhooksController {
    webhooksService;
    constructor(webhooksService) {
        this.webhooksService = webhooksService;
    }
    // --- WEBHOOKS ---
    async handleGatewayWebhook(callbackToken, payload) {
        return this.webhooksService.handleGatewayWebhook(callbackToken, payload);
    }
    async getWebhookEvents() {
        return this.webhooksService.getWebhookEvents();
    }
    async getWebhookEventDetails(id) {
        return this.webhooksService.getWebhookEventDetails(id);
    }
};
__decorate([
    Post('webhooks/gateway'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Inbound Xendit webhook handler stub' }),
    ApiHeader({ name: 'x-callback-token', required: true, description: 'Xendit verification token' }),
    __param(0, Headers('x-callback-token')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleGatewayWebhook", null);
__decorate([
    Get('webhooks/events'),
    ApiBearerAuth(),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Internal audit log of received webhooks (debugging/deduplication)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "getWebhookEvents", null);
__decorate([
    Get('webhooks/events/:id'),
    ApiBearerAuth(),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Get details of a specific received webhook event' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "getWebhookEventDetails", null);
WebhooksController = __decorate([
    ApiTags('gateway-webhooks'),
    Controller('api'),
    __metadata("design:paramtypes", [WebhooksService])
], WebhooksController);
export { WebhooksController };

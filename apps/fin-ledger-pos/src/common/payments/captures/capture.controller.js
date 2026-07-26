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
// src/payments/capture.controller.ts
import { Controller, Post, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CaptureService } from './capture.service.js';
import { CaptureCardPresentDto, ReversePaymentDto } from '../dto/capture.dto.js';
let CaptureController = class CaptureController {
    captureService;
    constructor(captureService) {
        this.captureService = captureService;
    }
    async captureCash(id) {
        return this.captureService.captureCash(id);
    }
    async captureCardPresent(id, dto) {
        return this.captureService.captureCardPresent(id, dto);
    }
    async cancel(id) {
        return this.captureService.cancel(id);
    }
    async reverse(id, dto) {
        return this.captureService.reverse(id, dto);
    }
};
__decorate([
    Post(':id/capture-cash'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Complete and record a cash payment capture' }),
    ApiParam({ name: 'id', description: 'Payment UUID' }),
    ApiResponse({ status: 200, description: 'Payment status updated to CAPTURED' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CaptureController.prototype, "captureCash", null);
__decorate([
    Post(':id/capture-card-present'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Initiate or complete card-present hardware capture' }),
    ApiParam({ name: 'id', description: 'Payment UUID' }),
    ApiResponse({ status: 200, description: 'Payment status updated to CAPTURED' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CaptureCardPresentDto]),
    __metadata("design:returntype", Promise)
], CaptureController.prototype, "captureCardPresent", null);
__decorate([
    Post(':id/cancel'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Void a payment attempt prior to capture completion' }),
    ApiParam({ name: 'id', description: 'Payment UUID' }),
    ApiResponse({ status: 200, description: 'Payment status updated to VOIDED' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CaptureController.prototype, "cancel", null);
__decorate([
    Post(':id/reverse'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Reverse a fully captured in-person payment (same-day window void)' }),
    ApiParam({ name: 'id', description: 'Payment UUID' }),
    ApiResponse({ status: 200, description: 'Payment reversed and marked as VOIDED' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ReversePaymentDto]),
    __metadata("design:returntype", Promise)
], CaptureController.prototype, "reverse", null);
CaptureController = __decorate([
    ApiTags('payments-capture'),
    ApiBearerAuth(),
    Controller('api/payments'),
    __metadata("design:paramtypes", [CaptureService])
], CaptureController);
export { CaptureController };

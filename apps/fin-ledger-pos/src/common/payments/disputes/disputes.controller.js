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
import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DisputesService } from './disputes.service.js';
import { DisputeResponseDto, UpdateDisputeStatusDto } from '../dto/webhooks.dto.js';
let DisputesController = class DisputesController {
    disputesService;
    constructor(disputesService) {
        this.disputesService = disputesService;
    }
    // --- DISPUTES ---
    async getAllDisputes() {
        return this.disputesService.getAllDisputes();
    }
    async getDisputeDetails(id) {
        return this.disputesService.getDisputeDetails(id);
    }
    async respondToDispute(id, dto) {
        return this.disputesService.respondToDispute(id, dto);
    }
    async updateDisputeStatus(id, dto) {
        return this.disputesService.updateDisputeStatus(id, dto);
    }
};
__decorate([
    Get('disputes'),
    ApiBearerAuth(),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'List all chargebacks and disputes' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DisputesController.prototype, "getAllDisputes", null);
__decorate([
    Get('disputes/:id'),
    ApiBearerAuth(),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Get dispute details' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DisputesController.prototype, "getDisputeDetails", null);
__decorate([
    Post('disputes/:id/respond'),
    ApiBearerAuth(),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Submit evidence response for a dispute' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, DisputeResponseDto]),
    __metadata("design:returntype", Promise)
], DisputesController.prototype, "respondToDispute", null);
__decorate([
    Patch('disputes/:id/status'),
    ApiBearerAuth(),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Update internal dispute lifecycle status (Writes VOIDED to ledger if LOST)' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateDisputeStatusDto]),
    __metadata("design:returntype", Promise)
], DisputesController.prototype, "updateDisputeStatus", null);
DisputesController = __decorate([
    ApiTags('gateway-webhooks'),
    Controller('api'),
    __metadata("design:paramtypes", [DisputesService])
], DisputesController);
export { DisputesController };

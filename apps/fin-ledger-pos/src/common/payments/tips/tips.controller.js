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
// src/payments/tips.controller.ts
import { Controller, Get, Patch, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TipsService } from './tips.service.js';
import { UpdateTipDto, TipReportQueryDto } from '../dto/tips.dto.js';
let TipsController = class TipsController {
    tipsService;
    constructor(tipsService) {
        this.tipsService = tipsService;
    }
    async adjustTip(id, dto) {
        return this.tipsService.adjustTip(id, dto);
    }
    async getTipTotals(id, query) {
        return this.tipsService.getTipTotals(id, query);
    }
};
__decorate([
    Patch('payments/:id/tip'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Attach or adjust a tip amount post-capture (Writes TIP_ADDED delta to ledger)' }),
    ApiParam({ name: 'id', description: 'Payment UUID' }),
    ApiResponse({ status: 200, description: 'Tip adjusted and ledger updated' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateTipDto]),
    __metadata("design:returntype", Promise)
], TipsController.prototype, "adjustTip", null);
__decorate([
    Get('locations/:id/reports/tips'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Get tip totals filtered by location, grouped by cashier' }),
    ApiParam({ name: 'id', description: 'Location UUID' }),
    ApiResponse({ status: 200, description: 'Returns grand total and cashier breakdown' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, TipReportQueryDto]),
    __metadata("design:returntype", Promise)
], TipsController.prototype, "getTipTotals", null);
TipsController = __decorate([
    ApiTags('tips'),
    ApiBearerAuth(),
    Controller('api'),
    __metadata("design:paramtypes", [TipsService])
], TipsController);
export { TipsController };

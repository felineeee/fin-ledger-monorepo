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
import { Controller, Get, Post, Param, ParseUUIDPipe, HttpCode, HttpStatus, } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { SettlementsService } from './settlements.service.js';
let SettlementsController = class SettlementsController {
    settlementsService;
    constructor(settlementsService) {
        this.settlementsService = settlementsService;
    }
    async getSettlements() {
        return this.settlementsService.getSettlements();
    }
    async getSettlementById(id) {
        return this.settlementsService.getSettlementById(id);
    }
    async markSettlementPaid(id) {
        return this.settlementsService.markSettlementPaid(id);
    }
};
__decorate([
    Get('settlements'),
    ApiOperation({ summary: 'List processor bank payouts/settlements' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettlementsController.prototype, "getSettlements", null);
__decorate([
    Get('settlements/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SettlementsController.prototype, "getSettlementById", null);
__decorate([
    Post('settlements/:id/mark-paid'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Mark settlement reconciled in bank account' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SettlementsController.prototype, "markSettlementPaid", null);
SettlementsController = __decorate([
    Controller('settlements'),
    __metadata("design:paramtypes", [SettlementsService])
], SettlementsController);
export { SettlementsController };

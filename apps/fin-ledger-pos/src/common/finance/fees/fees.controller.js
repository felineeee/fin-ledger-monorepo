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
import { Controller, Get, Post, Patch, Body, Param, HttpCode, HttpStatus, ParseUUIDPipe, } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { FeesService } from './fees.service.js';
import { CreateFeeScheduleDto, UpdateFeeScheduleDto, } from '../dto/finance.dto.js';
let FeesController = class FeesController {
    feesService;
    constructor(feesService) {
        this.feesService = feesService;
    }
    async getFeeSchedules() {
        return this.feesService.getFeeSchedules();
    }
    async createFeeSchedule(dto) {
        return this.feesService.createFeeSchedule(dto);
    }
    async updateFeeSchedule(id, dto) {
        return this.feesService.updateFeeSchedule(id, dto);
    }
    async calculatePaymentFees(id) {
        return this.feesService.calculatePaymentFees(id);
    }
};
__decorate([
    Get('fee-schedules'),
    ApiOperation({ summary: 'List processor fee schedules by payment method' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeesController.prototype, "getFeeSchedules", null);
__decorate([
    Post('fee-schedules'),
    HttpCode(HttpStatus.CREATED),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateFeeScheduleDto]),
    __metadata("design:returntype", Promise)
], FeesController.prototype, "createFeeSchedule", null);
__decorate([
    Patch('fee-schedules/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateFeeScheduleDto]),
    __metadata("design:returntype", Promise)
], FeesController.prototype, "updateFeeSchedule", null);
__decorate([
    Get('payments/:id/fees'),
    ApiOperation({
        summary: 'Get detailed fee breakdown for net-revenue calculation',
    }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FeesController.prototype, "calculatePaymentFees", null);
FeesController = __decorate([
    Controller('fees'),
    __metadata("design:paramtypes", [FeesService])
], FeesController);
export { FeesController };

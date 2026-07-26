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
import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service.js';
import { OpenShiftDto, CashDropDto, CloseShiftDto, ShiftQueryDto } from './dto/shifts.dto.js';
let ShiftsController = class ShiftsController {
    shiftsService;
    constructor(shiftsService) {
        this.shiftsService = shiftsService;
    }
    async openShift(dto) {
        return this.shiftsService.openShift(dto);
    }
    async findAll(query) {
        return this.shiftsService.findAll(query);
    }
    async findByLocation(id) {
        return this.shiftsService.findByLocation(id);
    }
    async findOne(id) {
        return this.shiftsService.findOne(id);
    }
    async recordCashDrop(dto) {
        return this.shiftsService.recordCashDrop(dto);
    }
    async closeShift(dto) {
        return this.shiftsService.closeShift(dto);
    }
    async forceClose(id) {
        return this.shiftsService.forceClose(id);
    }
};
__decorate([
    Post('shifts/open'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({ summary: 'Open a shift and declare starting cash float' }),
    ApiResponse({ status: 201, description: 'Shift opened successfully' }),
    ApiResponse({ status: 409, description: 'An open shift already exists for this cashier/location' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [OpenShiftDto]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "openShift", null);
__decorate([
    Get('shifts'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'List shifts system-wide (Supports filtering)' }),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ShiftQueryDto]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "findAll", null);
__decorate([
    Get('locations/:id/shifts'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'List shift history for a specific location' }),
    ApiParam({ name: 'id', description: 'Location UUID' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "findByLocation", null);
__decorate([
    Get('shifts/:id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Get detailed shift summary including running totals and drops' }),
    ApiParam({ name: 'id', description: 'Shift UUID' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "findOne", null);
__decorate([
    Post('shifts/cash-drop'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({ summary: 'Record mid-shift cash drop to the safe' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CashDropDto]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "recordCashDrop", null);
__decorate([
    Post('shifts/close'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Close shift, record actual cash, and calculate variance against ledger' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CloseShiftDto]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "closeShift", null);
__decorate([
    Post('shifts/:id/force-close'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Admin override to force-close an abandoned shift (flags for audit)' }),
    ApiParam({ name: 'id', description: 'Shift UUID' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "forceClose", null);
ShiftsController = __decorate([
    ApiTags('shifts'),
    ApiBearerAuth(),
    Controller('api'),
    __metadata("design:paramtypes", [ShiftsService])
], ShiftsController);
export { ShiftsController };

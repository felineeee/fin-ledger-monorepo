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
// src/terminals/terminals.controller.ts
import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TerminalsService } from './terminals.service.js';
import { CreateTerminalDto, UpdateTerminalDto, TerminalQueryDto } from './dto/terminals.dto.js';
let TerminalsController = class TerminalsController {
    terminalsService;
    constructor(terminalsService) {
        this.terminalsService = terminalsService;
    }
    async findAll(query) {
        return this.terminalsService.findAll(query);
    }
    async create(dto) {
        return this.terminalsService.create(dto);
    }
    async findOne(id) {
        return this.terminalsService.findOne(id);
    }
    async update(id, dto) {
        return this.terminalsService.update(id, dto);
    }
    async ping(id) {
        return this.terminalsService.ping(id);
    }
};
__decorate([
    Get(),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'List registered card readers per location' }),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TerminalQueryDto]),
    __metadata("design:returntype", Promise)
], TerminalsController.prototype, "findAll", null);
__decorate([
    Post(),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({ summary: 'Register a new card terminal' }),
    ApiResponse({ status: 201, description: 'Terminal registered successfully' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateTerminalDto]),
    __metadata("design:returntype", Promise)
], TerminalsController.prototype, "create", null);
__decorate([
    Get(':id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Get details of a single terminal' }),
    ApiParam({ name: 'id', description: 'Terminal UUID' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TerminalsController.prototype, "findOne", null);
__decorate([
    Patch(':id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Update terminal details (rename, reassign location, update status)' }),
    ApiParam({ name: 'id', description: 'Terminal UUID' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateTerminalDto]),
    __metadata("design:returntype", Promise)
], TerminalsController.prototype, "update", null);
__decorate([
    Post(':id/ping'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Check terminal connectivity and health' }),
    ApiParam({ name: 'id', description: 'Terminal UUID' }),
    ApiResponse({ status: 200, description: 'Terminal is online and reachable' }),
    ApiResponse({ status: 409, description: 'Terminal is inactive or in maintenance' }),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TerminalsController.prototype, "ping", null);
TerminalsController = __decorate([
    ApiTags('terminals'),
    ApiBearerAuth(),
    Controller('api/terminals'),
    __metadata("design:paramtypes", [TerminalsService])
], TerminalsController);
export { TerminalsController };

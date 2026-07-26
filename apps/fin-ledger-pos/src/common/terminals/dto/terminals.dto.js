var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// src/terminals/dto/terminals.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateTerminalDto {
    location_id;
    name;
    serial_number;
}
__decorate([
    ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Store location ID',
    }),
    IsUUID('4'),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateTerminalDto.prototype, "location_id", void 0);
__decorate([
    ApiProperty({
        example: 'Front Register 1',
        description: 'Display name for the POS app',
    }),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateTerminalDto.prototype, "name", void 0);
__decorate([
    ApiPropertyOptional({
        example: 'WSC51-239481',
        description: 'Hardware serial number',
    }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateTerminalDto.prototype, "serial_number", void 0);
export class UpdateTerminalDto {
    location_id;
    name;
    serial_number;
    status;
}
__decorate([
    ApiPropertyOptional({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Move to a new location',
    }),
    IsOptional(),
    IsUUID('4'),
    __metadata("design:type", String)
], UpdateTerminalDto.prototype, "location_id", void 0);
__decorate([
    ApiPropertyOptional({ example: 'Front Register 1 (Updated)' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateTerminalDto.prototype, "name", void 0);
__decorate([
    ApiPropertyOptional({ example: 'WSC51-239481' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateTerminalDto.prototype, "serial_number", void 0);
__decorate([
    ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'] }),
    IsOptional(),
    IsEnum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']),
    __metadata("design:type", String)
], UpdateTerminalDto.prototype, "status", void 0);
export class TerminalQueryDto {
    location_id;
}
__decorate([
    ApiPropertyOptional({ description: 'Filter terminals by specific location' }),
    IsOptional(),
    IsUUID('4'),
    __metadata("design:type", String)
], TerminalQueryDto.prototype, "location_id", void 0);

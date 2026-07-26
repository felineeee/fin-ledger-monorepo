var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// src/shifts/dto/shifts.dto.ts
import { IsNumber, IsNotEmpty, IsOptional, IsUUID, Min, IsEnum, } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class OpenShiftDto {
    location_id;
    cashier_id;
    starting_float;
}
__decorate([
    ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Store location ID',
    }),
    IsUUID('4'),
    IsNotEmpty(),
    __metadata("design:type", String)
], OpenShiftDto.prototype, "location_id", void 0);
__decorate([
    ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Employee/Cashier ID',
    }),
    IsUUID('4'),
    IsNotEmpty(),
    __metadata("design:type", String)
], OpenShiftDto.prototype, "cashier_id", void 0);
__decorate([
    ApiProperty({
        example: 500000,
        description: 'Starting cash float in the drawer (e.g., IDR)',
    }),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], OpenShiftDto.prototype, "starting_float", void 0);
export class CashDropDto {
    shift_id;
    amount;
    recorded_by;
}
__decorate([
    ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Active Shift ID',
    }),
    IsUUID('4'),
    IsNotEmpty(),
    __metadata("design:type", String)
], CashDropDto.prototype, "shift_id", void 0);
__decorate([
    ApiProperty({ example: 1000000, description: 'Amount moved to safe' }),
    IsNumber(),
    Min(1),
    __metadata("design:type", Number)
], CashDropDto.prototype, "amount", void 0);
__decorate([
    ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Manager/Cashier recording the drop',
    }),
    IsUUID('4'),
    IsNotEmpty(),
    __metadata("design:type", String)
], CashDropDto.prototype, "recorded_by", void 0);
export class CloseShiftDto {
    shift_id;
    actual_cash;
}
__decorate([
    ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    IsUUID('4'),
    IsNotEmpty(),
    __metadata("design:type", String)
], CloseShiftDto.prototype, "shift_id", void 0);
__decorate([
    ApiProperty({
        example: 2500000,
        description: 'Actual physical cash counted in the drawer',
    }),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CloseShiftDto.prototype, "actual_cash", void 0);
export class ShiftQueryDto {
    location_id;
    cashier_id;
    status;
}
__decorate([
    ApiPropertyOptional(),
    IsOptional(),
    IsUUID('4'),
    __metadata("design:type", String)
], ShiftQueryDto.prototype, "location_id", void 0);
__decorate([
    ApiPropertyOptional(),
    IsOptional(),
    IsUUID('4'),
    __metadata("design:type", String)
], ShiftQueryDto.prototype, "cashier_id", void 0);
__decorate([
    ApiPropertyOptional({ enum: ['OPEN', 'CLOSED', 'FORCE_CLOSED'] }),
    IsOptional(),
    IsEnum(['OPEN', 'CLOSED', 'FORCE_CLOSED']),
    __metadata("design:type", String)
], ShiftQueryDto.prototype, "status", void 0);

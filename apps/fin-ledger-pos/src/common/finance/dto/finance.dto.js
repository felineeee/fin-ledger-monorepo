var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// src/finance/dto/finance.dto.ts
import { IsNumber, IsNotEmpty, IsOptional, IsUUID, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// --- FEES ---
export class CreateFeeScheduleDto {
    payment_method_id;
    flat_fee;
    percentage_fee;
}
__decorate([
    ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Payment Method ID' }),
    IsUUID('4'),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateFeeScheduleDto.prototype, "payment_method_id", void 0);
__decorate([
    ApiProperty({ example: 4000, description: 'Flat fee per transaction (e.g., Rp 4,000 for VA)' }),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateFeeScheduleDto.prototype, "flat_fee", void 0);
__decorate([
    ApiProperty({ example: 0.015, description: 'Percentage fee (e.g., 0.015 for 1.5% e-wallet)' }),
    IsNumber(),
    Min(0),
    Max(1),
    __metadata("design:type", Number)
], CreateFeeScheduleDto.prototype, "percentage_fee", void 0);
export class UpdateFeeScheduleDto {
    flat_fee;
    percentage_fee;
}
__decorate([
    ApiPropertyOptional({ example: 4500 }),
    IsOptional(),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateFeeScheduleDto.prototype, "flat_fee", void 0);
__decorate([
    ApiPropertyOptional({ example: 0.02 }),
    IsOptional(),
    IsNumber(),
    Min(0),
    Max(1),
    __metadata("design:type", Number)
], UpdateFeeScheduleDto.prototype, "percentage_fee", void 0);
// --- REPORTING ---
export class ReportQueryDto {
    start_date;
    end_date;
}
__decorate([
    ApiPropertyOptional({ example: '2026-07-01' }),
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], ReportQueryDto.prototype, "start_date", void 0);
__decorate([
    ApiPropertyOptional({ example: '2026-07-31' }),
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], ReportQueryDto.prototype, "end_date", void 0);

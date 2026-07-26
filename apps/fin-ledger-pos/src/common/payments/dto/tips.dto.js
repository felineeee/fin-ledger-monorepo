var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// src/payments/dto/tips.dto.ts
import { IsNumber, IsNotEmpty, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class UpdateTipDto {
    amount;
}
__decorate([
    ApiProperty({ example: 15000, description: 'The absolute total tip amount intended for this payment' }),
    IsNumber(),
    Min(0),
    IsNotEmpty(),
    __metadata("design:type", Number)
], UpdateTipDto.prototype, "amount", void 0);
export class TipReportQueryDto {
    start_date;
    end_date;
}
__decorate([
    ApiPropertyOptional({ example: '2026-07-01T00:00:00Z', description: 'Filter start date' }),
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], TipReportQueryDto.prototype, "start_date", void 0);
__decorate([
    ApiPropertyOptional({ example: '2026-07-31T23:59:59Z', description: 'Filter end date' }),
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], TipReportQueryDto.prototype, "end_date", void 0);

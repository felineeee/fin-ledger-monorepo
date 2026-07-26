var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// src/reconciliation/dto/reconciliation.dto.ts
import { IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
export class LedgerQueryDto {
    payment_id;
    entry_type;
}
__decorate([
    ApiPropertyOptional({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Filter by specific payment',
    }),
    IsOptional(),
    IsUUID('4'),
    __metadata("design:type", String)
], LedgerQueryDto.prototype, "payment_id", void 0);
__decorate([
    ApiPropertyOptional({
        enum: [
            'PAYMENT_CREATED',
            'AUTHORIZED',
            'CAPTURED',
            'TIP_ADDED',
            'VOIDED',
            'REFUNDED',
            'FEE_DEDUCTED',
        ],
    }),
    IsOptional(),
    IsEnum([
        'PAYMENT_CREATED',
        'AUTHORIZED',
        'CAPTURED',
        'TIP_ADDED',
        'VOIDED',
        'REFUNDED',
        'FEE_DEDUCTED',
    ]),
    __metadata("design:type", String)
], LedgerQueryDto.prototype, "entry_type", void 0);
export class DailyReconciliationQueryDto {
    date;
}
__decorate([
    ApiPropertyOptional({
        example: '2026-07-26',
        description: 'Target date for reconciliation (defaults to today)',
    }),
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], DailyReconciliationQueryDto.prototype, "date", void 0);
export class DiscrepancyQueryDto {
    date;
    location_id;
}
__decorate([
    ApiPropertyOptional({
        example: '2026-07-26',
        description: 'Filter discrepancies by date',
    }),
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], DiscrepancyQueryDto.prototype, "date", void 0);
__decorate([
    ApiPropertyOptional({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Filter by location',
    }),
    IsOptional(),
    IsUUID('4'),
    __metadata("design:type", String)
], DiscrepancyQueryDto.prototype, "location_id", void 0);

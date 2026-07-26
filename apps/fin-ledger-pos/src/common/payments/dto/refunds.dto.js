var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// src/payments/dto/refunds.dto.ts
import { IsNumber, IsNotEmpty, IsOptional, IsString, Min, IsEnum, } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateRefundDto {
    amount;
    reason;
}
__decorate([
    ApiProperty({ example: 15000, description: 'Amount to refund' }),
    IsNumber(),
    Min(1),
    IsNotEmpty(),
    __metadata("design:type", Number)
], CreateRefundDto.prototype, "amount", void 0);
__decorate([
    ApiPropertyOptional({
        example: 'Customer returned the item',
        description: 'Reason for the refund',
    }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateRefundDto.prototype, "reason", void 0);
export class UpdateRefundStatusDto {
    status;
}
__decorate([
    ApiProperty({
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        description: 'The new status of the refund',
    }),
    IsEnum(['PENDING', 'COMPLETED', 'FAILED']),
    IsNotEmpty(),
    __metadata("design:type", String)
], UpdateRefundStatusDto.prototype, "status", void 0);

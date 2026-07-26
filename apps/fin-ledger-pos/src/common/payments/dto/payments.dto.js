var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// src/payments/dto/payments.dto.ts
import { IsNumber, IsNotEmpty, IsOptional, IsUUID, IsEnum, Min, } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreatePaymentDto {
    order_id;
    payment_method_id;
    channel;
    amount;
    shift_id;
    terminal_id;
}
__decorate([
    ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Linked Order ID',
    }),
    IsUUID('4'),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "order_id", void 0);
__decorate([
    ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Selected Payment Method ID',
    }),
    IsUUID('4'),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "payment_method_id", void 0);
__decorate([
    ApiProperty({ enum: ['IN_PERSON', 'ONLINE'] }),
    IsEnum(['IN_PERSON', 'ONLINE']),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "channel", void 0);
__decorate([
    ApiProperty({
        example: 50000,
        description: 'Amount in smallest currency unit (e.g., IDR Rupiah)',
    }),
    IsNumber(),
    Min(1),
    __metadata("design:type", Number)
], CreatePaymentDto.prototype, "amount", void 0);
__decorate([
    ApiPropertyOptional({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Required if channel is IN_PERSON',
    }),
    IsOptional(),
    IsUUID('4'),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "shift_id", void 0);
__decorate([
    ApiPropertyOptional({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Optional card terminal ID',
    }),
    IsOptional(),
    IsUUID('4'),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "terminal_id", void 0);
export class UpdatePaymentDto {
    amount;
    payment_method_id;
}
__decorate([
    ApiPropertyOptional({
        example: 55000,
        description: 'Adjust amount before capture',
    }),
    IsOptional(),
    IsNumber(),
    Min(1),
    __metadata("design:type", Number)
], UpdatePaymentDto.prototype, "amount", void 0);
__decorate([
    ApiPropertyOptional({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Change payment method before capture',
    }),
    IsOptional(),
    IsUUID('4'),
    __metadata("design:type", String)
], UpdatePaymentDto.prototype, "payment_method_id", void 0);

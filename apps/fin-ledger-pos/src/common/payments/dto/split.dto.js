var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// src/payments/dto/split.dto.ts
import { IsNumber, IsNotEmpty, IsOptional, IsUUID, IsEnum, Min, ValidateNested, IsArray, IsString, } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class SplitPaymentItemDto {
    payment_method_id;
    channel;
    amount;
    shift_id;
    terminal_id;
    auth_code;
}
__decorate([
    ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    IsUUID('4'),
    IsNotEmpty(),
    __metadata("design:type", String)
], SplitPaymentItemDto.prototype, "payment_method_id", void 0);
__decorate([
    ApiProperty({ enum: ['IN_PERSON', 'ONLINE'] }),
    IsEnum(['IN_PERSON', 'ONLINE']),
    IsNotEmpty(),
    __metadata("design:type", String)
], SplitPaymentItemDto.prototype, "channel", void 0);
__decorate([
    ApiProperty({
        example: 25000,
        description: 'Amount covered by this specific method',
    }),
    IsNumber(),
    Min(1),
    __metadata("design:type", Number)
], SplitPaymentItemDto.prototype, "amount", void 0);
__decorate([
    ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    IsOptional(),
    IsUUID('4'),
    __metadata("design:type", String)
], SplitPaymentItemDto.prototype, "shift_id", void 0);
__decorate([
    ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    IsOptional(),
    IsUUID('4'),
    __metadata("design:type", String)
], SplitPaymentItemDto.prototype, "terminal_id", void 0);
__decorate([
    ApiPropertyOptional({
        example: 'AUTH999',
        description: 'Terminal auth code if pre-captured on hardware',
    }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], SplitPaymentItemDto.prototype, "auth_code", void 0);
export class SplitPaymentDto {
    payments;
}
__decorate([
    ApiProperty({
        type: [SplitPaymentItemDto],
        description: 'Array of payments making up the split tender',
    }),
    IsArray(),
    ValidateNested({ each: true }),
    Type(() => SplitPaymentItemDto),
    IsNotEmpty(),
    __metadata("design:type", Array)
], SplitPaymentDto.prototype, "payments", void 0);
export class OrderBalanceQueryDto {
    order_total;
}
__decorate([
    ApiProperty({
        example: 100000,
        description: 'The grand total of the order from the POS/Cart service',
    }),
    IsNumber(),
    Min(0),
    Type(() => Number),
    __metadata("design:type", Number)
], OrderBalanceQueryDto.prototype, "order_total", void 0);

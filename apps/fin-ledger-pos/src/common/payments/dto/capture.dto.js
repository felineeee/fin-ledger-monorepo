var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// src/payments/dto/capture.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CaptureCardPresentDto {
    auth_code;
    entry_method;
}
__decorate([
    ApiPropertyOptional({ example: 'AUTH12345', description: 'Authorization code from the physical terminal' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CaptureCardPresentDto.prototype, "auth_code", void 0);
__decorate([
    ApiPropertyOptional({ example: 'EMV_CHIP', description: 'Method of card entry (EMV, SWIPE, CONTACTLESS)' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CaptureCardPresentDto.prototype, "entry_method", void 0);
export class ReversePaymentDto {
    reason;
}
__decorate([
    ApiProperty({ example: 'Cashier entered wrong amount', description: 'Reason for the same-day void/reversal' }),
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], ReversePaymentDto.prototype, "reason", void 0);

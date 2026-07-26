var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// src/payments/dto/webhooks.dto.ts
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Xendit payload varies heavily by event type, so we use a loose shape for the body
// but strictly type our Dispute actions.
export class DisputeResponseDto {
    evidence_text;
    evidence_url;
}
__decorate([
    ApiProperty({ example: 'Delivery proof signed by customer attached.', description: 'Evidence description' }),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], DisputeResponseDto.prototype, "evidence_text", void 0);
__decorate([
    ApiPropertyOptional({ example: 'https://storage/proof.pdf', description: 'URL to evidence document' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], DisputeResponseDto.prototype, "evidence_url", void 0);
export class UpdateDisputeStatusDto {
    status;
}
__decorate([
    ApiProperty({ enum: ['PENDING', 'WON', 'LOST'] }),
    IsEnum(['PENDING', 'WON', 'LOST']),
    IsNotEmpty(),
    __metadata("design:type", String)
], UpdateDisputeStatusDto.prototype, "status", void 0);

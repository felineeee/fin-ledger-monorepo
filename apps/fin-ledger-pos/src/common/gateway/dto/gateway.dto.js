var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// src/payments/dto/gateway.dto.ts
import { IsString, IsOptional, IsArray, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateCheckoutSessionDto {
    success_redirect_url;
    failure_redirect_url;
}
__decorate([
    ApiPropertyOptional({ example: 'https://my-store.com/success', description: 'Redirect URL after successful payment' }),
    IsOptional(),
    IsUrl(),
    __metadata("design:type", String)
], CreateCheckoutSessionDto.prototype, "success_redirect_url", void 0);
__decorate([
    ApiPropertyOptional({ example: 'https://my-store.com/fail', description: 'Redirect URL after failed payment' }),
    IsOptional(),
    IsUrl(),
    __metadata("design:type", String)
], CreateCheckoutSessionDto.prototype, "failure_redirect_url", void 0);
export class UpdateGatewayConfigDto {
    api_key;
    webhook_secret;
    enabled_channels;
}
__decorate([
    ApiProperty({ example: 'xnd_development_O4...', description: 'Xendit Secret API Key' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateGatewayConfigDto.prototype, "api_key", void 0);
__decorate([
    ApiProperty({ example: 'xnd_webhook_123...', description: 'Xendit Webhook Verification Token' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateGatewayConfigDto.prototype, "webhook_secret", void 0);
__decorate([
    ApiPropertyOptional({
        example: ['CREDIT_CARD', 'VIRTUAL_ACCOUNT', 'QRIS', 'EWALLET', 'PAYLATER'],
        description: 'Enabled payment channels for the hosted checkout'
    }),
    IsOptional(),
    IsArray(),
    __metadata("design:type", Array)
], UpdateGatewayConfigDto.prototype, "enabled_channels", void 0);

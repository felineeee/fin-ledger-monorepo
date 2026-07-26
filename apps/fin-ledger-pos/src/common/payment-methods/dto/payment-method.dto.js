var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsEnum, IsBoolean, IsOptional, IsObject, IsNotEmpty, } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreatePaymentMethodDto {
    name;
    type;
    is_active;
    config;
}
__decorate([
    ApiProperty({
        example: 'Main Register Cash',
        description: 'Display name for the POS or checkout',
    }),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreatePaymentMethodDto.prototype, "name", void 0);
__decorate([
    ApiProperty({
        enum: ['CASH', 'CARD', 'WALLET', 'VIRTUAL_ACCOUNT'],
        example: 'CASH',
    }),
    IsEnum(['CASH', 'CARD', 'WALLET', 'VIRTUAL_ACCOUNT']),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreatePaymentMethodDto.prototype, "type", void 0);
__decorate([
    ApiPropertyOptional({
        example: true,
        description: 'Whether this method is currently available for new payments',
    }),
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreatePaymentMethodDto.prototype, "is_active", void 0);
__decorate([
    ApiPropertyOptional({
        example: { require_drawer_open: true },
        description: 'JSON configuration for terminal or gateway',
    }),
    IsOptional(),
    IsObject(),
    __metadata("design:type", Object)
], CreatePaymentMethodDto.prototype, "config", void 0);
export class UpdatePaymentMethodDto {
    name;
    type;
    is_active;
    config;
}
__decorate([
    ApiPropertyOptional({ example: 'Main Register Cash (Updated)' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePaymentMethodDto.prototype, "name", void 0);
__decorate([
    ApiPropertyOptional({ enum: ['CASH', 'CARD', 'WALLET', 'VIRTUAL_ACCOUNT'] }),
    IsOptional(),
    IsEnum(['CASH', 'CARD', 'WALLET', 'VIRTUAL_ACCOUNT']),
    __metadata("design:type", String)
], UpdatePaymentMethodDto.prototype, "type", void 0);
__decorate([
    ApiPropertyOptional({
        example: false,
        description: 'Set to false to soft-delete/deactivate',
    }),
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdatePaymentMethodDto.prototype, "is_active", void 0);
__decorate([
    ApiPropertyOptional({ example: { require_drawer_open: false } }),
    IsOptional(),
    IsObject(),
    __metadata("design:type", Object)
], UpdatePaymentMethodDto.prototype, "config", void 0);

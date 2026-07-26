var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsInt, IsNotEmpty, IsOptional, IsUUID, Min, MaxLength, } from 'class-validator';
export class TransferRequestDto {
    source_account_id;
    target_account_id;
    amount;
    description;
}
__decorate([
    IsUUID(),
    IsNotEmpty(),
    __metadata("design:type", String)
], TransferRequestDto.prototype, "source_account_id", void 0);
__decorate([
    IsNotEmpty(),
    IsUUID('4', { message: 'target_account_id must be a valid UUID v4' }),
    __metadata("design:type", String)
], TransferRequestDto.prototype, "target_account_id", void 0);
__decorate([
    IsNotEmpty(),
    IsInt({
        message: 'amount must be a whole integer representing minor units (cents)',
    }),
    Min(1, { message: 'amount must be greater than zero cents' }),
    __metadata("design:type", Number)
], TransferRequestDto.prototype, "amount", void 0);
__decorate([
    IsOptional(),
    IsUUID('4'),
    MaxLength(255, { message: 'description cannot exceed 255 characters' }),
    __metadata("design:type", String)
], TransferRequestDto.prototype, "description", void 0);

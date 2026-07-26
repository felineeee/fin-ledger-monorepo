var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, UseInterceptors, } from '@nestjs/common';
import { LedgerService } from './ledger.service.js';
import { AuthGuard } from '@fin-ledger/guard';
import { CurrentUser } from '@fin-ledger/decorator';
import { TransferRequestDto } from './dto/transfer-request.dto.js';
import { IdempotencyInterceptor } from '@fin-ledger/interceptor';
let LedgerController = class LedgerController {
    ledgerService;
    constructor(ledgerService) {
        this.ledgerService = ledgerService;
    }
    async initiateTransfer(user, body) {
        const amountInCents = BigInt(body.amount);
        const result = await this.ledgerService.executeTransfer(user.id, body.target_account_id, body.source_account_id, amountInCents, body.description);
        return {
            success: true,
            message: 'Asset transfer processed',
            ...result,
        };
    }
    async openNewWallet(user, body) {
        return await this.ledgerService.createAccount(user.id, body.type, body.currency || 'USD');
    }
};
__decorate([
    Post(),
    UseGuards(AuthGuard),
    UseInterceptors(IdempotencyInterceptor),
    HttpCode(HttpStatus.OK),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, TransferRequestDto]),
    __metadata("design:returntype", Promise)
], LedgerController.prototype, "initiateTransfer", null);
__decorate([
    Post('accounts'),
    UseGuards(AuthGuard),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LedgerController.prototype, "openNewWallet", null);
LedgerController = __decorate([
    Controller('ledger'),
    __metadata("design:paramtypes", [LedgerService])
], LedgerController);
export { LedgerController };

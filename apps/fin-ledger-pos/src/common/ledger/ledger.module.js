var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { LedgerService } from './ledger.service.js';
import { LedgerController } from './ledger.controller.js';
import { LedgerRepository } from './ledger.repository.js';
import { DatabaseModule } from '@fin-ledger/database';
let LedgerModule = class LedgerModule {
};
LedgerModule = __decorate([
    Module({
        imports: [DatabaseModule],
        providers: [LedgerService, LedgerRepository],
        controllers: [LedgerController],
        exports: [LedgerService, LedgerRepository],
    })
], LedgerModule);
export { LedgerModule };

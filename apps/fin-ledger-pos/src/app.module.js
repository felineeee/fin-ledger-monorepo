var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { LedgerModule } from './common/ledger/ledger.module.js';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from '@fin-ledger/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '@fin-ledger/database';
import { PaymentMethodsModule } from './common/payment-methods/payment-methods.module.js';
import { PaymentsModule } from './common/payments/payments.module.js';
import { ShiftsModule } from './common/shifts/shifts.module.js';
import { TerminalsModule } from './common/terminals/terminals.module.js';
import { GatewayModule } from './common/gateway/gateway.module.js';
import { WebhooksModule } from './common/payments/webhooks/webhooks.module.js';
import { ReconciliationModule } from './common/reconciliation/reconciliation.module.js';
import { SettlementsModule } from './common/finance/settlements/settlements.module.js';
import { FeesModule } from './common/finance/fees/fees.module.js';
import { ReportsModule } from './common/finance/reports/reports.module.js';
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            ScheduleModule.forRoot(),
            LedgerModule,
            ConfigModule.forRoot({
                isGlobal: true,
                validate: validateEnv,
            }),
            DatabaseModule,
            ReportsModule,
            FeesModule,
            SettlementsModule,
            ReconciliationModule,
            WebhooksModule,
            GatewayModule,
            TerminalsModule,
            ShiftsModule,
            PaymentsModule,
            PaymentMethodsModule,
        ],
        controllers: [AppController],
        providers: [AppService],
    })
], AppModule);
export { AppModule };

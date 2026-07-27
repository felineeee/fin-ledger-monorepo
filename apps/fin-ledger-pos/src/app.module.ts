import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { LedgerModule } from './common/ledger/ledger.module.js';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
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

import { DatabaseModule } from '@fin-ledger/databases';
import { validateEnv } from '@fin-ledger/configs';
import { RedisModule } from '@fin-ledger/caches';
@Module({
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
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

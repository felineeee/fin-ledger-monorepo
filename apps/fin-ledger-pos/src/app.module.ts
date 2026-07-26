import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { LedgerModule } from './common/ledger/ledger.module.js';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from '@fin-ledger/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '@fin-ledger/database';
import { ReportsModule } from './common/reports/reports.module.js';
import { PaymentMethodsModule } from './common/payment-methods/payment-methods.module.js';
import { PaymentsModule } from './common/payments/payments.module.js';
import { ShiftsModule } from './common/shifts/shifts.module.js';
import { TerminalsModule } from './common/terminals/terminals.module.js';
import { GatewayModule } from './common/gateway/gateway.module.js';
import { WebhooksModule } from './common/webhooks/webhooks.module.js';
import { ReconciliationModule } from './common/reconciliation/reconciliation.module.js';
import { SettlementsModule } from './common/settlements/settlements.module.js';
import { FeesModule } from './common/fees/fees.module.js';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

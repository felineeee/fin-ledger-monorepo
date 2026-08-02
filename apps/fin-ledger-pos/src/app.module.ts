import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LedgerModule } from './common/ledger/ledger.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentMethodsModule } from './common/payment-methods/payment-methods.module';
import { PaymentsModule } from './common/payments/payments.module';
import { ShiftsModule } from './common/shifts/shifts.module';
import { TerminalsModule } from './common/terminals/terminals.module';
import { GatewayModule } from './common/gateway/gateway.module';
import { WebhooksModule } from './common/payments/webhooks/webhooks.module';
import { ReconciliationModule } from './common/reconciliation/reconciliation.module';
import { SettlementsModule } from './common/finance/settlements/settlements.module';
import { FeesModule } from './common/finance/fees/fees.module';
import { ReportsModule } from './common/finance/reports/reports.module';

import { DatabaseModule } from '@fin-ledger/databases';
import { validateEnv } from '@fin-ledger/configs';
import { RedisModule } from '@fin-ledger/caches';
import { HealthModule } from './common/health/health.module';
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
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

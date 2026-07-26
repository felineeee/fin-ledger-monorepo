import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { LedgerModule } from './common/ledger/ledger.module.js';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from '@inv-ledger/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '@inv-ledger/database';
import { ReportsModule } from './reports.module';
import { PaymentMethodsModule } from './payment-methods.module';
import { PaymentsModule } from './payments.module';
import { ShiftsModule } from './shifts.module';
import { TerminalsModule } from './terminals.module';
import { GatewayModule } from './gateway.module';
import { WebhooksModule } from './webhooks.module';
import { ReconciliationModule } from './reconciliation.module';
import { SettlementsModule } from './settlements.module';
import { FeesModule } from './fees.module';
import { ReportsModule } from './reports.module';
import { FeesModule } from './fees.module';
import { SettlementsModule } from './settlements.module';
import { ReconciliationModule } from './reconciliation.module';
import { WebhooksModule } from './webhooks.module';
import { ReportsModule } from './reports.module';

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

import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { LedgerModule } from './ledger/ledger.module.js';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from '@inv-ledger/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '@inv-ledger/database';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    LedgerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

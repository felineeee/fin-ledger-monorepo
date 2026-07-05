import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LedgerModule } from './modules/ledger/ledger.module';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.config';

@Module({
  imports: [
    LedgerModule,
    [
      ConfigModule.forRoot({
        isGlobal: true,
        validate: validateEnv,
      }),
    ],
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

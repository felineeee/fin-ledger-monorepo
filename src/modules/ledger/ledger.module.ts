import { Module } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { LedgerController } from './ledger.controller';
import { LedgerRepository } from './ledger.repository';

@Module({
  providers: [LedgerService],
  controllers: [LedgerController],
  exports: [LedgerService, LedgerRepository],
})
export class LedgerModule {}

import { Module } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { LedgerController } from './ledger.controller';
import { LedgerRepository } from './ledger.repository';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [LedgerService, LedgerRepository],
  controllers: [LedgerController],
  exports: [LedgerService, LedgerRepository],
})
export class LedgerModule {}

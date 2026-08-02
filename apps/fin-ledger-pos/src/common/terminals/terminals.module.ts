import { Module } from '@nestjs/common';
import { TerminalsService } from './terminals.service';
import { TerminalsController } from './terminals.controller';

@Module({
  controllers: [TerminalsController],
  providers: [TerminalsService],
})
export class TerminalsModule {}

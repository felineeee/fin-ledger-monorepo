import { Module } from '@nestjs/common';
import { TerminalsService } from './terminals.service.js';
import { TerminalsController } from './terminals.controller.js';

@Module({
  controllers: [TerminalsController],
  providers: [TerminalsService],
})
export class TerminalsModule {}

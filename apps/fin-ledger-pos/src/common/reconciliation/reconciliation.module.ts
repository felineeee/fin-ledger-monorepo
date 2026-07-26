import { Module } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service.js';
import { ReconciliationController } from './reconciliation.controller.js';

@Module({
  controllers: [ReconciliationController],
  providers: [ReconciliationService],
})
export class ReconciliationModule {}

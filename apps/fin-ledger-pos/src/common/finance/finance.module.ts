import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service.js';
import { FinanceController } from './finance.controller.js';
import { ReportsModule } from './reports/reports.module.js';

@Module({
  controllers: [FinanceController],
  providers: [FinanceService],
  imports: [ReportsModule],
})
export class FinanceModule {}

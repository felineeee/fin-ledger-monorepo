import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { ReportsModule } from './reports/reports.module';

@Module({
  controllers: [FinanceController],
  providers: [FinanceService],
  imports: [ReportsModule],
})
export class FinanceModule {}

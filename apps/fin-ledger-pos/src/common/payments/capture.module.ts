import { Module } from '@nestjs/common';
import { CaptureService } from './capture/capture.service.js';
import { CaptureController } from './capture.controller';
import { SplitModule } from './split/split.module';
import { TipsModule } from './tips/tips.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { RefundsModule } from './refunds/refunds.module';

@Module({
  controllers: [CaptureController],
  providers: [CaptureService],
  imports: [SplitModule, TipsModule, ReceiptsModule, RefundsModule],
})
export class CaptureModule {}

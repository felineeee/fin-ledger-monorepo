import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { PaymentsController } from './payments.controller.js';
import { CaptureModule } from './capture/capture.module';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
  imports: [CaptureModule],
})
export class PaymentsModule {}

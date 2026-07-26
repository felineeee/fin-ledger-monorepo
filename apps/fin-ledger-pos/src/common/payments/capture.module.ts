import { Module } from '@nestjs/common';
import { CaptureService } from './capture/capture.service.js';
import { CaptureController } from './capture.controller';
import { SplitModule } from './split/split.module';

@Module({
  controllers: [CaptureController],
  providers: [CaptureService],
  imports: [SplitModule],
})
export class CaptureModule {}

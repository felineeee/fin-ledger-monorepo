import { Module } from '@nestjs/common';
import { CaptureService } from './capture.service.js';
import { CaptureController } from './capture.controller.js';

@Module({
  controllers: [CaptureController],
  providers: [CaptureService],
})
export class CaptureModule {}

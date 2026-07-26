import { Module } from '@nestjs/common';
import { SplitTenderService } from './split.service.js';
import { SplitController } from './split/split.controller.js';

@Module({
  controllers: [SplitController],
  providers: [SplitTenderService],
})
export class SplitModule {}

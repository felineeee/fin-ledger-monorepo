import { Module } from '@nestjs/common';
import { SplitTenderService } from './split.service.js';
import { SplitTenderController } from './split.controller.js';

@Module({
  controllers: [SplitTenderController],
  providers: [SplitTenderService],
})
export class SplitModule {}

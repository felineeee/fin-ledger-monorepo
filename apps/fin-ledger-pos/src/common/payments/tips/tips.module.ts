import { Module } from '@nestjs/common';
import { TipsService } from './tips.service.js';
import { TipsController } from './tips.controller.js';

@Module({
  controllers: [TipsController],
  providers: [TipsService],
})
export class TipsModule {}

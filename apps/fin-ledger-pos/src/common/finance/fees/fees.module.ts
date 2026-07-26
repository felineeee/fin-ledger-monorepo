import { Module } from '@nestjs/common';
import { FeesService } from './fees.service.js';
import { FeesController } from './fees.controller.js';

@Module({
  controllers: [FeesController],
  providers: [FeesService],
})
export class FeesModule {}

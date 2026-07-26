import { Module } from '@nestjs/common';
import { SettlementsService } from './settlements.service.js';
import { SettlementsController } from './settlements.controller.js';

@Module({
  controllers: [SettlementsController],
  providers: [SettlementsService],
})
export class SettlementsModule {}

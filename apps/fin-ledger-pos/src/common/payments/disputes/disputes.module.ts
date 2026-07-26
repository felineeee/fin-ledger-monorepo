import { Module } from '@nestjs/common';
import { DisputesService } from './disputes.service.js';
import { DisputesController } from './disputes.controller.js';

@Module({
  controllers: [DisputesController],
  providers: [DisputesService],
})
export class DisputesModule {}

import { Module } from '@nestjs/common';
import { GatewayService } from './gateway.service.js';
import { GatewayController } from './gateway.controller.js';

@Module({
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}

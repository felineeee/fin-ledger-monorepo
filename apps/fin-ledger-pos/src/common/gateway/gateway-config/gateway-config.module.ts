import { Module } from '@nestjs/common';
import { GatewayConfigService } from './gateway-config.service';
import { GatewayConfigController } from './gateway-config.controller';

@Module({
  providers: [GatewayConfigService],
  controllers: [GatewayConfigController],
  exports: [GatewayConfigService],
})
export class GatewayConfigModule {}

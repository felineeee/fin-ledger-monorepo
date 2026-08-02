import { Module } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { GatewayController } from './gateway.controller';
import { GatewayConfigModule } from './gateway-config/gateway-config.module';

@Module({
  controllers: [GatewayController],
  providers: [GatewayService],
  exports: [GatewayService],
  imports: [GatewayConfigModule],
})
export class GatewayModule {}

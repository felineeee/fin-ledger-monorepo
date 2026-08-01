import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service.js';
import { WebhooksController } from './webhooks.controller.js';
import { GatewayModule } from '../../gateway/gateway.module.js';
import { FeesModule } from '../../finance/fees/fees.module.js';

@Module({
  imports: [GatewayModule, FeesModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}

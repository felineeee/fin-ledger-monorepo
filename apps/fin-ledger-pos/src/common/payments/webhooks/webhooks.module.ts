import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { GatewayModule } from '../../gateway/gateway.module';
import { FeesModule } from '../../finance/fees/fees.module';

@Module({
  imports: [GatewayModule, FeesModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}

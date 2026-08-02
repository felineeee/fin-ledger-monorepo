import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { GatewayModule } from '../../gateway/gateway.module';
import { FeesModule } from '../../finance/fees/fees.module';
import { XenditWebhookGuard } from './xendit.guard';
import { GatewayConfigModule } from '../../gateway/gateway-config/gateway-config.module';

@Module({
  imports: [GatewayModule, FeesModule, GatewayConfigModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, XenditWebhookGuard],
})
export class WebhooksModule {}

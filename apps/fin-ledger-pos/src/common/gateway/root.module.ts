import { Module } from '@nestjs/common';
import { GatewayModule } from './gateway.module';
import { CheckoutModule } from './checkout/checkout.module';
@Module({
  imports: [GatewayModule, CheckoutModule],
})
export class AppModule {}

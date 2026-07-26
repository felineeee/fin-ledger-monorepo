import { Module } from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service.js';
import { PaymentMethodsController } from './payment-methods.controller.js';

@Module({
  controllers: [PaymentMethodsController],
  providers: [PaymentMethodsService],
})
export class PaymentMethodsModule {}

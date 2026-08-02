// src/payments/checkout-pages.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { PaymentsService } from '../payments.service';
@Controller('payments/checkout')
export class ResponsesController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('success')
  async handleSuccessRedirect(@Query('payment_id') paymentId: string) {
    const payment = await this.paymentsService.findOne(paymentId);
    return {
      success: true,
      message: 'Payment completed successfully',
      data: {
        payment_id: paymentId,
        status: payment?.status || 'CAPTURED',
      },
    };
  }

  @Get('failed')
  async handleFailedRedirect(@Query('payment_id') paymentId: string) {
    const payment = await this.paymentsService.findOne(paymentId);
    return {
      success: false,
      message: 'Payment failed or was cancelled',
      data: {
        payment_id: paymentId,
        status: payment?.status || 'FAILED',
      },
    };
  }
}

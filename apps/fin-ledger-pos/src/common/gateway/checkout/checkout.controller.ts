// src/gateway/checkout.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CheckoutService } from './checkout.service.js';
import { CreateCheckoutSessionDto } from '../dto/checkout.dto.js';

@ApiTags('online-checkout')
@ApiBearerAuth()
@Controller('api/payments/:id')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('create-checkout-session')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Initialize online hosted checkout session or VA/QRIS',
  })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  async createCheckoutSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.checkoutService.createSession(id, dto);
  }

  @Get('checkout-session')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get checkout session status' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  async getCheckoutSession(@Param('id', ParseUUIDPipe) id: string) {
    return this.checkoutService.getSessionStatus(id);
  }

  // Note: /retry is effectively just calling /create-checkout-session again with the same Payment ID
  // Note: /cancel-checkout-session would interact with Xendit's cancellation endpoints depending on the method.
}

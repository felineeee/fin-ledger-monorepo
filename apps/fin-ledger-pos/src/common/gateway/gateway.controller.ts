// src/payments/gateway.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { GatewayService } from './gateway.service.js';
import { CreateCheckoutSessionDto } from './dto/gateway.dto.js';
import { UpdateGatewayConfigDto } from './dto/gateway-config.dto.js';

@ApiTags('online-gateway')
@ApiBearerAuth()
@Controller('api')
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Post('payments/:id/create-checkout-session')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Initialize online hosted checkout session via Xendit',
  })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({
    status: 201,
    description: 'Checkout URL generated successfully',
  })
  async createCheckoutSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.gatewayService.createCheckoutSession(id, dto);
  }

  @Get('payments/:id/checkout-session')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get checkout session status and payload directly from Xendit',
  })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  async getCheckoutSession(@Param('id', ParseUUIDPipe) id: string) {
    return this.gatewayService.getCheckoutSession(id);
  }

  @Post('payments/:id/retry')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Expire old Xendit invoice and generate a new checkout session',
  })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  async retryCheckoutSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.gatewayService.retryCheckoutSession(id, dto);
  }

  @Post('payments/:id/cancel-checkout-session')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Expire Xendit invoice and void the internal payment ledger',
  })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  async cancelCheckoutSession(@Param('id', ParseUUIDPipe) id: string) {
    return this.gatewayService.cancelCheckoutSession(id);
  }

  @Get('gateway-config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get active gateway providers and public keys (SuperAdmin)',
  })
  async getGatewayConfig() {
    return this.gatewayService.getGatewayConfig();
  }

  @Patch('gateway-config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Configure/enable gateway provider settings (SuperAdmin)',
  })
  async updateGatewayConfig(@Body() dto: UpdateGatewayConfigDto) {
    return this.gatewayService.updateGatewayConfig(dto);
  }
}

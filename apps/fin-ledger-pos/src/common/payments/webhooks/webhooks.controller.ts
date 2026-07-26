// src/payments/webhooks.controller.ts
import { 
  Controller, Get, Post, Patch, Body, Param, Headers, ParseUUIDPipe, HttpCode, HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiHeader } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service.js';
import { DisputeResponseDto, UpdateDisputeStatusDto } from '../dto/webhooks.dto.js';

@ApiTags('gateway-webhooks')
@Controller('api')
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
  ) {}

  // --- WEBHOOKS ---
  
  @Post('webhooks/gateway')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inbound Xendit webhook handler stub' })
  @ApiHeader({ name: 'x-callback-token', required: true, description: 'Xendit verification token' })
  async handleGatewayWebhook(
    @Headers('x-callback-token') callbackToken: string,
    @Body() payload: any,
  ) {
    return this.webhooksService.handleGatewayWebhook(callbackToken, payload);
  }

  @Get('webhooks/events')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Internal audit log of received webhooks (debugging/deduplication)' })
  async getWebhookEvents() {
    return this.webhooksService.getWebhookEvents();
  }

  @Get('webhooks/events/:id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get details of a specific received webhook event' })
  async getWebhookEventDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.webhooksService.getWebhookEventDetails(id);
  }
}
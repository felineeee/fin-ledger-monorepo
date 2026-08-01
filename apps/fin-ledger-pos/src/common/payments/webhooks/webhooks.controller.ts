// src/payments/webhooks/webhooks.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service.js';
import { XenditWebhookGuard } from './xendit.guard.js';

@ApiTags('webhooks')
@Controller('api/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('gateway')
  @UseGuards(XenditWebhookGuard)
  @HttpCode(HttpStatus.OK) // Xendit requires a 200 OK response
  @ApiOperation({ summary: 'Inbound payment gateway webhook handler' })
  @ApiHeader({
    name: 'x-callback-token',
    description: 'Xendit verification callback token',
  })
  async handleXenditWebhook(
    @Headers('x-callback-token') token: string,
    @Body() payload: any,
  ) {
    // Extract event type from payload (Xendit places it in 'event', 'type', or payload data)
    const eventType =
      payload.event || payload.type || payload.data?.event || 'unknown';

    // Matches the updated WebhooksService: handleGatewayWebhook(callbackToken, eventType, payload)
    return await this.webhooksService.handleGatewayWebhook(
      token,
      eventType,
      payload,
    );
  }

  @Get('events')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Internal audit log of received webhooks' })
  async getEvents() {
    return this.webhooksService.getWebhookEvents();
  }

  @Get('events/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get details of a specific received webhook event' })
  @ApiParam({ name: 'id', description: 'Webhook Event UUID' })
  async getEventById(@Param('id', ParseUUIDPipe) id: string) {
    // Matches the updated WebhooksService: getWebhookEventDetails(id)
    return this.webhooksService.getWebhookEventDetails(id);
  }
}

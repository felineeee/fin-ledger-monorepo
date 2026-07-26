// src/payments/receipts.controller.ts
import { 
  Controller, Get, Post, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ReceiptsService } from './receipts.service.js';
import { ResendReceiptDto } from '../dto/receipts.dto.js';

@ApiTags('receipts')
@ApiBearerAuth()
@Controller('api/payments')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get(':id/receipt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve formatted receipt payload for a payment' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 200, description: 'Structured JSON payload for POS rendering' })
  async getReceipt(@Param('id', ParseUUIDPipe) id: string) {
    return this.receiptsService.getReceipt(id);
  }

  @Post(':id/receipt/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Email or SMS a copy of the receipt to the customer' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 200, description: 'Notification queued successfully' })
  async resendReceipt(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResendReceiptDto,
  ) {
    return this.receiptsService.resendReceipt(id, dto);
  }
}
// src/payments/split.controller.ts
import { 
  Controller, Get, Post, Body, Param, Query, Headers, ParseUUIDPipe, HttpCode, HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiHeader } from '@nestjs/swagger';
import { SplitTenderService } from './split.service.js';
import { SplitPaymentDto, OrderBalanceQueryDto } from '../dto/split.dto.js';

@ApiTags('split-tender')
@ApiBearerAuth()
@Controller('api/orders')
export class SplitTenderController {
  constructor(private readonly splitService: SplitTenderService) {}

  @Post(':orderId/payments/split')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Atomically orchestrate multiple captures (part cash, part card)' })
  @ApiParam({ name: 'orderId', description: 'Order UUID' })
  @ApiHeader({ name: 'Idempotency-Key', required: false, description: 'UUID to prevent double-charging' })
  @ApiResponse({ status: 201, description: 'All split payments recorded successfully' })
  async processSplitTender(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: SplitPaymentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.splitService.processSplitTender(orderId, dto, idempotencyKey);
  }

  @Get(':orderId/payments/balance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate remaining unpaid balance on an order' })
  @ApiParam({ name: 'orderId', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Returns total paid, remaining balance, and full-payment status' })
  async getOrderBalance(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Query() query: OrderBalanceQueryDto,
  ) {
    return this.splitService.getOrderBalance(orderId, query);
  }
}
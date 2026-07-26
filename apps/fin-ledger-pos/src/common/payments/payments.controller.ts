import { 
  Controller, Get, Post, Patch, Delete, Body, Param, Headers, ParseUUIDPipe, HttpCode, HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiHeader } from '@nestjs/swagger';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payments.dto.js';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('api')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('payments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new payment attempt (Writes PENDING state and PAYMENT_CREATED ledger event)' })
  @ApiHeader({ name: 'Idempotency-Key', required: false, description: 'UUID to prevent double-charging on network retries' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  async createPayment(
    @Body() dto: CreatePaymentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.paymentsService.createPayment(dto, idempotencyKey);
  }

  @Get('payments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all payment attempts across the system' })
  async findAll() {
    return this.paymentsService.findAll();
  }

  @Get('payments/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get details of a single payment attempt' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch('payments/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Edit amount or method for PENDING payments prior to capture' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 200, description: 'Payment updated' })
  @ApiResponse({ status: 409, description: 'Conflict: Payment is no longer in PENDING state' })
  async updatePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentDto,
  ) {
    return this.paymentsService.updatePayment(id, dto);
  }

  @Delete('payments/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an uncaptured payment record (Writes VOIDED to ledger)' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 200, description: 'Payment marked as VOIDED' })
  async cancelPayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.cancelPayment(id);
  }

  @Get('orders/:orderId/payments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all payment attempts linked to a specific order' })
  @ApiParam({ name: 'orderId', description: 'Order UUID' })
  async findByOrderId(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.paymentsService.findByOrderId(orderId);
  }
}
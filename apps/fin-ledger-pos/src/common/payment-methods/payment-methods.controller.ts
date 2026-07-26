import { Controller, Get, Post, Body, Patch, Param, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PaymentMethodsService } from './payment-methods.service.js';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './dto/payment-method.dto.js';

@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all configured payment methods system-wide' })
  @ApiResponse({ status: 200, description: 'Array of payment methods returned' })
  async findAll() {
    return this.paymentMethodsService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new payment method configuration' })
  @ApiResponse({ status: 201, description: 'Payment method successfully created' })
  async create(@Body() dto: CreatePaymentMethodDto) {
    return this.paymentMethodsService.create(dto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get details of a single payment method' })
  @ApiParam({ name: 'id', description: 'Payment Method UUID' })
  @ApiResponse({ status: 200, description: 'Payment method details retrieved' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentMethodsService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update payment method configuration or status (e.g. soft delete)' })
  @ApiParam({ name: 'id', description: 'Payment Method UUID' })
  @ApiResponse({ status: 200, description: 'Payment method updated successfully' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodsService.update(id, dto);
  }
}

// src/payments/refunds.controller.ts
import { 
  Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RefundsService } from './refunds.service.js';
import { CreateRefundDto, UpdateRefundStatusDto } from '../dto/refunds.dto.js';

@ApiTags('refunds')
@ApiBearerAuth()
@Controller('api')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post('payments/:id/refunds')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Issue a new refund request against a captured payment' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 201, description: 'Refund created in PENDING state' })
  async issueRefund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateRefundDto,
  ) {
    return this.refundsService.issueRefund(id, dto);
  }

  @Get('payments/:id/refunds')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all refunds associated with a specific payment' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  async getRefundsByPayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.refundsService.getRefundsByPayment(id);
  }

  @Get('refunds')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all refunds system-wide' })
  async getAllRefunds() {
    return this.refundsService.getAllRefunds();
  }

  @Get('refunds/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get details of a single refund' })
  @ApiParam({ name: 'id', description: 'Refund UUID' })
  async getRefundById(@Param('id', ParseUUIDPipe) id: string) {
    return this.refundsService.getRefundById(id);
  }

  @Patch('refunds/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update async refund status (Writes REFUNDED to ledger if COMPLETED)' })
  @ApiParam({ name: 'id', description: 'Refund UUID' })
  @ApiResponse({ status: 200, description: 'Refund status updated, ledger synchronized if completed' })
  async updateRefundStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRefundStatusDto,
  ) {
    return this.refundsService.updateRefundStatus(id, dto);
  }
}
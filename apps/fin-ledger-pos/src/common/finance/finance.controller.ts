// src/finance/finance.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
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
import { FinanceService } from './finance.service.js';
import {
  CreateFeeScheduleDto,
  UpdateFeeScheduleDto,
  ReportQueryDto,
} from './dto/finance.dto.js';

@ApiTags('finance-and-reporting')
@ApiBearerAuth()
@Controller('api')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // --- REPORTING ---
  @Get('locations/:id/reports/payment-methods-breakdown')
  @ApiOperation({
    summary: 'Breakdown of sales by payment method per location',
  })
  async getPaymentMethodBreakdown(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.financeService.getPaymentMethodBreakdown(id, query);
  }

  @Get('locations/:id/reports/failed-payments')
  @ApiOperation({
    summary: 'Report of failed/voided payment attempts per location',
  })
  async getFailedPaymentsReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.financeService.getFailedPaymentsReport(id, query);
  }

  @Get('reports/revenue/company-wide')
  @ApiOperation({ summary: 'Consolidated company-wide net revenue reporting' })
  async getCompanyWideRevenue(@Query() query: ReportQueryDto) {
    return this.financeService.getCompanyWideRevenue(query);
  }
}

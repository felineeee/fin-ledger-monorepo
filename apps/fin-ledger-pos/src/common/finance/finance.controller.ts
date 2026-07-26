// src/finance/finance.controller.ts
import { 
  Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { FinanceService } from './finance.service.js';
import { CreateFeeScheduleDto, UpdateFeeScheduleDto, ReportQueryDto } from './dto/finance.dto.js';

@ApiTags('finance-and-reporting')
@ApiBearerAuth()
@Controller('api')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // --- SETTLEMENTS ---
  @Get('settlements')
  @ApiOperation({ summary: 'List processor bank payouts/settlements' })
  async getSettlements() { return this.financeService.getSettlements(); }

  @Get('settlements/:id')
  async getSettlementById(@Param('id', ParseUUIDPipe) id: string) { return this.financeService.getSettlementById(id); }

  @Post('settlements/:id/mark-paid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark settlement reconciled in bank account' })
  async markSettlementPaid(@Param('id', ParseUUIDPipe) id: string) { return this.financeService.markSettlementPaid(id); }

  // --- FEES & CURRENCY ---
  @Get('fee-schedules')
  @ApiOperation({ summary: 'List processor fee schedules by payment method' })
  async getFeeSchedules() { return this.financeService.getFeeSchedules(); }

  @Post('fee-schedules')
  @HttpCode(HttpStatus.CREATED)
  async createFeeSchedule(@Body() dto: CreateFeeScheduleDto) { return this.financeService.createFeeSchedule(dto); }

  @Patch('fee-schedules/:id')
  async updateFeeSchedule(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFeeScheduleDto) {
    return this.financeService.updateFeeSchedule(id, dto);
  }

  @Get('payments/:id/fees')
  @ApiOperation({ summary: 'Get detailed fee breakdown for net-revenue calculation' })
  async calculatePaymentFees(@Param('id', ParseUUIDPipe) id: string) { return this.financeService.calculatePaymentFees(id); }

  @Get('currencies')
  async getCurrencies() { return this.financeService.getCurrencies(); }

  @Get('exchange-rates')
  async getExchangeRates() { return this.financeService.getExchangeRates(); }

  // --- REPORTING ---
  @Get('locations/:id/reports/payment-methods-breakdown')
  @ApiOperation({ summary: 'Breakdown of sales by payment method per location' })
  async getPaymentMethodBreakdown(@Param('id', ParseUUIDPipe) id: string, @Query() query: ReportQueryDto) {
    return this.financeService.getPaymentMethodBreakdown(id, query);
  }

  @Get('locations/:id/reports/failed-payments')
  @ApiOperation({ summary: 'Report of failed/voided payment attempts per location' })
  async getFailedPaymentsReport(@Param('id', ParseUUIDPipe) id: string, @Query() query: ReportQueryDto) {
    return this.financeService.getFailedPaymentsReport(id, query);
  }

  @Get('reports/revenue/company-wide')
  @ApiOperation({ summary: 'Consolidated company-wide net revenue reporting' })
  async getCompanyWideRevenue(@Query() query: ReportQueryDto) {
    return this.financeService.getCompanyWideRevenue(query);
  }
}
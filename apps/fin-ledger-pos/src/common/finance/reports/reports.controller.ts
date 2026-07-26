// src/finance/reports.controller.ts
import {
  Controller,
  Get,
  Query,
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
import { ReportsService } from './reports.service.js';
import { ReportQueryDto } from '../dto/reports.dto.js';

@ApiTags('financial-reporting')
@ApiBearerAuth()
@Controller('api')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('locations/:id/reports/payment-methods-breakdown')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Breakdown of realized sales by payment method per location',
  })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiResponse({
    status: 200,
    description: 'Returns volume and count grouped by method',
  })
  async getPaymentMethodBreakdown(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getPaymentMethodBreakdown(id, query);
  }

  @Get('locations/:id/reports/failed-payments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Report of failed and voided payment attempts per location',
  })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiResponse({ status: 200, description: 'Returns lost volume and counts' })
  async getFailedPaymentsReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getFailedPaymentsReport(id, query);
  }

  @Get('reports/revenue/company-wide')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consolidated company-wide net revenue reporting' })
  @ApiResponse({
    status: 200,
    description: 'Returns gross volume, total refunds, and net revenue',
  })
  async getCompanyWideRevenue(@Query() query: ReportQueryDto) {
    return this.reportsService.getCompanyWideRevenue(query);
  }
}

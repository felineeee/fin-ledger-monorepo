// src/reconciliation/reconciliation.controller.ts
import { 
  Controller, Get, Post, Query, Param, ParseUUIDPipe, HttpCode, HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ReconciliationService } from './reconciliation.service.js';
import { LedgerQueryDto, DailyReconciliationQueryDto, DiscrepancyQueryDto } from './dto/reconciliation.dto.js';

@ApiTags('reconciliation-ledger')
@ApiBearerAuth()
@Controller('api')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Get('payments/ledger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List immutable transaction ledger records' })
  async getLedgerRecords(@Query() query: LedgerQueryDto) {
    return this.reconciliationService.getLedgerRecords(query);
  }

  @Get('payments/ledger/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single ledger entry details' })
  @ApiParam({ name: 'id', description: 'Ledger Entry UUID' })
  async getLedgerRecordById(@Param('id', ParseUUIDPipe) id: string) {
    return this.reconciliationService.getLedgerRecordById(id);
  }

  @Get('locations/:id/reconciliation/daily')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch daily shift reconciliation breakdown against shift records' })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  async getDailyReconciliation(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DailyReconciliationQueryDto,
  ) {
    return this.reconciliationService.getDailyReconciliation(id, query);
  }

  @Get('reconciliation/discrepancies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List cash drawer/terminal variance discrepancies system-wide' })
  async getDiscrepancies(@Query() query: DiscrepancyQueryDto) {
    return this.reconciliationService.getDiscrepancies(query);
  }

  @Post('locations/:id/reconciliation/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lock and close shift/day financial reconciliation (Force closes open shifts)' })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiResponse({ status: 200, description: 'Day is locked and final variance report returned' })
  async closeDailyReconciliation(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DailyReconciliationQueryDto,
  ) {
    return this.reconciliationService.closeDailyReconciliation(id, query);
  }
}
import {
  Controller,
  Get,
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
import { AuditFilterDto } from '../dto/audit-filter.dto.js';
import { AuditService } from './audit.service.js';

@ApiTags('inventory-ledger')
@ApiBearerAuth()
@Controller('api/inventory/ledger')
export class AuditController {
  constructor(private readonly ledgerService: AuditService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Query audit trail filterable by product, location, or date',
  })
  @ApiResponse({
    status: 200,
    description: 'Ledger entries retrieved successfully',
  })
  async getLedger(@Query() filters: AuditFilterDto) {
    return this.ledgerService.getLedger(filters);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve single ledger entry details for deep audit drill-downs',
  })
  @ApiParam({ name: 'id', description: 'Ledger Entry UUID' })
  @ApiResponse({ status: 200, description: 'Ledger entry found' })
  @ApiResponse({ status: 404, description: 'Ledger entry not found' })
  async getLedgerEntry(@Param('id', ParseUUIDPipe) id: string) {
    return this.ledgerService.getLedgerEntry(id);
  }
}

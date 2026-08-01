import {
  Controller,
  Get,
  Post,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SettlementsService } from './settlements.service.js';
import {
  QuerySettlementsDto,
  MarkSettlementPaidDto,
} from '../dto/finance.dto.js';

@ApiTags('settlements')
@ApiBearerAuth()
@Controller('api/settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List processor bank payouts/settlements' })
  async getSettlements(@Query() query: QuerySettlementsDto) {
    return this.settlementsService.getSettlements(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get settlement details' })
  @ApiParam({ name: 'id', description: 'Settlement UUID' })
  async getSettlementById(@Param('id', ParseUUIDPipe) id: string) {
    return this.settlementsService.getSettlementById(id);
  }

  @Post(':id/mark-paid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark settlement reconciled in bank account' })
  @ApiParam({ name: 'id', description: 'Settlement UUID' })
  async markSettlementPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkSettlementPaidDto,
  ) {
    return this.settlementsService.markSettlementPaid(id, dto);
  }
}

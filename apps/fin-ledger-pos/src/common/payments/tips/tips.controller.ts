// src/payments/tips.controller.ts
import { 
  Controller, Get, Patch, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TipsService } from './tips.service.js';
import { UpdateTipDto, TipReportQueryDto } from '../dto/tips.dto.js';

@ApiTags('tips')
@ApiBearerAuth()
@Controller('api')
export class TipsController {
  constructor(private readonly tipsService: TipsService) {}

  @Patch('payments/:id/tip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Attach or adjust a tip amount post-capture (Writes TIP_ADDED delta to ledger)' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 200, description: 'Tip adjusted and ledger updated' })
  async adjustTip(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTipDto,
  ) {
    return this.tipsService.adjustTip(id, dto);
  }

  @Get('locations/:id/reports/tips')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get tip totals filtered by location, grouped by cashier' })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiResponse({ status: 200, description: 'Returns grand total and cashier breakdown' })
  async getTipTotals(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: TipReportQueryDto,
  ) {
    return this.tipsService.getTipTotals(id, query);
  }
}
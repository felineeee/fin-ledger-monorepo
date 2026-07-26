import {
  Controller,
  Get,
  Post,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { SettlementsService } from './settlements.service.js';

@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}
  @Get('settlements')
  @ApiOperation({ summary: 'List processor bank payouts/settlements' })
  async getSettlements() {
    return this.settlementsService.getSettlements();
  }

  @Get('settlements/:id')
  async getSettlementById(@Param('id', ParseUUIDPipe) id: string) {
    return this.settlementsService.getSettlementById(id);
  }

  @Post('settlements/:id/mark-paid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark settlement reconciled in bank account' })
  async markSettlementPaid(@Param('id', ParseUUIDPipe) id: string) {
    return this.settlementsService.markSettlementPaid(id);
  }
}

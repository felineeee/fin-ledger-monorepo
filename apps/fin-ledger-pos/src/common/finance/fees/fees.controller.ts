import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { FeesService } from './fees.service.js';
import {
  CreateFeeScheduleDto,
  UpdateFeeScheduleDto,
} from '../dto/finance.dto.js';

@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Get('fee-schedules')
  @ApiOperation({ summary: 'List processor fee schedules by method' })
  async getFeeSchedules() {
    return this.feesService.getFeeSchedules();
  }

  @Post('fee-schedules')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new fee schedule' })
  async createFeeSchedule(@Body() dto: CreateFeeScheduleDto) {
    return this.feesService.createFeeSchedule(dto);
  }

  @Patch('fee-schedules/:id')
  @ApiOperation({ summary: 'Update fee schedule rates' })
  async updateFeeSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFeeScheduleDto,
  ) {
    return this.feesService.updateFeeSchedule(id, dto);
  }

  @Get('payments/:id/fees')
  @ApiOperation({
    summary: 'Get detailed fee breakdown snapshot for a captured payment',
  })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  async getPaymentFees(@Param('id', ParseUUIDPipe) id: string) {
    return this.feesService.getPaymentFeesSnapshot(id);
  }

  @Get('payments/:id/fees')
  @ApiOperation({
    summary: 'Get detailed fee breakdown for net-revenue calculation',
  })
  async calculatePaymentFees(@Param('id', ParseUUIDPipe) id: string) {
    return this.feesService.calculatePaymentFees(id);
  }
}

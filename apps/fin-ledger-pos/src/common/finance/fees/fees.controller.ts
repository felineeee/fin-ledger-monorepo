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
import { ApiOperation } from '@nestjs/swagger';
import { FeesService } from './fees.service.js';
import {
  CreateFeeScheduleDto,
  UpdateFeeScheduleDto,
} from '../dto/finance.dto.js';

@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Get('fee-schedules')
  @ApiOperation({ summary: 'List processor fee schedules by payment method' })
  async getFeeSchedules() {
    return this.feesService.getFeeSchedules();
  }

  @Post('fee-schedules')
  @HttpCode(HttpStatus.CREATED)
  async createFeeSchedule(@Body() dto: CreateFeeScheduleDto) {
    return this.feesService.createFeeSchedule(dto);
  }

  @Patch('fee-schedules/:id')
  async updateFeeSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFeeScheduleDto,
  ) {
    return this.feesService.updateFeeSchedule(id, dto);
  }

  @Get('payments/:id/fees')
  @ApiOperation({
    summary: 'Get detailed fee breakdown for net-revenue calculation',
  })
  async calculatePaymentFees(@Param('id', ParseUUIDPipe) id: string) {
    return this.feesService.calculatePaymentFees(id);
  }
}

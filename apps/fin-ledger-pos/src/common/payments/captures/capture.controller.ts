// src/payments/capture.controller.ts
import { 
  Controller, Post, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CaptureService } from './capture.service.js';
import { CaptureCardPresentDto, ReversePaymentDto } from '../dto/capture.dto.js';

@ApiTags('payments-capture')
@ApiBearerAuth()
@Controller('api/payments')
export class CaptureController {
  constructor(private readonly captureService: CaptureService) {}

  @Post(':id/capture-cash')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete and record a cash payment capture' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 200, description: 'Payment status updated to CAPTURED' })
  async captureCash(@Param('id', ParseUUIDPipe) id: string) {
    return this.captureService.captureCash(id);
  }

  @Post(':id/capture-card-present')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate or complete card-present hardware capture' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 200, description: 'Payment status updated to CAPTURED' })
  async captureCardPresent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CaptureCardPresentDto,
  ) {
    return this.captureService.captureCardPresent(id, dto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Void a payment attempt prior to capture completion' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 200, description: 'Payment status updated to VOIDED' })
  async cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.captureService.cancel(id);
  }

  @Post(':id/reverse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reverse a fully captured in-person payment (same-day window void)' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 200, description: 'Payment reversed and marked as VOIDED' })
  async reverse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReversePaymentDto,
  ) {
    return this.captureService.reverse(id, dto);
  }
}
// src/payments/disputes/disputes.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DisputesService } from './disputes.service.js';
import {
  DisputeResponseDto,
  UpdateDisputeStatusDto,
} from '../dto/webhooks.dto.js';

@ApiTags('disputes')
@ApiBearerAuth()
@Controller('api/disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Get()
  @ApiOperation({ summary: 'List all chargebacks and disputes' })
  async getDisputes() {
    return this.disputesService.getAllDisputes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute details' })
  @ApiParam({ name: 'id', description: 'Dispute UUID' })
  async getDisputeById(@Param('id', ParseUUIDPipe) id: string) {
    // Aligned with service method: getDisputeDetails
    return this.disputesService.getDisputeDetails(id);
  }

  @Post(':id/respond')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit evidence response for a dispute' })
  @ApiParam({ name: 'id', description: 'Dispute UUID' })
  async respondToDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DisputeResponseDto,
  ) {
    // Aligned with service method: respondToDispute & DisputeResponseDto
    return this.disputesService.respondToDispute(id, dto);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update internal dispute lifecycle status' })
  @ApiParam({ name: 'id', description: 'Dispute UUID' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDisputeStatusDto,
  ) {
    return this.disputesService.updateDisputeStatus(id, dto);
  }
}

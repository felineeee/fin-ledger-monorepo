// src/payments/webhooks.controller.ts
import { 
  Controller, Get, Post, Patch, Body, Param, Headers, ParseUUIDPipe, HttpCode, HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiHeader } from '@nestjs/swagger';
import { DisputesService } from './disputes.service.js';
import { DisputeResponseDto, UpdateDisputeStatusDto } from '../dto/webhooks.dto.js';

@ApiTags('gateway-webhooks')
@Controller('api')
export class DisputesController {
  constructor(
    private readonly disputesService: DisputesService,
  ) {}
  // --- DISPUTES ---

  @Get('disputes')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all chargebacks and disputes' })
  async getAllDisputes() {
    return this.disputesService.getAllDisputes();
  }

  @Get('disputes/:id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get dispute details' })
  async getDisputeDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.disputesService.getDisputeDetails(id);
  }

  @Post('disputes/:id/respond')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit evidence response for a dispute' })
  async respondToDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DisputeResponseDto,
  ) {
    return this.disputesService.respondToDispute(id, dto);
  }

  @Patch('disputes/:id/status')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update internal dispute lifecycle status (Writes VOIDED to ledger if LOST)' })
  async updateDisputeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDisputeStatusDto,
  ) {
    return this.disputesService.updateDisputeStatus(id, dto);
  }
}
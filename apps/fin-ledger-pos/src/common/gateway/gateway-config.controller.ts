import {
  Controller,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GatewayService } from './gateway.service.js';
import { UpdateGatewayConfigDto } from './dto/gateway-config.dto.js';

@ApiTags('gateway-config')
@ApiBearerAuth()
@Controller('api/gateway-config')
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Get()
  @ApiOperation({
    summary: 'Get active gateway providers and public keys (SuperAdmin)',
  })
  async getConfig() {
    return this.gatewayService.getConfig();
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Configure/enable gateway provider settings (SuperAdmin)',
  })
  async updateConfig(@Body() dto: UpdateGatewayConfigDto) {
    return this.gatewayService.updateConfig(dto);
  }
}

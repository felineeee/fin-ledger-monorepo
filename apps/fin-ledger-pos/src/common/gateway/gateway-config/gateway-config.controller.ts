import {
  Controller,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UpdateGatewayConfigDto } from '../dto/gateway-config.dto.js';
import { GatewayConfigService } from './gateway-config.service.js';

@ApiTags('gateway-config')
@ApiBearerAuth()
@Controller('api/gateway-config')
export class GatewayConfigController {
  constructor(private readonly gatewayConfigService: GatewayConfigService) {}

  @Get()
  @ApiOperation({
    summary: 'Get active gateway providers and public keys (SuperAdmin)',
  })
  async getConfig() {
    return this.gatewayConfigService.getGatewayConfig();
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Configure/enable gateway provider settings (SuperAdmin)',
  })
  async updateConfig(@Body() dto: UpdateGatewayConfigDto) {
    return this.gatewayConfigService.updateGatewayConfig(dto);
  }
}

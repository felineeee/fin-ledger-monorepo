import { Controller } from '@nestjs/common';
import { GatewayService } from './gateway.service.js';

@Controller('gateway')
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}
}

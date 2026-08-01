// src/payments/webhooks/xendit.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { GatewayService } from '../../gateway/gateway.service.js';

@Injectable()
export class XenditWebhookGuard implements CanActivate {
  constructor(private readonly gatewayService: GatewayService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const incomingToken = request.headers['x-callback-token'];
    const expectedToken = this.gatewayService.getWebhookToken();

    if (!incomingToken || incomingToken !== expectedToken) {
      console.warn('🚨 Unauthorized webhook attempt detected.');
      throw new UnauthorizedException('Invalid callback token');
    }

    return true;
  }
}

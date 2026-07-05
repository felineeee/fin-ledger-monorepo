import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class PiiScrubberLogger extends ConsoleLogger {
  private readonly piiKeys = new Set([
    'account_id',
    'target_account_id',
    'user_id',
    'senderUserId',
  ]);

  log(message: any, context?: string) {
    const scrubbedMessage = this.processPayload(message);
    super.log(JSON.stringify(scrubbedMessage), context);
  }

  error(message: any, stack?: string, context?: string) {
    const scrubbedMessage = this.processPayload(message);
    super.error(JSON.stringify(scrubbedMessage), stack, context);
  }

  warn(message: any, context?: string) {
    const scrubbedMessage = this.processPayload(message);
    super.warn(JSON.stringify(scrubbedMessage), context);
  }

  private processPayload(payload: any): any {
    if (payload === null || payload === undefined) {
      return payload;
    }
    if (typeof payload === 'string') {
      return payload;
    }

    if (typeof payload === 'object') {
      if (Array.isArray(payload)) {
        return payload.map((item) => this.processPayload(item));
      }

      const scrubbedObj: Record<string, any> = {};
      for (const key in payload) {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
          if (this.piiKeys.has(key) && typeof payload[key] === 'string') {
            scrubbedObj[key] = this.maskString(payload[key]);
          } else {
            scrubbedObj[key] = this.processPayload(payload[key]);
          }
        }
      }
    }
  }
  private maskString(val: string): string {
    if (val.length <= 8) {
      return '********';
    }
    return `${val.substring(0, 4)}-****-${val.substring(val.length - 4)}`;
  }
}

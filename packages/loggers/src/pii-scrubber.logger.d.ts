import { ConsoleLogger } from '@nestjs/common';
export declare class PiiScrubberLogger extends ConsoleLogger {
    private readonly piiKeys;
    log(message: unknown, context?: string): void;
    error(message: unknown, stack?: string, context?: string): void;
    warn(message: unknown, context?: string): void;
    private processPayload;
    private maskString;
}

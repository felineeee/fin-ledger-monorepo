import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import * as crypto from 'crypto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const traceId = crypto.randomUUID();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorMessage =
      exception instanceof Error ? exception.message : 'Unknown error';
    const errorStack = exception instanceof Error ? exception.stack : undefined;

    this.logger.error(
      `[TRACE_ID: ${traceId}] Intercepted uncaught runtime crash on endpoint. ` +
        `Status: ${status} | Error: ${errorMessage}`,
      isHttpException ? undefined : errorStack,
    );

    const responseBody = {
      statusCode: status,
      error:
        status === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'An unexpected system error occurred within the core ledger engine'
          : errorMessage,
      traceId,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(responseBody);
  }
}

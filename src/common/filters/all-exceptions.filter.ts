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

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const traceId = crypto.randomUUID();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const isHttpException = exception instanceof HttpException;
    const errorMessage = isHttpException
      ? exception.message
      : (exception as Error).message;
    const errorStack = (exception as Error).stack;

    this.logger.error(
      `[TRACE_ID: ${traceId}] Intercepted uncaught runtime crash on endpoint. ` +
        `Status: ${status} | Error: ${errorMessage}`,
      isHttpException ? undefined : errorStack,
    );

    const responseBody = {
      statusCode: status,
      error:
        status === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'An unexpected system error occured within the core ledger engine'
          : errorMessage,
      traceId: traceId,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(responseBody);
  }
}

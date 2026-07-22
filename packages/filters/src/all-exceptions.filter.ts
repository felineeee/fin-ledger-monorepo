import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { NoResultError } from 'kysely';
import { randomUUID } from 'crypto';
import { ApiErrorResponse } from './interfaces/api-error-response.interface.js';

/**
 * Postgres SQLSTATE error codes we care about, mapped to HTTP status + a
 * stable machine-readable code. Full list: https://www.postgresql.org/docs/current/errcodes-appendix.html
 *
 * Kysely (with the pg dialect) does not wrap driver errors — a constraint
 * violation surfaces as the raw `pg` DatabaseError, which has a `.code`
 * property set to the Postgres SQLSTATE. We detect and map it here so a
 * duplicate SKU, for example, becomes a clean 409 instead of a raw 500
 * with a Postgres error message leaking to the client.
 */
const PG_ERROR_MAP: Record<
  string,
  { status: number; code: string; message: string }
> = {
  '23505': {
    status: HttpStatus.CONFLICT,
    code: 'UNIQUE_VIOLATION',
    message: 'A record with this value already exists.',
  },
  '23503': {
    status: HttpStatus.CONFLICT,
    code: 'FOREIGN_KEY_VIOLATION',
    message:
      'This action references a record that does not exist or cannot be modified.',
  },
  '23502': {
    status: HttpStatus.BAD_REQUEST,
    code: 'NOT_NULL_VIOLATION',
    message: 'A required field was missing.',
  },
  '22P02': {
    status: HttpStatus.BAD_REQUEST,
    code: 'INVALID_INPUT_SYNTAX',
    message: 'One or more fields had an invalid format (e.g. malformed UUID).',
  },
  '40001': {
    status: HttpStatus.CONFLICT,
    code: 'SERIALIZATION_FAILURE',
    message:
      'This request conflicted with a concurrent transaction. Please retry.',
  },
  '57014': {
    status: HttpStatus.GATEWAY_TIMEOUT,
    code: 'QUERY_CANCELED',
    message: 'The database took too long to respond.',
  },
};

/** Narrow, structural check — avoids importing pg's DatabaseError type directly. */
function isPostgresError(
  err: unknown,
): err is { code: string; message: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code: unknown }).code === 'string'
  );
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId =
      (request.headers['x-request-id'] as string) ?? randomUUID();

    const { status, code, message, details } = this.resolve(exception);

    // Log with full detail server-side; never send this level of detail to the client.
    this.logException(exception, request, requestId, status);

    const body: ApiErrorResponse = {
      success: false,
      error: { code, message, ...(details ? { details } : {}) },
      meta: {
        path: request.originalUrl ?? request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    response.status(status).setHeader('x-request-id', requestId).json(body);
  }

  private resolve(exception: unknown): {
    status: number;
    code: string;
    message: string;
    details?: unknown;
  } {
    // 1. NestJS HttpException (covers ValidationPipe failures, guards throwing
    //    ForbiddenException/NotFoundException/etc., and anything you throw yourself)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      // ValidationPipe errors arrive as { message: string[], error: string, statusCode: number }
      if (typeof res === 'object' && res !== null && 'message' in res) {
        const nestMessage = (res as { message: string | string[] }).message;
        return {
          status,
          code: this.codeForStatus(status),
          message: Array.isArray(nestMessage)
            ? 'Validation failed.'
            : nestMessage,
          details: Array.isArray(nestMessage) ? nestMessage : undefined,
        };
      }

      return {
        status,
        code: this.codeForStatus(status),
        message: typeof res === 'string' ? res : exception.message,
      };
    }

    // 2. Kysely's own "expected exactly one row" error (executeTakeFirstOrThrow)
    if (exception instanceof NoResultError) {
      return {
        status: HttpStatus.NOT_FOUND,
        code: 'NOT_FOUND',
        message: 'The requested resource was not found.',
      };
    }

    // 3. Raw Postgres driver errors surfaced through Kysely
    if (isPostgresError(exception)) {
      const mapped = PG_ERROR_MAP[exception.code];
      if (mapped) {
        return {
          status: mapped.status,
          code: mapped.code,
          message: mapped.message,
        };
      }
    }

    // 4. Anything else — unknown/unhandled. Never leak internals to the client.
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
    };
  }

  private codeForStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      default:
        return 'ERROR';
    }
  }

  private logException(
    exception: unknown,
    request: Request,
    requestId: string,
    status: number,
  ): void {
    const context = `${request.method} ${request.originalUrl ?? request.url} [${requestId}]`;

    // 5xx = something we need to actually look at; 4xx = expected client error, log quieter.
    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(`Unhandled error — ${context}`, stack);
    } else {
      const message =
        exception instanceof Error ? exception.message : 'Client error';
      this.logger.warn(`${message} — ${context}`);
    }
  }
}

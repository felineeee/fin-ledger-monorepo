"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const kysely_1 = require("kysely");
const crypto_1 = require("crypto");
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
const PG_ERROR_MAP = {
    '23505': {
        status: common_1.HttpStatus.CONFLICT,
        code: 'UNIQUE_VIOLATION',
        message: 'A record with this value already exists.',
    },
    '23503': {
        status: common_1.HttpStatus.CONFLICT,
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'This action references a record that does not exist or cannot be modified.',
    },
    '23502': {
        status: common_1.HttpStatus.BAD_REQUEST,
        code: 'NOT_NULL_VIOLATION',
        message: 'A required field was missing.',
    },
    '22P02': {
        status: common_1.HttpStatus.BAD_REQUEST,
        code: 'INVALID_INPUT_SYNTAX',
        message: 'One or more fields had an invalid format (e.g. malformed UUID).',
    },
    '40001': {
        status: common_1.HttpStatus.CONFLICT,
        code: 'SERIALIZATION_FAILURE',
        message: 'This request conflicted with a concurrent transaction. Please retry.',
    },
    '57014': {
        status: common_1.HttpStatus.GATEWAY_TIMEOUT,
        code: 'QUERY_CANCELED',
        message: 'The database took too long to respond.',
    },
};
/** Narrow, structural check — avoids importing pg's DatabaseError type directly. */
function isPostgresError(err) {
    return (typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        typeof err.code === 'string');
}
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    logger = new common_1.Logger(AllExceptionsFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const requestId = request.headers['x-request-id'] ?? (0, crypto_1.randomUUID)();
        const { status, code, message, details } = this.resolve(exception);
        // Log with full detail server-side; never send this level of detail to the client.
        this.logException(exception, request, requestId, status);
        const body = {
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
    resolve(exception) {
        // 1. NestJS HttpException (covers ValidationPipe failures, guards throwing
        //    ForbiddenException/NotFoundException/etc., and anything you throw yourself)
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const res = exception.getResponse();
            // ValidationPipe errors arrive as { message: string[], error: string, statusCode: number }
            if (typeof res === 'object' && res !== null && 'message' in res) {
                const nestMessage = res.message;
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
        if (exception instanceof kysely_1.NoResultError) {
            return {
                status: common_1.HttpStatus.NOT_FOUND,
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
            status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred. Please try again later.',
        };
    }
    codeForStatus(status) {
        switch (status) {
            case common_1.HttpStatus.BAD_REQUEST:
                return 'BAD_REQUEST';
            case common_1.HttpStatus.UNAUTHORIZED:
                return 'UNAUTHORIZED';
            case common_1.HttpStatus.FORBIDDEN:
                return 'FORBIDDEN';
            case common_1.HttpStatus.NOT_FOUND:
                return 'NOT_FOUND';
            case common_1.HttpStatus.CONFLICT:
                return 'CONFLICT';
            default:
                return 'ERROR';
        }
    }
    logException(exception, request, requestId, status) {
        const context = `${request.method} ${request.originalUrl ?? request.url} [${requestId}]`;
        // 5xx = something we need to actually look at; 4xx = expected client error, log quieter.
        if (status >= 500) {
            const stack = exception instanceof Error ? exception.stack : undefined;
            this.logger.error(`Unhandled error — ${context}`, stack);
        }
        else {
            const message = exception instanceof Error ? exception.message : 'Client error';
            this.logger.warn(`${message} — ${context}`);
        }
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);

/**
 * Standard error envelope returned by every endpoint in this service.
 * Keep this shape stable — clients (and other microservices) depend on it.
 */
export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta: {
        path: string;
        method: string;
        timestamp: string;
        requestId?: string;
    };
}

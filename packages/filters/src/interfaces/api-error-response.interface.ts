/**
 * Standard error envelope returned by every endpoint in this service.
 * Keep this shape stable — clients (and other microservices) depend on it.
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string; // machine-readable, e.g. "NOT_FOUND", "UNIQUE_VIOLATION"
    message: string; // human-readable, safe to show to a client
    details?: unknown; // optional extra context (validation errors, etc.)
  };
  meta: {
    path: string;
    method: string;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Application error model.
 *
 * `AppError` is a typed, HTTP-aware error we throw from services/repositories.
 * The API layer catches it and maps it to a consistent JSON response. Using a
 * single error type keeps error handling predictable across the app and avoids
 * leaking raw internal errors (and their stack traces) to clients.
 */
export type AppErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UPLOAD_FAILED"
  | "AI_PROCESSING_FAILED"
  | "CONFLICT"
  | "INTERNAL";

const STATUS_BY_CODE: Record<AppErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 422,
  NOT_FOUND: 404,
  UPLOAD_FAILED: 502,
  AI_PROCESSING_FAILED: 502,
  CONFLICT: 409,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  /** Optional structured details (e.g. Zod field errors) safe to send to client. */
  readonly details?: unknown;

  constructor(code: AppErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }

  static notFound(message = "Resource not found") {
    return new AppError("NOT_FOUND", message);
  }

  static badRequest(message = "Bad request", details?: unknown) {
    return new AppError("BAD_REQUEST", message, details);
  }
}

/** Type guard so the API layer can branch on AppError vs. unknown errors. */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

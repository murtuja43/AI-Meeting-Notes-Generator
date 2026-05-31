import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, isAppError } from "@/lib/errors";

/**
 * Standardized API response envelope.
 *
 * Every API route returns one shape:
 *   success: { success: true, data: T }
 *   failure: { success: false, error: { code, message, details? } }
 *
 * This consistency means the frontend can handle responses uniformly and we
 * never accidentally return a raw exception/stack trace to the client.
 */
export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = {
  success: false;
  error: { code: string; message: string; details?: unknown };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** Build a success JSON response. */
export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Translate any thrown value into a safe JSON error response.
 * Handles our AppError, Zod validation errors, and unknown errors separately so
 * clients get useful info while internal details stay on the server logs.
 */
export function fail(error: unknown): NextResponse<ApiFailure> {
  // Known, intentional application errors.
  if (isAppError(error)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status },
    );
  }

  // Zod validation failures -> 422 with field-level details.
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: error.flatten(),
        },
      },
      { status: 422 },
    );
  }

  // Anything else is unexpected: log server-side, return a generic 500.
  console.error("[api] Unhandled error:", error);
  const fallback = new AppError("INTERNAL", "Something went wrong");
  return NextResponse.json(
    { success: false, error: { code: fallback.code, message: fallback.message } },
    { status: fallback.status },
  );
}

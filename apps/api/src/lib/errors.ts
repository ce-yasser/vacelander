import type { ApiErrorBody, ApiErrorCode } from "@vaclendar/shared";

type Details = ApiErrorBody["error"]["details"];

/** An error that maps directly to an HTTP response. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: Details,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const notFound = (message: string) => new ApiError(404, "NOT_FOUND", message);
export const conflict = (message: string) => new ApiError(409, "CONFLICT", message);
export const badRequest = (message: string) => new ApiError(400, "BAD_REQUEST", message);
export const validationError = (message: string, details?: Details) =>
  new ApiError(400, "VALIDATION_ERROR", message, details);

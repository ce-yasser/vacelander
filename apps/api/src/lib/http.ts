import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import type { ApiErrorBody } from "@vaclendar/shared";
import { ApiError, badRequest, conflict, notFound, validationError } from "./errors";

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

function errorJson(error: ApiError) {
  const body: ApiErrorBody = {
    error: {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    },
  };
  return NextResponse.json(body, { status: error.status });
}

function fromZod(error: ZodError): ApiError {
  const details = error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
  return validationError(details[0]?.message ?? "Invalid request", details);
}

/** Known Prisma error codes, matched structurally so this file stays DB-agnostic. */
function fromPrisma(error: unknown): ApiError | undefined {
  const code = (error as { code?: unknown } | null)?.code;
  switch (code) {
    case "P2025":
      return notFound("The requested record was not found");
    case "P2002":
      return conflict("A record with these values already exists");
    case "P2003":
      return notFound("A related record was not found");
    case "P2034":
      return conflict("Someone else changed this data at the same time. Please try again.");
    default:
      return undefined;
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof ApiError) return errorJson(error);
  if (error instanceof ZodError) return errorJson(fromZod(error));
  const prismaError = fromPrisma(error);
  if (prismaError) return errorJson(prismaError);
  console.error(error);
  return errorJson(new ApiError(500, "INTERNAL_ERROR", "Something went wrong"));
}

/** Wraps a route handler so thrown errors become consistent JSON responses. */
export function handler<Args extends unknown[]>(fn: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

/** Parses and validates a JSON request body. */
export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw badRequest("Request body must be valid JSON");
  }
  return schema.parse(body);
}

/** Validates query-string params; repeated keys become arrays. */
export function parseQuery<T>(request: Request, schema: ZodType<T>): T {
  const params = new URL(request.url).searchParams;
  const raw: Record<string, string | string[]> = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    raw[key] = values.length > 1 ? values : values[0]!;
  }
  return schema.parse(raw);
}

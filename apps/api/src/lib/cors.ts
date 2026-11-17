const DEFAULT_ORIGIN = "http://localhost:3000";

export function allowedOrigins(): string[] {
  return (process.env.CORS_ORIGIN || DEFAULT_ORIGIN)
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

/** CORS headers for a request coming from `origin`. Empty if not allowed. */
export function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = { Vary: "Origin" };
  if (!origin) return headers;
  const origins = allowedOrigins();
  if (origins.includes("*") || origins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET,POST,PATCH,DELETE,OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return headers;
}

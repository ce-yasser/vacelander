import { afterEach, describe, expect, it, vi } from "vitest";
import { corsHeaders } from "./cors";

afterEach(() => vi.unstubAllEnvs());

describe("corsHeaders", () => {
  it("allows the configured web origin", () => {
    vi.stubEnv("CORS_ORIGIN", "http://localhost:3000, https://vaclendar.example.com/");
    expect(corsHeaders("https://vaclendar.example.com")["Access-Control-Allow-Origin"]).toBe(
      "https://vaclendar.example.com",
    );
  });

  it("does not allow other origins", () => {
    vi.stubEnv("CORS_ORIGIN", "http://localhost:3000");
    expect(corsHeaders("https://evil.example.com")).toEqual({ Vary: "Origin" });
  });

  it("defaults to http://localhost:3000", () => {
    vi.stubEnv("CORS_ORIGIN", "");
    expect(corsHeaders("http://localhost:3000")["Access-Control-Allow-Origin"]).toBe(
      "http://localhost:3000",
    );
  });
});

const BASE = "http://localhost:3001";

export function request(path: string, init?: { method?: string; body?: unknown }) {
  return new Request(`${BASE}${path}`, {
    method: init?.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

export const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

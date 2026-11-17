import type {
  ApiErrorBody,
  CreateMemberInput,
  CreateVacationInput,
  Member,
  UpdateMemberInput,
  UpdateVacationInput,
  VacationType,
  VacationWithMember,
} from "@vaclendar/shared";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(
  /\/$/,
  "",
);

/** An error returned by the API, carrying its `{ error: { code, message } }` body. */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: { path: string; message: string }[] = [],
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function request<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: init?.method ?? "GET",
      headers: init?.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiRequestError(
      0,
      "NETWORK_ERROR",
      `Can't reach the Vaclendar API at ${API_URL}. Is it running?`,
    );
  }

  if (response.status === 204) return undefined as T;

  const body = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const error = (body as Partial<ApiErrorBody> | null)?.error;
    throw new ApiRequestError(
      response.status,
      error?.code ?? "INTERNAL_ERROR",
      error?.message ?? `Request failed (${response.status})`,
      error?.details,
    );
  }
  return body as T;
}

export interface VacationParams {
  from?: string;
  to?: string;
  memberIds?: string[];
  types?: VacationType[];
}

export function vacationSearchParams({ from, to, memberIds, types }: VacationParams): string {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (memberIds?.length) params.set("memberId", memberIds.join(","));
  if (types?.length) params.set("type", types.join(","));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  listMembers: () => request<Member[]>("/api/members"),
  createMember: (body: CreateMemberInput) =>
    request<Member>("/api/members", { method: "POST", body }),
  updateMember: (id: string, body: UpdateMemberInput) =>
    request<Member>(`/api/members/${id}`, { method: "PATCH", body }),
  deleteMember: (id: string) => request<void>(`/api/members/${id}`, { method: "DELETE" }),

  listVacations: (params: VacationParams = {}) =>
    request<VacationWithMember[]>(`/api/vacations${vacationSearchParams(params)}`),
  createVacation: (body: CreateVacationInput) =>
    request<VacationWithMember>("/api/vacations", { method: "POST", body }),
  updateVacation: (id: string, body: UpdateVacationInput) =>
    request<VacationWithMember>(`/api/vacations/${id}`, { method: "PATCH", body }),
  deleteVacation: (id: string) => request<void>(`/api/vacations/${id}`, { method: "DELETE" }),
};

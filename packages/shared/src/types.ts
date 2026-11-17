import type { VacationType } from "./schemas";

/** A team member as returned by the API. */
export interface Member {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

/** A vacation as returned by the API. Dates are inclusive YYYY-MM-DD strings. */
export interface Vacation {
  id: string;
  memberId: string;
  startDate: string;
  endDate: string;
  type: VacationType;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VacationWithMember extends Vacation {
  member: Pick<Member, "id" | "name" | "color">;
}

export type ApiErrorCode =
  "VALIDATION_ERROR" | "NOT_FOUND" | "CONFLICT" | "BAD_REQUEST" | "INTERNAL_ERROR";

/** Shape of every error response body. */
export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: { path: string; message: string }[];
  };
}

import { beforeEach, describe, expect, it } from "vitest";
import { setRepo } from "@/lib/container";
import { createMemoryRepo } from "@/test/memory-repo";
import { ctx, request } from "@/test/helpers";
import * as collection from "./route";
import * as item from "./[id]/route";

let store: ReturnType<typeof createMemoryRepo>;
let ada: string;
let grace: string;

beforeEach(async () => {
  store = createMemoryRepo();
  setRepo(store.repo);
  ada = (await store.repo.createMember({ name: "Ada", color: "#2563eb" })).id;
  grace = (await store.repo.createMember({ name: "Grace", color: "#dc2626" })).id;
});

const create = (body: Record<string, unknown>) =>
  collection.POST(request("/api/vacations", { method: "POST", body }));

const vacation = (overrides: Record<string, unknown> = {}) => ({
  memberId: ada,
  startDate: "2025-07-01",
  endDate: "2025-07-05",
  type: "VACATION",
  ...overrides,
});

describe("POST /api/vacations", () => {
  it("creates a vacation and includes the member", async () => {
    const res = await create(vacation({ note: "Beach" }));
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({
      memberId: ada,
      startDate: "2025-07-01",
      endDate: "2025-07-05",
      type: "VACATION",
      note: "Beach",
      member: { id: ada, name: "Ada", color: "#2563eb" },
    });
  });

  it("stores an empty note as null", async () => {
    const res = await create(vacation({ note: "   " }));
    expect((await res.json()).note).toBeNull();
  });

  it("returns 400 when the end date is before the start date", async () => {
    const res = await create(vacation({ startDate: "2025-07-05", endDate: "2025-07-01" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("End date must be on or after the start date");
  });

  it("returns 404 for an unknown member", async () => {
    const res = await create(vacation({ memberId: "ghost" }));
    expect(res.status).toBe(404);
  });

  it("returns 409 when the member already has overlapping time off", async () => {
    await create(vacation());
    const res = await create(vacation({ startDate: "2025-07-05", endDate: "2025-07-08" }));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: {
        code: "CONFLICT",
        message:
          "Ada already has time off from Jul 1, 2025 to Jul 5, 2025, which overlaps these dates",
      },
    });
  });

  it("allows back-to-back vacations and overlaps between different members", async () => {
    await create(vacation());
    expect(
      (await create(vacation({ startDate: "2025-07-06", endDate: "2025-07-06" }))).status,
    ).toBe(201);
    expect((await create(vacation({ memberId: grace }))).status).toBe(201);
  });
});

describe("GET /api/vacations", () => {
  beforeEach(async () => {
    await create(vacation({ startDate: "2025-06-28", endDate: "2025-07-02" }));
    await create(vacation({ startDate: "2025-08-10", endDate: "2025-08-12", type: "SICK" }));
    await create(
      vacation({ memberId: grace, startDate: "2025-07-15", endDate: "2025-07-15", type: "OTHER" }),
    );
  });

  const list = async (qs = "") => {
    const res = await collection.GET(request(`/api/vacations${qs}`));
    expect(res.status).toBe(200);
    return (await res.json()) as { startDate: string; memberId: string; type: string }[];
  };

  it("lists everything without filters, sorted by start date", async () => {
    expect((await list()).map((v) => v.startDate)).toEqual([
      "2025-06-28",
      "2025-07-15",
      "2025-08-10",
    ]);
  });

  it("returns vacations that intersect the range", async () => {
    expect((await list("?from=2025-07-01&to=2025-07-31")).map((v) => v.startDate)).toEqual([
      "2025-06-28",
      "2025-07-15",
    ]);
  });

  it("filters by member and type", async () => {
    expect((await list(`?memberId=${grace}`)).map((v) => v.memberId)).toEqual([grace]);
    expect((await list("?type=SICK,OTHER")).map((v) => v.type)).toEqual(["OTHER", "SICK"]);
    expect(await list(`?memberId=${grace}&type=SICK`)).toEqual([]);
  });

  it("returns 400 for invalid query params", async () => {
    const res = await collection.GET(request("/api/vacations?from=yesterday"));
    expect(res.status).toBe(400);
    expect((await collection.GET(request("/api/vacations?type=NAP"))).status).toBe(400);
  });
});

describe("PATCH /api/vacations/:id", () => {
  const patch = (id: string, body: unknown) =>
    item.PATCH(request(`/api/vacations/${id}`, { method: "PATCH", body }), ctx(id));

  it("updates fields", async () => {
    const { id } = await (await create(vacation())).json();
    const res = await patch(id, { type: "SICK", endDate: "2025-07-03", note: "Flu" });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      id,
      type: "SICK",
      endDate: "2025-07-03",
      note: "Flu",
    });
  });

  it("does not treat the vacation itself as an overlap", async () => {
    const { id } = await (await create(vacation())).json();
    expect((await patch(id, { startDate: "2025-07-02" })).status).toBe(200);
  });

  it("checks date order against the stored dates", async () => {
    const { id } = await (await create(vacation())).json();
    const res = await patch(id, { endDate: "2025-06-30" });
    expect(res.status).toBe(400);
    expect((await res.json()).error.message).toBe("End date must be on or after the start date");
  });

  it("returns 409 when moved onto another of the member's vacations", async () => {
    await create(vacation());
    const { id } = await (
      await create(vacation({ startDate: "2025-07-10", endDate: "2025-07-12" }))
    ).json();
    expect((await patch(id, { startDate: "2025-07-04" })).status).toBe(409);
  });

  it("returns 409 when reassigned to a member who is already off", async () => {
    await create(vacation({ memberId: grace }));
    const { id } = await (await create(vacation())).json();
    expect((await patch(id, { memberId: grace })).status).toBe(409);
  });

  it("returns 404 for an unknown vacation", async () => {
    expect((await patch("nope", { type: "SICK" })).status).toBe(404);
  });
});

describe("DELETE /api/vacations/:id", () => {
  it("deletes a vacation", async () => {
    const { id } = await (await create(vacation())).json();
    const res = await item.DELETE(request(`/api/vacations/${id}`, { method: "DELETE" }), ctx(id));
    expect(res.status).toBe(204);
    expect(store.vacations.size).toBe(0);
  });

  it("returns 404 for an unknown vacation", async () => {
    const res = await item.DELETE(
      request("/api/vacations/nope", { method: "DELETE" }),
      ctx("nope"),
    );
    expect(res.status).toBe(404);
  });
});

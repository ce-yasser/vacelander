import { beforeEach, describe, expect, it } from "vitest";
import { MEMBER_COLOR_PALETTE } from "@vaclendar/shared";
import { setRepo } from "@/lib/container";
import { createMemoryRepo } from "@/test/memory-repo";
import { ctx, request } from "@/test/helpers";
import * as collection from "./route";
import * as item from "./[id]/route";
import * as vacations from "../vacations/route";

let store: ReturnType<typeof createMemoryRepo>;

beforeEach(() => {
  store = createMemoryRepo();
  setRepo(store.repo);
});

async function addMember(body: unknown) {
  return collection.POST(request("/api/members", { method: "POST", body }));
}

describe("POST /api/members", () => {
  it("creates a member with the given color", async () => {
    const res = await addMember({ name: "Ada", color: "#ABCDEF" });
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ name: "Ada", color: "#abcdef" });
  });

  it("assigns a distinct palette color when none is given", async () => {
    const first = await (await addMember({ name: "Ada" })).json();
    const second = await (await addMember({ name: "Grace" })).json();
    expect(first.color).toBe(MEMBER_COLOR_PALETTE[0]);
    expect(second.color).toBe(MEMBER_COLOR_PALETTE[1]);
  });

  it("returns 409 for a duplicate name (case-insensitive)", async () => {
    await addMember({ name: "Ada" });
    const res = await addMember({ name: "ada" });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: { code: "CONFLICT", message: 'A team member named "ada" already exists' },
    });
  });

  it("returns 400 for invalid input", async () => {
    const res = await addMember({ name: "", color: "blue" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toHaveLength(2);
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await collection.POST(
      new Request("http://localhost/api/members", { method: "POST", body: "{nope" }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("BAD_REQUEST");
  });
});

describe("GET /api/members", () => {
  it("lists members alphabetically", async () => {
    await addMember({ name: "Zed" });
    await addMember({ name: "Ada" });
    const res = await collection.GET();
    expect(res.status).toBe(200);
    expect((await res.json()).map((m: { name: string }) => m.name)).toEqual(["Ada", "Zed"]);
  });
});

describe("PATCH /api/members/:id", () => {
  it("renames and recolors a member", async () => {
    const { id } = await (await addMember({ name: "Ada" })).json();
    const res = await item.PATCH(
      request(`/api/members/${id}`, {
        method: "PATCH",
        body: { name: "Ada L.", color: "#000000" },
      }),
      ctx(id),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id, name: "Ada L.", color: "#000000" });
  });

  it("allows changing the case of the member's own name", async () => {
    const { id } = await (await addMember({ name: "ada" })).json();
    const res = await item.PATCH(
      request(`/api/members/${id}`, { method: "PATCH", body: { name: "Ada" } }),
      ctx(id),
    );
    expect(res.status).toBe(200);
  });

  it("returns 409 when renaming to another member's name", async () => {
    await addMember({ name: "Ada" });
    const { id } = await (await addMember({ name: "Grace" })).json();
    const res = await item.PATCH(
      request(`/api/members/${id}`, { method: "PATCH", body: { name: "Ada" } }),
      ctx(id),
    );
    expect(res.status).toBe(409);
  });

  it("returns 404 for an unknown member", async () => {
    const res = await item.PATCH(
      request("/api/members/nope", { method: "PATCH", body: { name: "X" } }),
      ctx("nope"),
    );
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("NOT_FOUND");
  });

  it("returns 400 for an empty update", async () => {
    const { id } = await (await addMember({ name: "Ada" })).json();
    const res = await item.PATCH(
      request(`/api/members/${id}`, { method: "PATCH", body: {} }),
      ctx(id),
    );
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/members/:id", () => {
  it("removes the member and cascades to their vacations", async () => {
    const { id } = await (await addMember({ name: "Ada" })).json();
    await vacations.POST(
      request("/api/vacations", {
        method: "POST",
        body: { memberId: id, startDate: "2025-07-01", endDate: "2025-07-02", type: "VACATION" },
      }),
    );
    expect(store.vacations.size).toBe(1);

    const res = await item.DELETE(request(`/api/members/${id}`, { method: "DELETE" }), ctx(id));
    expect(res.status).toBe(204);
    expect(store.members.size).toBe(0);
    expect(store.vacations.size).toBe(0);
  });

  it("returns 404 for an unknown member", async () => {
    const res = await item.DELETE(request("/api/members/nope", { method: "DELETE" }), ctx("nope"));
    expect(res.status).toBe(404);
  });
});

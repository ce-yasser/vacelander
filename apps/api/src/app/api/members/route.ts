import { createMemberSchema } from "@vaclendar/shared";
import { getRepo } from "@/lib/container";
import { handler, json, parseBody } from "@/lib/http";
import { createMember, listMembers } from "@/services/members";

export const dynamic = "force-dynamic";

/** GET /api/members: list team members, alphabetically. */
export const GET = handler(async () => json(await listMembers(getRepo())));

/** POST /api/members: add a member. A color is assigned when omitted. */
export const POST = handler(async (request: Request) => {
  const input = await parseBody(request, createMemberSchema);
  return json(await createMember(getRepo(), input), 201);
});

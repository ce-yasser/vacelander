import { updateMemberSchema } from "@vaclendar/shared";
import { getRepo } from "@/lib/container";
import { handler, json, noContent, parseBody } from "@/lib/http";
import { deleteMember, updateMember } from "@/services/members";

type Context = { params: Promise<{ id: string }> };

/** PATCH /api/members/:id: rename and/or recolor a member. */
export const PATCH = handler(async (request: Request, { params }: Context) => {
  const { id } = await params;
  const input = await parseBody(request, updateMemberSchema);
  return json(await updateMember(getRepo(), id, input));
});

/** DELETE /api/members/:id: remove a member and all their vacations. */
export const DELETE = handler(async (_request: Request, { params }: Context) => {
  const { id } = await params;
  await deleteMember(getRepo(), id);
  return noContent();
});

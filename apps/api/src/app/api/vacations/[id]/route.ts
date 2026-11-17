import { updateVacationSchema } from "@vaclendar/shared";
import { getRepo } from "@/lib/container";
import { handler, json, noContent, parseBody } from "@/lib/http";
import { deleteVacation, updateVacation } from "@/services/vacations";

type Context = { params: Promise<{ id: string }> };

/** PATCH /api/vacations/:id */
export const PATCH = handler(async (request: Request, { params }: Context) => {
  const { id } = await params;
  const input = await parseBody(request, updateVacationSchema);
  return json(await updateVacation(getRepo(), id, input));
});

/** DELETE /api/vacations/:id */
export const DELETE = handler(async (_request: Request, { params }: Context) => {
  const { id } = await params;
  await deleteVacation(getRepo(), id);
  return noContent();
});

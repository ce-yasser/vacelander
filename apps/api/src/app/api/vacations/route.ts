import { createVacationSchema, vacationQuerySchema } from "@vaclendar/shared";
import { getRepo } from "@/lib/container";
import { handler, json, parseBody, parseQuery } from "@/lib/http";
import { createVacation, listVacations } from "@/services/vacations";

export const dynamic = "force-dynamic";

/** GET /api/vacations?from=&to=&memberId=&type= */
export const GET = handler(async (request: Request) => {
  const query = parseQuery(request, vacationQuerySchema);
  return json(await listVacations(getRepo(), query));
});

/** POST /api/vacations */
export const POST = handler(async (request: Request) => {
  const input = await parseBody(request, createVacationSchema);
  return json(await createVacation(getRepo(), input), 201);
});

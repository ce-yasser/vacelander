import { z } from "zod";
import { isIsoDate } from "./dates";

export const VACATION_TYPES = ["VACATION", "SICK", "PUBLIC_HOLIDAY", "OTHER"] as const;
export const vacationTypeSchema = z.enum(VACATION_TYPES, {
  error: "Choose a vacation type",
});
export type VacationType = z.infer<typeof vacationTypeSchema>;

export const VACATION_TYPE_LABELS: Record<VacationType, string> = {
  VACATION: "Vacation",
  SICK: "Sick",
  PUBLIC_HOLIDAY: "Public Holiday",
  OTHER: "Other",
};

export const isoDateSchema = z
  .string({ error: "Date is required" })
  .min(1, "Date is required")
  .refine(isIsoDate, "Enter a valid date (YYYY-MM-DD)");

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value like #2563eb")
  .transform((c) => c.toLowerCase());

const noteSchema = z.string().trim().max(500, "Note must be 500 characters or fewer").nullish();

const vacationFields = {
  memberId: z.string({ error: "Choose a team member" }).min(1, "Choose a team member"),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  type: vacationTypeSchema,
  note: noteSchema,
};

export const END_BEFORE_START_MESSAGE = "End date must be on or after the start date";

export const createVacationSchema = z
  .object(vacationFields)
  .refine((v) => v.endDate >= v.startDate, {
    message: END_BEFORE_START_MESSAGE,
    path: ["endDate"],
  });
export type CreateVacationInput = z.infer<typeof createVacationSchema>;

/** PATCH body: any subset of fields. Date order is re-checked against the stored row. */
export const updateVacationSchema = z
  .object(vacationFields)
  .partial()
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    message: END_BEFORE_START_MESSAGE,
    path: ["endDate"],
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update" });
export type UpdateVacationInput = z.infer<typeof updateVacationSchema>;

const csv = <T extends z.ZodType<unknown, string>>(item: T) =>
  z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) =>
      (Array.isArray(v) ? v : v ? [v] : [])
        .flatMap((s) => s.split(","))
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .pipe(z.array(item));

export const vacationQuerySchema = z
  .object({
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
    memberId: csv(z.string().min(1)),
    type: csv(vacationTypeSchema),
  })
  .refine((q) => !q.from || !q.to || q.to >= q.from, {
    message: "`to` must be on or after `from`",
    path: ["to"],
  });
export type VacationQuery = z.infer<typeof vacationQuerySchema>;

const memberName = z
  .string({ error: "Name is required" })
  .trim()
  .min(1, "Name is required")
  .max(50, "Name must be 50 characters or fewer");

export const createMemberSchema = z.object({
  name: memberName,
  color: hexColorSchema.optional(),
});
export type CreateMemberInput = z.infer<typeof createMemberSchema>;

export const updateMemberSchema = z
  .object({
    name: memberName.optional(),
    color: hexColorSchema.optional(),
  })
  .refine((v) => v.name !== undefined || v.color !== undefined, {
    message: "Provide a name or a color to update",
  });
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertCircleIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import type { z } from "zod";
import {
  createVacationSchema,
  inclusiveDayCount,
  isIsoDate,
  VACATION_TYPES,
  VACATION_TYPE_LABELS,
  type CreateVacationInput,
  type Member,
  type VacationWithMember,
} from "@vaclendar/shared";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  NativeSelect,
  Textarea,
} from "@vaclendar/ui";
import { ApiRequestError } from "@/lib/api";
import { useCreateVacation, useDeleteVacation, useUpdateVacation } from "@/lib/queries";

export type VacationDialogState =
  | { mode: "create"; key: number; startDate: string; endDate: string }
  | { mode: "edit"; key: number; vacation: VacationWithMember };

interface VacationDialogProps {
  state: VacationDialogState | null;
  members: Member[];
  onClose: () => void;
}

export function VacationDialog({ state, members, onClose }: VacationDialogProps) {
  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {state ? (
          <VacationForm key={state.key} state={state} members={members} onDone={onClose} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type FormValues = z.input<typeof createVacationSchema>;
const FIELDS: FieldPath<FormValues>[] = ["memberId", "startDate", "endDate", "type", "note"];

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  ) : null;
}

function VacationForm({
  state,
  members,
  onDone,
}: {
  state: VacationDialogState;
  members: Member[];
  onDone: () => void;
}) {
  const editing = state.mode === "edit" ? state.vacation : null;
  const createMutation = useCreateVacation();
  const updateMutation = useUpdateVacation();
  const deleteMutation = useDeleteVacation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const form = useForm<FormValues, unknown, CreateVacationInput>({
    resolver: zodResolver(createVacationSchema),
    defaultValues: editing
      ? {
          memberId: editing.memberId,
          startDate: editing.startDate,
          endDate: editing.endDate,
          type: editing.type,
          note: editing.note ?? "",
        }
      : {
          memberId: members.length === 1 ? members[0]!.id : "",
          startDate: state.mode === "create" ? state.startDate : "",
          endDate: state.mode === "create" ? state.endDate : "",
          type: "VACATION",
          note: "",
        },
  });
  const { errors, isSubmitting } = form.formState;
  const [startDate, endDate] = useWatch({ control: form.control, name: ["startDate", "endDate"] });
  const dayCount =
    isIsoDate(startDate) && isIsoDate(endDate) && endDate >= startDate
      ? inclusiveDayCount(startDate, endDate)
      : null;

  const showApiError = (error: unknown) => {
    if (error instanceof ApiRequestError) {
      for (const detail of error.details) {
        const field = FIELDS.find((f) => f === detail.path);
        if (field) form.setError(field, { message: detail.message });
      }
      form.setError("root", { message: error.message });
    } else {
      form.setError("root", { message: "Something went wrong. Please try again." });
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const input = { ...values, note: values.note || null };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input });
        toast.success("Vacation updated");
      } else {
        await createMutation.mutateAsync(input);
        toast.success("Vacation added");
      }
      onDone();
    } catch (error) {
      showApiError(error);
    }
  });

  const onDelete = async () => {
    if (!editing) return;
    try {
      await deleteMutation.mutateAsync(editing.id);
      toast.success("Vacation deleted");
      onDone();
    } catch (error) {
      setConfirmOpen(false);
      showApiError(error);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{editing ? "Edit vacation" : "Add vacation"}</DialogTitle>
        <DialogDescription>
          {editing
            ? `Time off for ${editing.member.name}.`
            : "Pick a team member, the days they're off and the type."}
        </DialogDescription>
      </DialogHeader>

      {errors.root?.message ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{errors.root.message}</span>
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="memberId">Team member</Label>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            There are no team members yet.{" "}
            <Link href="/team" className="text-primary underline-offset-4 hover:underline">
              Add one on the Team page
            </Link>
            .
          </p>
        ) : (
          <NativeSelect
            id="memberId"
            aria-invalid={!!errors.memberId}
            {...form.register("memberId")}
          >
            <option value="" disabled>
              Choose a team member…
            </option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </NativeSelect>
        )}
        <FieldError message={errors.memberId?.message} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input
            id="startDate"
            type="date"
            aria-invalid={!!errors.startDate}
            {...form.register("startDate", {
              onChange: (e: { target: { value: string } }) => {
                // Keep the range valid when the start moves past the end.
                const end = form.getValues("endDate");
                if (!end || end < e.target.value) form.setValue("endDate", e.target.value);
              },
            })}
          />
          <FieldError message={errors.startDate?.message} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="endDate">End date</Label>
          <Input
            id="endDate"
            type="date"
            min={startDate || undefined}
            aria-invalid={!!errors.endDate}
            {...form.register("endDate")}
          />
          <FieldError message={errors.endDate?.message} />
        </div>
      </div>
      {dayCount ? (
        <p className="-mt-2 text-sm text-muted-foreground">
          {dayCount} {dayCount === 1 ? "day" : "days"}, inclusive
        </p>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="type">Type</Label>
        <NativeSelect id="type" aria-invalid={!!errors.type} {...form.register("type")}>
          {VACATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {VACATION_TYPE_LABELS[type]}
            </option>
          ))}
        </NativeSelect>
        <FieldError message={errors.type?.message} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="note">
          Note <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea id="note" rows={3} maxLength={500} {...form.register("note")} />
        <FieldError message={errors.note?.message} />
      </div>

      <DialogFooter className="sm:justify-between">
        {editing ? (
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
              >
                <Trash2Icon />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this vacation?</AlertDialogTitle>
                <AlertDialogDescription>
                  {editing.member.name}&apos;s time off from {editing.startDate} to{" "}
                  {editing.endDate} will be removed. This can&apos;t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleteMutation.isPending}
                  onClick={(e) => {
                    e.preventDefault();
                    void onDelete();
                  }}
                >
                  {deleteMutation.isPending ? <Loader2Icon className="animate-spin" /> : null}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <span className="hidden sm:block" />
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || members.length === 0}>
            {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
            {editing ? "Save changes" : "Add vacation"}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

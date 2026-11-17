"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2Icon, PencilIcon, Trash2Icon } from "lucide-react";
import type { z } from "zod";
import { updateMemberSchema, type Member, type UpdateMemberInput } from "@vaclendar/shared";
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
  Input,
  Label,
} from "@vaclendar/ui";
import { api, ApiRequestError } from "@/lib/api";
import { queryKeys, useDeleteMember, useUpdateMember } from "@/lib/queries";
import { ColorPicker } from "./color-picker";

type FormValues = z.input<typeof updateMemberSchema>;

export function MemberRow({ member }: { member: Member }) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="py-3">
      {editing ? (
        <EditMember member={member} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex items-center gap-3">
          <span
            className="size-4 shrink-0 rounded-full"
            style={{ backgroundColor: member.color }}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate font-medium">{member.name}</span>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <PencilIcon />
            <span className="sr-only sm:not-sr-only">Edit</span>
          </Button>
          <RemoveMember member={member} />
        </div>
      )}
    </li>
  );
}

function EditMember({ member, onDone }: { member: Member; onDone: () => void }) {
  const updateMember = useUpdateMember();
  const form = useForm<FormValues, unknown, UpdateMemberInput>({
    resolver: zodResolver(updateMemberSchema),
    defaultValues: { name: member.name, color: member.color },
  });
  const { errors, isSubmitting } = form.formState;
  const nameId = `member-name-${member.id}`;

  const onSubmit = form.handleSubmit(async (values) => {
    const changes: UpdateMemberInput = {};
    if (values.name !== member.name) changes.name = values.name;
    if (values.color !== member.color) changes.color = values.color;
    if (!changes.name && !changes.color) return onDone();
    try {
      await updateMember.mutateAsync({ id: member.id, input: changes });
      toast.success("Member updated");
      onDone();
    } catch (error) {
      form.setError("name", {
        message: error instanceof ApiRequestError ? error.message : "Could not save the changes",
      });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-3 rounded-lg bg-muted/50 p-3">
      <div className="grid gap-2">
        <Label htmlFor={nameId}>Name</Label>
        <Input id={nameId} autoFocus aria-invalid={!!errors.name} {...form.register("name")} />
        {errors.name?.message ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <span className="text-sm font-medium">Color</span>
        <Controller
          control={form.control}
          name="color"
          render={({ field }) => (
            <ColorPicker
              idPrefix={`member-${member.id}`}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
          Save
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function RemoveMember({ member }: { member: Member }) {
  const [open, setOpen] = useState(false);
  const deleteMember = useDeleteMember();
  // Count their vacations only when the confirmation is shown.
  const vacationsQuery = useQuery({
    queryKey: [...queryKeys.vacations, "member", member.id],
    queryFn: () => api.listVacations({ memberIds: [member.id] }),
    enabled: open,
  });
  const count = vacationsQuery.data?.length;

  const onConfirm = async () => {
    try {
      await deleteMember.mutateAsync(member.id);
      toast.success(`${member.name} was removed`);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Could not remove the member");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2Icon />
          <span className="sr-only sm:not-sr-only">Remove</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {member.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This also deletes{" "}
            <strong className="text-foreground">
              {count === undefined
                ? "all of their vacations"
                : `${count} ${count === 1 ? "vacation" : "vacations"}`}
            </strong>{" "}
            from the calendar. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteMember.isPending}
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
          >
            {deleteMember.isPending ? <Loader2Icon className="animate-spin" /> : null}
            Remove member
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

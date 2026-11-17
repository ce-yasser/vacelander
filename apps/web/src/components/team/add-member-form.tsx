"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2Icon, PlusIcon } from "lucide-react";
import type { z } from "zod";
import { createMemberSchema, type CreateMemberInput } from "@vaclendar/shared";
import { Button, Input, Label } from "@vaclendar/ui";
import { ApiRequestError } from "@/lib/api";
import { useCreateMember } from "@/lib/queries";
import { ColorPicker } from "./color-picker";

type FormValues = z.input<typeof createMemberSchema>;

export function AddMemberForm() {
  const createMember = useCreateMember();
  const form = useForm<FormValues, unknown, CreateMemberInput>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: { name: "", color: undefined },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const member = await createMember.mutateAsync(values);
      toast.success(`${member.name} joined the team`);
      form.reset({ name: "", color: undefined });
    } catch (error) {
      form.setError("name", {
        message: error instanceof ApiRequestError ? error.message : "Could not add the member",
      });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="new-member-name">Name</Label>
        <Input
          id="new-member-name"
          placeholder="e.g. Jordan Lee"
          autoComplete="off"
          aria-invalid={!!errors.name}
          {...form.register("name")}
        />
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
              idPrefix="new-member"
              allowAuto
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {errors.color?.message ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.color.message}
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={isSubmitting} className="justify-self-start">
        {isSubmitting ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
        Add member
      </Button>
    </form>
  );
}

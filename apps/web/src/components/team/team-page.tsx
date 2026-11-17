"use client";

import { Loader2Icon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vaclendar/ui";
import { ErrorState } from "@/components/error-state";
import { useMembers } from "@/lib/queries";
import { AddMemberForm } from "./add-member-form";
import { MemberRow } from "./member-row";

export function TeamPage() {
  const { data: members, error, isPending, refetch } = useMembers();

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground">
          Everyone who can appear on the calendar. Each person keeps their own color.
        </p>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Members{members ? ` (${members.length})` : ""}</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <ErrorState message={error.message} onRetry={() => void refetch()} />
            ) : isPending ? (
              <div className="flex justify-center py-8 text-muted-foreground">
                <Loader2Icon className="size-5 animate-spin" />
              </div>
            ) : members.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No team members yet. Add the first one.
              </p>
            ) : (
              <ul className="divide-y">
                {members.map((member) => (
                  <MemberRow key={member.id} member={member} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add a member</CardTitle>
            <CardDescription>Leave the color on Auto to get a distinct one.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddMemberForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

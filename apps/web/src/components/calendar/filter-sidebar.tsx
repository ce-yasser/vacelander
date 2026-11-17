"use client";

import Link from "next/link";
import { Button, Checkbox, Label } from "@vaclendar/ui";
import {
  VACATION_TYPES,
  VACATION_TYPE_LABELS,
  type Member,
  type VacationType,
} from "@vaclendar/shared";

interface FilterSidebarProps {
  members: Member[];
  hiddenMemberIds: string[];
  hiddenTypes: VacationType[];
  onHiddenMemberIdsChange: (ids: string[]) => void;
  onHiddenTypesChange: (types: VacationType[]) => void;
}

function toggle<T>(list: T[], value: T, visible: boolean): T[] {
  return visible ? list.filter((v) => v !== value) : [...list, value];
}

export function FilterSidebar({
  members,
  hiddenMemberIds,
  hiddenTypes,
  onHiddenMemberIdsChange,
  onHiddenTypesChange,
}: FilterSidebarProps) {
  return (
    <div className="space-y-6">
      <section aria-labelledby="filter-members">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="filter-members" className="text-sm font-semibold">
            Team members
          </h2>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onHiddenMemberIdsChange([])}
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onHiddenMemberIdsChange(members.map((m) => m.id))}
            >
              None
            </Button>
          </div>
        </div>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No team members yet.{" "}
            <Link href="/team" className="text-primary underline-offset-4 hover:underline">
              Add some
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-1">
            {members.map((member) => {
              const id = `member-${member.id}`;
              const visible = !hiddenMemberIds.includes(member.id);
              return (
                <li key={member.id}>
                  <Label
                    htmlFor={id}
                    className="cursor-pointer rounded-md px-2 py-1.5 font-normal hover:bg-accent"
                  >
                    <Checkbox
                      id={id}
                      checked={visible}
                      onCheckedChange={(checked) =>
                        onHiddenMemberIdsChange(
                          toggle(hiddenMemberIds, member.id, checked === true),
                        )
                      }
                    />
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: member.color }}
                      aria-hidden
                    />
                    <span className="truncate">{member.name}</span>
                  </Label>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="filter-types">
        <h2 id="filter-types" className="mb-2 text-sm font-semibold">
          Type
        </h2>
        <ul className="space-y-1">
          {VACATION_TYPES.map((type) => {
            const id = `type-${type}`;
            return (
              <li key={type}>
                <Label
                  htmlFor={id}
                  className="cursor-pointer rounded-md px-2 py-1.5 font-normal hover:bg-accent"
                >
                  <Checkbox
                    id={id}
                    checked={!hiddenTypes.includes(type)}
                    onCheckedChange={(checked) =>
                      onHiddenTypesChange(toggle(hiddenTypes, type, checked === true))
                    }
                  />
                  {VACATION_TYPE_LABELS[type]}
                </Label>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

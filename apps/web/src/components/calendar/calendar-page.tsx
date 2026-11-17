"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import { FilterIcon, Loader2Icon, PlusIcon } from "lucide-react";
import {
  todayLocal,
  VACATION_TYPES,
  type VacationType,
  type VacationWithMember,
} from "@vaclendar/shared";
import { Button, Card, CardContent, cn } from "@vaclendar/ui";
import { ErrorState } from "@/components/error-state";
import { useMembers, useVacations } from "@/lib/queries";
import { FilterSidebar } from "./filter-sidebar";
import type { VisibleRange } from "./team-calendar";
import { VacationDialog, type VacationDialogState } from "./vacation-dialog";

// FullCalendar measures the DOM, so render it on the client only.
const TeamCalendar = dynamic(() => import("./team-calendar"), {
  ssr: false,
  loading: () => <CalendarSkeleton />,
});

function CalendarSkeleton() {
  return (
    <div className="flex h-[32rem] items-center justify-center text-muted-foreground">
      <Loader2Icon className="size-5 animate-spin" />
    </div>
  );
}

const EMPTY: VacationWithMember[] = [];

export function CalendarPage() {
  const [range, setRange] = useState<VisibleRange | null>(null);
  const [hiddenMemberIds, setHiddenMemberIds] = useState<string[]>([]);
  const [hiddenTypes, setHiddenTypes] = useState<VacationType[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dialog, setDialog] = useState<VacationDialogState | null>(null);
  const dialogKey = useRef(0);

  const membersQuery = useMembers();
  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);

  // Only send filters when something is actually hidden.
  const visibleMemberIds = members.map((m) => m.id).filter((id) => !hiddenMemberIds.includes(id));
  const visibleTypes = VACATION_TYPES.filter((t) => !hiddenTypes.includes(t));
  const memberFilter = hiddenMemberIds.length ? visibleMemberIds : undefined;
  const typeFilter = hiddenTypes.length ? visibleTypes : undefined;
  const nothingVisible = memberFilter?.length === 0 || typeFilter?.length === 0;

  const vacationsQuery = useVacations(
    { from: range?.from, to: range?.to, memberIds: memberFilter, types: typeFilter },
    range !== null && !nothingVisible,
  );
  const vacations = nothingVisible ? EMPTY : (vacationsQuery.data ?? EMPTY);
  const activeFilterCount = hiddenMemberIds.length + hiddenTypes.length;

  const openCreate = (startDate = todayLocal(), endDate = startDate) =>
    setDialog({ mode: "create", key: ++dialogKey.current, startDate, endDate });
  const openEdit = (vacation: VacationWithMember) =>
    setDialog({ mode: "edit", key: ++dialogKey.current, vacation });

  const error = membersQuery.error ?? vacationsQuery.error;

  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
      <div className="flex items-center justify-between gap-2 lg:col-span-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team calendar</h1>
          <p className="text-sm text-muted-foreground">
            Click or drag across days to add time off. Click an entry to edit it.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            className="lg:hidden"
            aria-expanded={filtersOpen}
            aria-controls="calendar-filters"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <FilterIcon />
            <span className="sr-only sm:not-sr-only">Filters</span>
            {activeFilterCount ? (
              <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
          <Button onClick={() => openCreate()}>
            <PlusIcon />
            <span>
              Add <span className="hidden sm:inline">vacation</span>
            </span>
          </Button>
        </div>
      </div>

      <aside id="calendar-filters" className={cn("lg:block", filtersOpen ? "block" : "hidden")}>
        <Card className="py-4 lg:sticky lg:top-20">
          <CardContent className="px-4">
            <FilterSidebar
              members={members}
              hiddenMemberIds={hiddenMemberIds}
              hiddenTypes={hiddenTypes}
              onHiddenMemberIdsChange={setHiddenMemberIds}
              onHiddenTypesChange={setHiddenTypes}
            />
          </CardContent>
        </Card>
      </aside>

      <section aria-label="Calendar" className="min-w-0 space-y-4">
        {error ? (
          <ErrorState
            message={error.message}
            onRetry={() => {
              void membersQuery.refetch();
              void vacationsQuery.refetch();
            }}
          />
        ) : null}
        <Card className="relative p-3 sm:p-4">
          {vacationsQuery.isFetching ? (
            <Loader2Icon
              className="absolute top-4 right-4 size-4 animate-spin text-muted-foreground sm:hidden"
              aria-label="Loading"
            />
          ) : null}
          <TeamCalendar
            vacations={vacations}
            onRangeChange={setRange}
            onSelectRange={({ startDate, endDate }) => openCreate(startDate, endDate)}
            onVacationClick={openEdit}
          />
        </Card>
      </section>

      <VacationDialog state={dialog} members={members} onClose={() => setDialog(null)} />
    </div>
  );
}

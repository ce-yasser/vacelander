"use client";

import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type {
  DateSelectArg,
  DatesSetArg,
  DayCellContentArg,
  EventClickArg,
  EventMountArg,
} from "@fullcalendar/core";
import { VACATION_TYPE_LABELS, type VacationWithMember } from "@vaclendar/shared";
import { localIsoDate, peopleOffByDay, selectionToRange, toCalendarEvent } from "@/lib/calendar";

export interface VisibleRange {
  from: string;
  to: string;
}

interface TeamCalendarProps {
  vacations: VacationWithMember[];
  onRangeChange: (range: VisibleRange) => void;
  onSelectRange: (range: { startDate: string; endDate: string }) => void;
  onVacationClick: (vacation: VacationWithMember) => void;
}

export default function TeamCalendar({
  vacations,
  onRangeChange,
  onSelectRange,
  onVacationClick,
}: TeamCalendarProps) {
  const [initialView] = useState(() =>
    window.matchMedia("(max-width: 640px)").matches ? "listMonth" : "dayGridMonth",
  );
  const events = useMemo(() => vacations.map(toCalendarEvent), [vacations]);
  const offByDay = useMemo(() => peopleOffByDay(vacations), [vacations]);

  const renderDayCell = (arg: DayCellContentArg) => {
    const names = offByDay.get(localIsoDate(arg.date)) ?? [];
    return (
      <div className="flex w-full items-center justify-between gap-1">
        {names.length > 1 ? (
          <span
            className="rounded-full bg-foreground/85 px-1.5 py-px text-[0.6875rem] leading-4 font-semibold text-background"
            title={`${names.length} people off: ${names.join(", ")}`}
            aria-label={`${names.length} people off`}
          >
            {names.length} off
          </span>
        ) : (
          <span />
        )}
        <span>{arg.dayNumberText}</span>
      </div>
    );
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
      initialView={initialView}
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,dayGridWeek,listMonth",
      }}
      buttonText={{ today: "Today", month: "Month", week: "Week", list: "List" }}
      height="auto"
      firstDay={1}
      fixedWeekCount={false}
      dayMaxEventRows={4}
      events={events}
      eventDisplay="block"
      noEventsText="No time off in this period"
      selectable
      selectMirror
      selectLongPressDelay={250}
      dayCellContent={renderDayCell}
      datesSet={(arg: DatesSetArg) => {
        const { startDate, endDate } = selectionToRange(arg.startStr, arg.endStr);
        onRangeChange({ from: startDate, to: endDate });
      }}
      select={(arg: DateSelectArg) => {
        arg.view.calendar.unselect();
        onSelectRange(selectionToRange(arg.startStr, arg.endStr));
      }}
      eventClick={(arg: EventClickArg) => {
        arg.jsEvent.preventDefault();
        onVacationClick(arg.event.extendedProps.vacation as VacationWithMember);
      }}
      eventDidMount={(arg: EventMountArg) => {
        const vacation = arg.event.extendedProps.vacation as VacationWithMember;
        const range =
          vacation.startDate === vacation.endDate
            ? vacation.startDate
            : `${vacation.startDate} → ${vacation.endDate}`;
        arg.el.title = [
          `${vacation.member.name}: ${VACATION_TYPE_LABELS[vacation.type]}`,
          range,
          vacation.note,
        ]
          .filter(Boolean)
          .join("\n");
      }}
    />
  );
}

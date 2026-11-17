# Build Vaclendar: a Team Vacation Calendar (Next.js Monorepo)

> **Vaclendar** (pronounced "VAY-klendar") = vacation + calendar.

## Goal
Build Vaclendar, a simple web app where anyone on the team can add vacations
to a shared calendar and see everyone's vacations at a glance. There is NO
authentication: no login, no registration, no sessions, no passwords. Opening
the app goes straight to the calendar.

## User stories
1. As a user, I can add a vacation by choosing a team member from a dropdown,
   picking a start date and an end date, choosing a type (Vacation, Sick,
   Public Holiday, Other) and adding an optional note.
2. As a user, I can add a vacation by clicking or dragging across days on the
   calendar. This opens the add form with the dates pre-filled.
3. As a user, I can see all team vacations on a shared calendar, with month,
   week and list views.
4. As a user, I can tell people apart at a glance: each team member has a
   consistent color and their name shows on the event.
5. As a user, I can filter the calendar by team member and by vacation type.
6. As a user, I can click any vacation to view, edit or delete it.
7. As a user, I can see when several people are off on the same day (for
   example, a count badge on that day).
8. As a user, I can manage the team list (add a member with a name and color,
   rename a member, remove a member) on a simple Team page.

## Branding
- App name: **Vaclendar**, shown in the header, the browser tab title and the README.
- Package scope: `@vaclendar/*`.

## Tech stack & monorepo structure
- Package manager: npm workspaces. The root package.json declares
  `"workspaces": ["apps/*", "packages/*"]` and sets the `packageManager` field
  (required by Turborepo). Internal packages are referenced by name with
  version `"*"` (e.g. `"@vaclendar/shared": "*"`). Do not use the
  `workspace:*` protocol, because npm doesn't support it. Commit
  `package-lock.json`.
- Monorepo tool: Turborepo
- Language: TypeScript everywhere (strict mode)
- Latest stable Next.js with the App Router for both apps

```
vaclendar/
├── apps/
│   ├── web/        # @vaclendar/web: Next.js frontend (UI, calendar, forms), port 3000
│   └── api/        # @vaclendar/api: Next.js backend (Route Handlers only, REST API), port 3001
├── packages/
│   ├── db/         # @vaclendar/db: Prisma schema, client, migrations, seed script
│   ├── shared/     # @vaclendar/shared: Zod schemas + shared TypeScript types
│   ├── ui/         # @vaclendar/ui: shared React components (shadcn/ui-based)
│   └── config/     # @vaclendar/config: shared tsconfig, eslint, prettier
├── docker-compose.yml   # PostgreSQL for local dev (database name: vaclendar)
├── turbo.json
└── package.json         # root: npm workspaces + Turbo scripts
```

### Frontend (apps/web)
- Tailwind CSS + shadcn/ui
- FullCalendar (@fullcalendar/react) for month, week and list views
- TanStack Query for data fetching and cache invalidation
- React Hook Form + Zod (schemas imported from @vaclendar/shared)
- Pages:
  - `/`: the team calendar (main page), with a filter sidebar
  - `/team`: a list of team members with add, rename, change color and remove
- An "Add vacation" button that opens a modal/dialog. Selecting a date range
  on the calendar pre-fills it.
- Clicking an event opens the same dialog in edit mode, with a Delete button
  and a confirmation step.
- Responsive layout that works on mobile.

### Backend (apps/api)
- Next.js Route Handlers only (no UI)
- PostgreSQL + Prisma (from @vaclendar/db)
- Validate every request body with the shared Zod schemas
- No auth middleware. Configure CORS to allow the web app's origin
  (from an env variable).
- REST endpoints:
  - `GET    /api/vacations?from=&to=&memberId=&type=`: list vacations in a
    date range, including the member's name and color
  - `POST   /api/vacations`: create
  - `PATCH  /api/vacations/:id`: update
  - `DELETE /api/vacations/:id`: delete
  - `GET    /api/members`: list team members
  - `POST   /api/members`: add a member
  - `PATCH  /api/members/:id`: update a member's name or color
  - `DELETE /api/members/:id`: remove a member and their vacations
    (cascade delete; the UI warns before confirming)
- Return consistent JSON errors: `{ error: { code, message } }`, with proper
  HTTP status codes (400 validation, 404 not found, 409 conflict).

## Data model (Prisma)
- **Member**: id, name (unique), color (hex), createdAt
- **Vacation**: id, memberId (FK → Member, cascade on delete), startDate (date),
  endDate (date), type (enum: VACATION | SICK | PUBLIC_HOLIDAY | OTHER),
  note (optional), createdAt, updatedAt
- Index on (startDate, endDate) for range queries.

## Business rules
- endDate must be on or after startDate.
- Dates are whole days, inclusive. Store them as dates without time, so
  timezones can't shift them.
- A member cannot have two overlapping vacations. Return 409 with a clear
  message.
- When a member is added without a color, assign one automatically from a
  palette of distinct colors.

## Developer experience
- `npm install && docker compose up -d && npm run db:migrate && npm run db:seed && npm run dev`
  starts everything. `npm run dev` runs web and api in parallel through Turbo.
- The seed script creates 5 demo members and about 15 sample vacations across
  the current and next month.
- A `.env.example` in each app, listing every required variable.
- Root scripts (run with `npm run <name>`): `dev`, `build`, `lint`, `typecheck`,
  `test`, `db:migrate`, `db:seed`.
- Tests: Vitest unit tests for validation and overlap logic, and API tests for
  the vacation and member endpoints.
- A README titled "Vaclendar" with the pronunciation note, setup steps, the
  architecture overview and the API reference.

## Acceptance criteria
- [ ] Opening http://localhost:3000 shows the Vaclendar team calendar right
      away, with no login screen.
- [ ] I can add a vacation through the form and by selecting days on the
      calendar, and it appears right away without a page reload.
- [ ] I can edit and delete any vacation.
- [ ] I can add, rename, recolor and remove team members, and the calendar
      reflects the changes.
- [ ] Filtering by member and by type updates the calendar.
- [ ] Invalid input (end before start, overlapping dates) shows a clear error message.
- [ ] `npm run build`, `npm run lint`, `npm run typecheck` and `npm test` all pass.

## How to work
1. Scaffold the monorepo and shared config first, then the db package, then the
   api, then the web app.
2. After each step, run the build and fix errors before moving on.
3. Don't add authentication or any features beyond this spec.

# Vaclendar

> **Vaclendar** (pronounced "VAY-klendar") = vacation + calendar.

Vaclendar is a shared team vacation calendar. Anyone on the team can add time off and see
everyone's vacations at a glance. There is no login: opening the app goes straight to the
calendar.

- Month, week and list views, with one consistent color per team member
- Add time off from a form, or by clicking or dragging across days on the calendar
- Click any entry to edit or delete it
- Filter by team member and by type (Vacation, Sick, Public Holiday, Other)
- A "N off" badge on days when several people are away
- A Team page to add, rename, recolor and remove members

## Quick start

Requirements: Node.js 20.9+ (22 recommended), npm 10+, and Docker.

```bash
npm install && docker compose up -d && npm run db:migrate && npm run db:seed && npm run dev
```

- Web app: http://localhost:3000
- API: http://localhost:3001/api

The seed creates 5 demo members and 15 vacations across the current and next month.
Running it again resets the data.

### Environment variables

Every variable has a default that matches `docker-compose.yml`, so `.env` files are optional for
local development. To override one, copy the example file next to it:

| File                       | Variable              | Default                                                   |
| -------------------------- | --------------------- | --------------------------------------------------------- |
| `apps/api/.env.example`    | `DATABASE_URL`        | `postgresql://postgres:postgres@localhost:5432/vaclendar` |
| `apps/api/.env.example`    | `CORS_ORIGIN`         | `http://localhost:3000` (comma-separate several origins)  |
| `apps/web/.env.example`    | `NEXT_PUBLIC_API_URL` | `http://localhost:3001`                                   |
| `packages/db/.env.example` | `DATABASE_URL`        | Used by the Prisma CLI and the seed script                |

If port 5432 is taken, start Postgres with `POSTGRES_PORT=5433 docker compose up -d` and set
`DATABASE_URL` in `apps/api/.env` and `packages/db/.env` to match.

### Scripts

Run these from the repo root with `npm run <name>`:

| Script       | What it does                                                 |
| ------------ | ------------------------------------------------------------ |
| `dev`        | Runs web (3000) and api (3001) in parallel through Turborepo |
| `build`      | Production build of both apps                                |
| `lint`       | ESLint in every package                                      |
| `typecheck`  | `tsc --noEmit` in every package                              |
| `test`       | Vitest unit and API tests                                    |
| `db:migrate` | Applies Prisma migrations (`prisma migrate dev`)             |
| `db:seed`    | Resets the database and loads the demo data                  |
| `format`     | Prettier                                                     |

Tests don't need a database: the API tests run the real route handlers against an in-memory
repository.

## Architecture

```
vaclendar/
├── apps/
│   ├── web/        @vaclendar/web: Next.js frontend (UI, calendar, forms), port 3000
│   └── api/        @vaclendar/api: Next.js backend (Route Handlers only, REST API), port 3001
├── packages/
│   ├── db/         @vaclendar/db: Prisma schema, client, migrations, seed script
│   ├── shared/     @vaclendar/shared: Zod schemas, shared types, date and overlap logic
│   ├── ui/         @vaclendar/ui: shared React components (shadcn/ui-based)
│   └── config/     @vaclendar/config: shared tsconfig, ESLint and Prettier config
├── docker-compose.yml   PostgreSQL for local dev (database: vaclendar)
├── turbo.json
└── package.json         npm workspaces + Turborepo scripts
```

```
Browser ──► apps/web (Next.js, React, FullCalendar, TanStack Query, React Hook Form)
               │  fetch + JSON, CORS
               ▼
            apps/api (Next.js Route Handlers)
               │  proxy.ts (CORS) → route → service (business rules) → Repo
               ▼
            packages/db (Prisma 7 + pg adapter) ──► PostgreSQL
```

- **Validation is shared.** The web forms and the API both validate with the Zod schemas in
  `@vaclendar/shared`, so error messages match on both sides.
- **Dates are whole days.** Start and end dates are inclusive `YYYY-MM-DD` strings in the API
  and Postgres `DATE` columns in the database. All date math runs in UTC, so timezones can't
  shift a vacation by a day.
- **No overlapping time off.** A member can't have two overlapping vacations. The check and
  the write run in one serializable transaction, and a conflict returns `409`.
- **Colors.** A member added without a color gets the first unused color from a palette of
  12 distinct colors.
- **Layers in the API.** Route handlers parse and validate input, services
  (`apps/api/src/services`) enforce the business rules, and a small `Repo` interface keeps
  Prisma behind a boundary. That boundary is what lets the API tests run without a database.
- **Internal packages ship TypeScript source.** The apps compile them through
  `transpilePackages`, so they need no separate build step.

Stack: Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4, shadcn/ui
(Radix), FullCalendar 6, TanStack Query 5, React Hook Form, Zod 4, Prisma 7, PostgreSQL 17,
Vitest, Turborepo, npm workspaces.

## API reference

Base URL: `http://localhost:3001`. Every request and response body is JSON. There is no
authentication.

### Errors

Every error uses the same shape:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Ada already has time off from Jul 1, 2025 to Jul 5, 2025, which overlaps these dates"
  }
}
```

| Status | `code`             | When                                                             |
| ------ | ------------------ | ---------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR` | The body or query failed validation (`details` lists each issue) |
| 400    | `BAD_REQUEST`      | The body isn't valid JSON                                        |
| 404    | `NOT_FOUND`        | The member or vacation doesn't exist                             |
| 409    | `CONFLICT`         | Overlapping vacation, or a duplicate member name                 |
| 500    | `INTERNAL_ERROR`   | An unexpected server error                                       |

### Types

```ts
type VacationType = "VACATION" | "SICK" | "PUBLIC_HOLIDAY" | "OTHER";

interface Member {
  id: string;
  name: string;
  color: string; // "#rrggbb"
  createdAt: string; // ISO timestamp
}

interface Vacation {
  id: string;
  memberId: string;
  startDate: string; // "YYYY-MM-DD", inclusive
  endDate: string; // "YYYY-MM-DD", inclusive
  type: VacationType;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  member: { id: string; name: string; color: string }; // included in vacation responses
}
```

### Vacations

#### `GET /api/vacations?from=&to=&memberId=&type=`

Lists the vacations that intersect the date range, sorted by start date, with each member's
name and color included. Every parameter is optional:

- `from`, `to`: `YYYY-MM-DD`. A vacation is returned if any of its days fall in the range.
- `memberId`: one or more member IDs, comma-separated or repeated.
- `type`: one or more types, comma-separated or repeated.

```bash
curl "http://localhost:3001/api/vacations?from=2025-07-01&to=2025-07-31&type=VACATION,SICK"
```

#### `POST /api/vacations` → `201 Vacation`

```json
{
  "memberId": "cm…",
  "startDate": "2025-07-01",
  "endDate": "2025-07-05",
  "type": "VACATION",
  "note": "Beach"
}
```

`note` is optional. Returns `400` if `endDate` is before `startDate`, `404` if the member
doesn't exist, and `409` if the member already has time off on any of those days.

#### `PATCH /api/vacations/:id` → `200 Vacation`

Send any subset of the `POST` fields. The merged result is checked against the same rules.

#### `DELETE /api/vacations/:id` → `204`

### Members

#### `GET /api/members` → `200 Member[]`

Sorted by name.

#### `POST /api/members` → `201 Member`

```json
{ "name": "Ada Lovelace", "color": "#2563eb" }
```

`color` is optional; a distinct palette color is assigned if it's missing. Names must be
unique (case-insensitive), otherwise the response is `409`.

#### `PATCH /api/members/:id` → `200 Member`

```json
{ "name": "Ada L.", "color": "#16a34a" }
```

Send `name`, `color`, or both.

#### `DELETE /api/members/:id` → `204`

Removes the member **and all of their vacations** (cascade delete). The web UI shows how many
vacations will be deleted and asks for confirmation first.

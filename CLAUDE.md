# Max Facility Rink Reports (MFO)

## Project Overview

Max Facility Rink Reports is a comprehensive SaaS platform for ice rink facility management. It replaces paper-based processes with a mobile-first digital solution for 2,500+ North American ice facilities.

- **Live Product Name:** Max Facility Rink Reports
- **Internal Code Name:** MFO

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| UI Library | Shadcn/ui + Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + Auth + RLS + Realtime) |
| Deployment | Vercel |
| State Management | React Server Components + Zustand for client state |
| Forms | React Hook Form + Zod validation |
| Charts/Diagrams | SVG (custom) for rink + body diagrams |
| Bluetooth | Web Bluetooth API (ice depth calipers) |
| Notifications | Supabase Realtime + email via Resend |
| Testing | Vitest + Playwright |

## Project Structure

```
mfo/
├── CLAUDE.md                    # This file — master orchestration
├── agents/                      # Agent task files (instructions per phase)
│   ├── 00-project-scaffold.md
│   ├── 01-database-schema.md
│   ├── 02-auth-and-rls.md
│   ├── 03-admin-control-center.md
│   ├── 04-dashboard-and-layout.md
│   ├── 05-daily-reports.md
│   ├── 06-ice-depth-management.md
│   ├── 07-ice-operations.md
│   ├── 08-employee-scheduling.md
│   ├── 09-incident-reporting.md
│   ├── 10-refrigeration-plant.md
│   ├── 11-air-quality.md
│   ├── 12-notifications-system.md
│   └── 13-reporting-and-export.md
├── src/
│   ├── app/                     # Next.js App Router pages
│   │   ├── (auth)/              # Auth route group
│   │   ├── (app)/               # Authenticated route group
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                  # Shadcn/ui components
│   │   ├── layout/              # Header, Sidebar, Breadcrumbs, MobileNav
│   │   ├── forms/               # Reusable form components
│   │   ├── diagrams/            # IceRinkDiagram, BodyDiagram SVGs
│   │   ├── scheduling/          # Calendar views, ShiftBlock, etc.
│   │   └── shared/              # AlertBadge, OfflineBanner, etc.
│   ├── lib/
│   │   ├── supabase/            # client.ts, server.ts, admin.ts, middleware.ts
│   │   ├── bluetooth/           # Web Bluetooth caliper integration
│   │   ├── hooks/               # Custom React hooks
│   │   ├── utils/               # Helpers, formatters, constants
│   │   ├── types/               # TypeScript types and Zod schemas
│   │   └── constants/           # Brand colors, thresholds, enums
│   └── styles/
│       └── globals.css
├── supabase/
│   ├── migrations/              # SQL migration files
│   ├── seed.sql
│   └── config.toml
├── public/
├── components.json              # Shadcn/ui config
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Brand Colors

Available as Tailwind utility classes (e.g., `bg-navy`, `text-action-green`, `border-wolf-grey`):

| Color | Value | Usage |
|-------|-------|-------|
| `navy` | #002244 | Primary, headers, sidebar |
| `navy-dark` | #001122 | Dark mode background |
| `navy-light` | #003366 | Hover states, accents |
| `action-green` | #69BE28 | CTAs, success states |
| `action-green-hover` | #5AA822 | Button hover |
| `wolf-grey` | #A5ACAF | Secondary text, borders |
| `wolf-grey-light` | #D1D5D8 | Backgrounds, dividers |
| `wolf-grey-dark` | #6B7280 | Muted text |
| `alert-yellow` | #FFB800 | Warnings |
| `alert-red` | #D32F2F | Errors, destructive actions |

## Architecture Decisions

### Multi-Facility Isolation
- All data tables include a `facility_id` column
- Supabase Row-Level Security (RLS) policies enforce isolation
- Users can only access data for their assigned facility
- Super Admins bypass RLS via service role client (server-side only)

### User Roles (Enum)
`super_admin | facility_admin | manager | supervisor | staff | read_only`

### Database Naming Conventions
- Tables: `snake_case` plural (e.g., `ice_makes`, `incident_reports`)
- Columns: `snake_case` (e.g., `facility_id`, `created_at`)
- Enums: `snake_case` (e.g., `user_role`, `incident_type`)
- RLS Policies: `{table}_{action}_{role}` (e.g., `ice_makes_select_staff`)
- Migrations: `YYYYMMDDHHMMSS_{description}.sql`

### Component Conventions
- All components use TypeScript with explicit prop interfaces
- Form components use React Hook Form + Zod schemas
- Server Components by default; add `'use client'` only when needed
- Shadcn/ui components in `src/components/ui/` (do not modify directly)

### File Naming
- Components: `PascalCase.tsx`
- Utilities/hooks: `camelCase.ts`
- Types: `camelCase.ts` in `lib/types/`
- Pages: `page.tsx` (Next.js convention)
- Layouts: `layout.tsx`

## Key Patterns

### Form Submission
1. Zod schema defines validation
2. React Hook Form manages state
3. Server Action handles submission
4. Supabase insert with `facility_id` from session
5. Revalidate relevant paths
6. Toast notification on success/error

### Server Action Result Type
```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

### Admin Configuration Pattern
Modules read config from admin tables — never hardcode options:
- `module_settings`: which modules are enabled
- `tab_configurations`: Daily Reports tabs
- `checklist_items`: items per tab per checklist type
- `equipment`: machines, compressors, pumps
- `thresholds`: alert ranges per metric
- `shift_types`: scheduling categories

### Responsive Design
Mobile first. Test all screens at: 375px, 768px, 1280px.
Minimum touch target: 48x48px.

## Development Phases

| Phase | Agent File | Description |
|-------|-----------|-------------|
| 0 | `00-project-scaffold.md` | Project initialization (DONE) |
| 1 | `01-database-schema.md` | All tables, enums, indexes |
| 2 | `02-auth-and-rls.md` | Auth flows, RLS policies |
| 3 | `03-admin-control-center.md` | Admin system (Priority) |
| 4 | `04-dashboard-and-layout.md` | App shell, navigation |
| 5 | `05-daily-reports.md` | Daily Reports module |
| 6 | `06-ice-depth-management.md` | Ice Depth module |
| 7 | `07-ice-operations.md` | Ice Operations module |
| 8 | `08-employee-scheduling.md` | Scheduling module |
| 9 | `09-incident-reporting.md` | Incident Reporting module |
| 10 | `10-refrigeration-plant.md` | Refrigeration module |
| 11 | `11-air-quality.md` | Air Quality module |
| 12 | `12-notifications-system.md` | Notifications |
| 13 | `13-reporting-and-export.md` | PDF/CSV/Excel export |

## Important Constraints

1. No hardcoded facility data — everything from admin configuration
2. No photo uploads in v1 (except facility logo)
3. No digital signatures — submissions attributed via auth user
4. No time clock — scheduling is schedule-only
5. No automated sensor integration (except Bluetooth calipers)
6. Offline mode deferred to v2
7. No bulk user import — individual email invitations
8. Session duration: configurable, recommend 8-12 hours
9. Dark mode required — every component must support both themes
10. All modules respect admin enable/disable settings

## Environment Variables

See `.env.local.example` for required variables.

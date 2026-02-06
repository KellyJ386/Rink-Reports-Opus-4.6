# CLAUDE.md — Max Facility Rink Reports (MFO)

## Project Overview

**Max Facility Rink Reports** is an ice rink facility management SaaS platform built for 2,500+ ice rink facilities in North America. It replaces paper-based reporting with a digital-first PWA experience.

## Tech Stack

- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Database:** Supabase (PostgreSQL, Row-Level Security, Realtime, Storage)
- **Auth:** Supabase Auth (email/password, magic link, invitation flow)
- **UI:** Shadcn/ui + Tailwind CSS + Lucide icons
- **Forms:** React Hook Form + Zod validation
- **State:** Zustand (client-side state management)
- **Email:** Resend
- **Date Handling:** date-fns
- **Export:** jspdf + jspdf-autotable (PDF), xlsx (Excel)
- **Deployment:** Vercel (frontend) + Supabase (backend)

## Brand Colors

| Name | Hex | Tailwind Class | Usage |
|------|-----|----------------|-------|
| Navy | #002244 | `navy` | Primary, headers, sidebar |
| Navy Dark | #001122 | `navy-dark` | Dark mode background |
| Navy Light | #003366 | `navy-light` | Hover states |
| Action Green | #69BE28 | `action-green` | CTA buttons, success states |
| Action Green Hover | #5AA822 | `action-green-hover` | Button hover |
| Wolf Grey | #A5ACAF | `wolf-grey` | Secondary text, borders |
| Wolf Grey Light | #D1D5D8 | `wolf-grey-light` | Backgrounds, dividers |
| Wolf Grey Dark | #6B7280 | `wolf-grey-dark` | Muted text |
| Alert Yellow | #FFB800 | `alert-yellow` | Warnings, caution states |
| Alert Red | #D32F2F | `alert-red` | Errors, destructive actions, out-of-range |

## User Roles (Hierarchy)

```
super_admin > facility_admin > manager > supervisor > staff > read_only
```

| Role | Access | Notes |
|------|--------|-------|
| `super_admin` | All facilities, all features | Server-side only (bypasses RLS) |
| `facility_admin` | Own facility, all features + admin | Manages configuration |
| `manager` | Own facility, all features except admin config | Can approve swaps, view all schedules |
| `supervisor` | Own facility, operational features | Can submit forms, limited admin views |
| `staff` | Own facility, data entry only | Cannot access admin |
| `read_only` | Own facility, view only | Cannot insert/update/delete |

## Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (app)/
│   │   ├── dashboard/page.tsx
│   │   ├── daily-reports/
│   │   │   ├── page.tsx
│   │   │   └── [tabId]/
│   │   │       ├── page.tsx
│   │   │       └── [type]/page.tsx
│   │   ├── ice-depth/
│   │   │   ├── page.tsx
│   │   │   └── history/page.tsx
│   │   ├── ice-operations/
│   │   │   ├── page.tsx
│   │   │   ├── ice-makes/page.tsx
│   │   │   ├── blade-change/page.tsx
│   │   │   ├── edging/page.tsx
│   │   │   └── circle-check/page.tsx
│   │   ├── scheduling/
│   │   │   ├── page.tsx
│   │   │   ├── availability/page.tsx
│   │   │   ├── swaps/page.tsx
│   │   │   └── open-shifts/page.tsx
│   │   ├── incidents/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── refrigeration/
│   │   │   ├── page.tsx
│   │   │   ├── [equipmentId]/page.tsx
│   │   │   └── history/page.tsx
│   │   ├── air-quality/
│   │   │   ├── page.tsx
│   │   │   ├── history/page.tsx
│   │   │   └── reports/page.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── facility/page.tsx
│   │   │   ├── rinks/page.tsx
│   │   │   ├── users/page.tsx
│   │   │   ├── modules/page.tsx
│   │   │   ├── checklists/[tabId]/page.tsx
│   │   │   ├── equipment/page.tsx
│   │   │   ├── thresholds/page.tsx
│   │   │   └── data-retention/page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   └── scheduled-reports/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/              # Shadcn components (auto-generated)
│   ├── layout/          # Header, Sidebar, Breadcrumbs, NotificationBell
│   ├── forms/           # Shared form components
│   ├── diagrams/        # IceRinkDiagram, BodyDiagram SVGs
│   ├── scheduling/      # ShiftBlock, CalendarView
│   └── shared/          # AlertBadge, ModuleGuard, LoadingSpinner
├── lib/
│   ├── supabase/
│   │   ├── client.ts    # Browser client
│   │   ├── server.ts    # Server component client
│   │   ├── admin.ts     # Service role client (bypasses RLS)
│   │   └── middleware.ts # Auth session management
│   ├── bluetooth/
│   │   └── caliper.ts   # Web Bluetooth caliper integration
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useNotifications.ts
│   │   ├── useAlertCounts.ts
│   │   └── useBluetoothCaliper.ts
│   ├── services/
│   │   ├── notifications.ts
│   │   ├── email.ts
│   │   └── sms.ts
│   ├── reports/
│   │   ├── pdf.ts
│   │   ├── csv.ts
│   │   └── excel.ts
│   ├── utils/
│   │   └── recurrence.ts
│   ├── types/
│   │   └── database.ts  # Generated Supabase types
│   └── constants/
│       ├── brand.ts
│       ├── bodyRegions.ts
│       └── moduleIcons.ts
├── styles/
│   └── globals.css
└── middleware.ts         # Root auth middleware
```

## Naming Conventions

- **Files:** kebab-case (`ice-depth-management.tsx`)
- **Components:** PascalCase (`IceRinkDiagram.tsx`)
- **Hooks:** camelCase with `use` prefix (`useAuth.ts`)
- **Server Actions:** camelCase (`updateFacilitySettings`)
- **Database tables:** snake_case (`ice_depth_readings`)
- **Database enums:** snake_case (`user_role`, `fuel_type`)
- **TypeScript types:** PascalCase (`FacilitySettings`, `UserRole`)
- **Constants:** UPPER_SNAKE_CASE (`BRAND`, `USER_ROLES`)
- **CSS classes:** Tailwind utility classes, no custom CSS unless necessary

## Architecture Patterns

### Admin Configuration Pattern
All configurable options (checklists, equipment, thresholds, metrics) are managed in the Admin Control Center and stored in config tables. Feature modules read from these config tables to render dynamic forms and dropdowns. Never hardcode options that should be admin-configurable.

### Server Action Pattern
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const Schema = z.object({ /* ... */ })

export async function actionName(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const parsed = Schema.safeParse({ /* ... */ })
  if (!parsed.success) return { success: false, error: parsed.error.flatten() }

  const { error } = await supabase.from('table').insert(parsed.data)
  if (error) return { success: false, error: error.message }

  revalidatePath('/path')
  return { success: true }
}
```

### Data Isolation
Every query MUST filter by `facility_id`. RLS policies enforce this at the database level. Never trust client-provided facility IDs — always derive from the authenticated user's profile.

### Optimistic UI Pattern
For instant-feedback interactions (checkbox toggles, status updates), use optimistic UI:
1. Update UI immediately
2. Send request to server
3. Revert on error with toast notification

## Module List (9 Core Modules)

| Module | Route | Config Source |
|--------|-------|---------------|
| Daily Reports | `/daily-reports` | `daily_report_tabs`, `checklist_items` |
| Ice Depth | `/ice-depth` | `rinks`, `ice_depth_points`, `ice_depth_thresholds` |
| Ice Operations | `/ice-operations` | `machines`, `circle_check_items` |
| Scheduling | `/scheduling` | `shift_types` |
| Incidents | `/incidents` | `incident_locations` |
| Refrigeration | `/refrigeration` | `equipment`, `equipment_reading_types` |
| Air Quality | `/air-quality` | `air_quality_metrics`, `air_quality_locations` |
| Admin | `/admin` | All config tables |
| Reports | `/reports` | All operational tables |

## Development Commands

```bash
npm run dev          # Start Next.js dev server (port 3000)
npx supabase start   # Start local Supabase (port 54321)
npx supabase db reset # Reset database and run all migrations + seed
npx supabase gen types typescript --local > src/lib/types/database.ts
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY=      # Supabase service role key (server-only)
RESEND_API_KEY=                 # Resend email API key
NEXT_PUBLIC_APP_URL=            # App URL (http://localhost:3000 in dev)
```

## Key Rules

1. **Never bypass RLS** from the client. Use the admin client only in server actions when explicitly needed.
2. **Always validate** with Zod before database operations.
3. **Always show toast** on form success/error using Shadcn toast.
4. **All destructive actions** (delete, deactivate) require a confirmation dialog.
5. **Touch targets** must be minimum 48x48px for mobile accessibility.
6. **Dark mode** must work on every screen using Tailwind `dark:` variants.
7. **Mobile-first** responsive design — all screens must work on 375px+ widths.
8. **Facility isolation** — users must never see data from other facilities.

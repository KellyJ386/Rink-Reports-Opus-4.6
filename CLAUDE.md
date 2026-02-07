# CLAUDE.md — Max Facility Rink Reports

## Project Overview
Ice rink facility management and daily reporting SaaS platform built with Next.js and Supabase.

## Tech Stack
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript 5.9 (strict mode)
- **Database:** Supabase (PostgreSQL + Auth + RLS + Realtime)
- **UI:** Tailwind CSS v4, Shadcn/ui, Radix UI, Lucide icons
- **State:** Zustand (client), React Hook Form + Zod (forms)
- **Exports:** jspdf, xlsx

## Architecture

### Directory Structure
```
src/
├── app/
│   ├── (app)/         # Authenticated routes (dashboard, modules, admin)
│   ├── (auth)/        # Public auth routes (login, forgot-password, reset-password)
│   ├── layout.tsx     # Root layout (ThemeProvider, Toaster)
│   ├── page.tsx       # Redirects to /dashboard
│   └── loading.tsx    # Global loading splash
├── components/
│   ├── ui/            # Shadcn/ui primitives (do not edit directly)
│   ├── layout/        # Header, Sidebar, Breadcrumbs, etc.
│   ├── diagrams/      # SVG diagrams (rink, body)
│   ├── scheduling/    # Scheduling-specific components
│   └── shared/        # Shared components (AlertBadge, etc.)
├── lib/
│   ├── supabase/      # Client, server, admin, middleware
│   ├── constants/     # Brand, module config, body regions
│   ├── hooks/         # useAuth, useAlertCounts, useBluetoothCaliper
│   ├── services/      # notifications, email, sms, notify (triggers)
│   ├── reports/       # PDF, CSV, Excel generators
│   ├── utils/         # Utility functions (cn, recurrence)
│   └── bluetooth/     # Web Bluetooth caliper integration
├── styles/
│   └── globals.css    # Tailwind v4 + brand CSS variables
└── types/
    └── web-bluetooth.d.ts
```

### Naming Conventions
- **Files:** kebab-case for routes, PascalCase for components
- **Database:** snake_case for tables, columns, functions
- **TypeScript:** PascalCase for types/interfaces, camelCase for variables/functions
- **CSS:** Tailwind utility classes; brand colors via CSS variables (`--color-navy`, `--color-action-green`)

### Server Actions Pattern
All mutations follow this pattern:
1. `'use server'` directive
2. Zod schema validation
3. Supabase auth check (`getUser()`)
4. Get user's facility_id from `profiles` table
5. Database operation scoped to facility
6. `revalidatePath()` for cache invalidation
7. Fire-and-forget notification trigger (when applicable)
8. Return `{ success: true }` or `{ error: string }`

### User Roles (hierarchical)
`super_admin` > `facility_admin` > `manager` > `supervisor` > `staff` > `read_only`

### Row-Level Security
All tables have RLS enabled. Users can only access data within their `facility_id`. Helper functions:
- `get_user_facility_id()` — returns facility_id for current user
- `get_user_role()` — returns role for current user
- `is_admin_role(role)` — checks if role is admin-level

## Commands
```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
```

## Environment Variables
See `.env.local.example` for required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_APP_URL`

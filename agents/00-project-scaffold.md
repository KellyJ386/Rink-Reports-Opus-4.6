# Phase 0: Project Scaffold

## Status
COMPLETED

## Description
Initialize Next.js, Supabase, Shadcn/ui, Tailwind with brand config, folder structure. Set up the foundational project architecture and development tooling.

## Prerequisites
- None (this is the first phase)

## Deliverables
- Next.js project initialized with TypeScript
- Supabase client configuration
- Shadcn/ui component library installed and configured
- Tailwind CSS with brand color config and design tokens
- Folder structure established (app routes, components, lib, utils, types)
- ESLint and Prettier configuration
- Environment variables template

## Files Created
- `next.config.ts` — Next.js configuration
- `tsconfig.json` — TypeScript strict mode config
- `components.json` — Shadcn/ui configuration (new-york style, RSC)
- `.env.local.example` — Environment variable template
- `src/app/layout.tsx` — Root layout with system fonts
- `src/app/page.tsx` — Landing redirect
- `src/app/globals.css` — Tailwind v4 theme with `@theme inline`, brand colors, dark mode CSS vars
- `src/lib/supabase/client.ts` — Browser Supabase client
- `src/lib/supabase/server.ts` — Server Supabase client with cookies
- `src/lib/supabase/admin.ts` — Service role client (bypasses RLS)
- `src/lib/supabase/middleware.ts` — Auth session refresh
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `src/lib/constants/brand.ts` — Brand colors, module names, role labels
- `src/lib/types/index.ts` — Type barrel exports
- `src/lib/types/actions.ts` — `ActionResult<T>` pattern
- `src/lib/types/auth.ts` — Auth-related types
- `src/middleware.ts` — Next.js middleware for auth
- `src/components/ui/*.tsx` — 22 Shadcn/ui components (manually created)
- `supabase/config.toml` — Supabase local config
- Route group placeholders: `(auth)` and `(app)` layouts + pages

## Implementation Notes
- Shadcn registry (ui.shadcn.com) was inaccessible — all 22 components created manually
- Google Fonts failed in build env — uses system font stack instead of next/font/google
- Tailwind v4 uses `@theme inline {}` CSS-based config, NOT tailwind.config.ts
- Next.js 16 renamed "middleware" to "proxy" (deprecation warning)

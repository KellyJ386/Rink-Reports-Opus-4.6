# Phase 2: Auth & RLS

## Status
COMPLETED

## Description
Supabase Auth, login/logout/reset flows, RLS policies on all tables, middleware. Implement secure authentication and row-level security to protect all data access.

## Prerequisites
- Phase 0: Project Scaffold (COMPLETED)
- Phase 1: Database Schema (COMPLETED)

## Deliverables
- Supabase Auth integration with email/password
- Login page with form validation
- Logout functionality
- Password reset flow
- RLS policies on all database tables
- Next.js middleware for route protection
- Auth context/provider for client-side state
- Role-based access control foundation

## Files Created
- `supabase/migrations/20240101000002_rls_policies.sql` — RLS policies (~35KB):
  - Helper functions: `auth.facility_id()`, `auth.user_role()`
  - RLS enabled on all 30 tables
  - Policies enforce facility isolation and role-based access
  - Super admins bypass restrictions via service role
- `src/lib/supabase/auth-actions.ts` — Server actions: signIn, signOut, forgotPassword, resetPassword, getSession, getUserProfile
- `src/lib/hooks/useAuth.ts` — Zustand store with profile, loading, fetchProfile, clearProfile
- `src/app/(auth)/login/page.tsx` — Full login form with email/password, error handling, loading state
- `src/app/(auth)/forgot-password/page.tsx` — Forgot password with success state
- `src/app/(auth)/reset-password/page.tsx` — Password reset with confirm field
- `src/app/(auth)/auth/callback/route.ts` — Supabase auth code exchange route
- `src/app/(auth)/layout.tsx` — Auth layout with navy background, centered card

## Implementation Notes
- RLS helper functions extract facility_id and role from JWT metadata
- All SELECT policies filter by facility_id
- INSERT policies verify the user belongs to the target facility
- UPDATE/DELETE policies check role hierarchy
- Middleware redirects unauthenticated users to /login

# Phase 4: Dashboard & Layout

## Status
COMPLETED

## Description
App shell, responsive navigation, dashboard grid, alert badges, dark mode toggle. Build the main application layout and landing dashboard that serves as the central hub for all modules.

## Prerequisites
- Phase 0: Project Scaffold (COMPLETED)
- Phase 2: Auth & RLS (COMPLETED)
- Phase 3: Admin Control Center (COMPLETED)

## Deliverables
- App shell with header, sidebar, and content area
- Responsive navigation (desktop sidebar, mobile hamburger menu)
- Dashboard grid with summary cards and widgets
- Alert badges for pending items and threshold warnings
- Dark mode toggle with persistent preference
- Breadcrumb navigation
- User profile dropdown menu

## Files Created
- `src/components/layout/Sidebar.tsx` — Desktop sidebar with nav items, admin link (role-gated), brand logo
- `src/components/layout/Header.tsx` — Top header with menu toggle, notifications bell, dark mode, user info, sign out
- `src/components/layout/DarkModeToggle.tsx` — Toggles `.dark` class on html element, persists to localStorage
- `src/components/layout/MobileNav.tsx` — Slide-out drawer nav with 48px min touch targets
- `src/components/layout/Breadcrumbs.tsx` — Auto-generated breadcrumbs from pathname
- `src/components/layout/AppShell.tsx` — Wires Sidebar + Header + MobileNav + Breadcrumbs together
- `src/components/layout/index.ts` — Barrel export for layout components
- `src/app/(app)/layout.tsx` — Server component, fetches profile, passes userName/userRole to AppShell
- `src/app/(app)/dashboard/page.tsx` — Dashboard with 4 stat cards + 7 module navigation cards

## Implementation Notes
- AppShell is a client component that manages sidebar open/close and mobile menu state
- Layout is a server component that fetches profile and passes data to AppShell
- Navigation items defined in Sidebar, each linking to a module route
- Admin link only visible for facility_admin and super_admin roles
- Brand colors used for sidebar background (navy), action buttons (action-green)
- Minimum touch target 48x48px for mobile nav items

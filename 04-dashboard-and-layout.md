# Agent 04: Dashboard & App Layout

## Objective
Build the authenticated app shell (header, sidebar, breadcrumbs, mobile nav) and the main dashboard with module navigation buttons and alert badges.

## Prerequisites
- Agents 00-03 completed (Admin config data exists)

---

## Tasks

### 1. App Layout Shell
**File:** `src/app/(app)/layout.tsx`

Components to build:
- **Header** (`src/components/layout/Header.tsx`):
  - Max Facility logo (centered on mobile, left on desktop)
  - Notification bell icon (right) with badge count from `active_alerts` table
  - User avatar/menu (right) — dropdown with: Profile, Settings, Dark Mode Toggle, Logout
  - Hamburger menu icon (left, mobile only)

- **Sidebar** (`src/components/layout/Sidebar.tsx`):
  - Desktop: persistent left sidebar (collapsible)
  - Mobile: overlay drawer triggered by hamburger
  - Links to all enabled modules (read from `module_settings` for user's facility)
  - Active state highlighting on current route
  - Admin link shown only for admin roles
  - Module icons next to each link

- **Breadcrumbs** (`src/components/layout/Breadcrumbs.tsx`):
  - Auto-generated from route segments
  - Dashboard > Module > Sub-page
  - Clickable navigation

- **Mobile Bottom Nav** (optional enhancement):
  - If desired, add bottom tab bar for top 4-5 modules on mobile

### 2. Dashboard Page
**File:** `src/app/(app)/dashboard/page.tsx`

- Grid of large rectangular buttons for each enabled module
- Layout:
  - Mobile: 2 columns
  - Tablet: 3 columns
  - Desktop: 3-4 columns
- Button minimum height: 120px
- Each button contains:
  - Module icon (use Lucide icons)
  - Module name
  - Alert badge (red circle with white number) in top-right corner — if applicable
- Button order matches `module_settings` sort or default order from PRD
- Admin button only visible to admin roles

### 3. Alert Badge Logic
**File:** `src/lib/hooks/useAlertCounts.ts`

Query `active_alerts` table grouped by module, count unacknowledged alerts:

```typescript
// Returns: { refrigeration: 2, incidents: 1, air_quality: 0, ... }
```

Modules that show alert badges:
- **Refrigeration Plant:** out-of-range reading count
- **Incident Reporting:** new unreviewed incidents count
- **Air Quality:** out-of-range readings count
- **Scheduling:** pending swap requests count (for managers)

### 4. Dark Mode Implementation
**File:** `src/components/layout/ThemeProvider.tsx`

- Use `next-themes` package for dark mode
- Toggle in user menu
- Persist preference (localStorage or user profile)
- Apply `dark` class to `<html>` element
- All Shadcn components automatically support dark mode
- Custom components must use Tailwind dark: variants

### 5. Module Icon Mapping
```typescript
// src/lib/constants/moduleIcons.ts
import {
  ClipboardList,  // Daily Reports
  Ruler,           // Ice Depth
  Snowflake,       // Ice Operations
  Calendar,        // Scheduling
  AlertTriangle,   // Incidents
  Thermometer,     // Refrigeration
  Wind,            // Air Quality
  Settings,        // Admin
} from 'lucide-react'
```

### 6. Alert Badge Component
**File:** `src/components/shared/AlertBadge.tsx`

```typescript
// Red circle with white number, positioned in top-right of parent
// Only renders when count > 0
// Animates in with subtle scale animation
interface AlertBadgeProps {
  count: number;
}
```

### 7. Module Access Guard
**File:** `src/components/layout/ModuleGuard.tsx`

Wrapper component for each module layout:
- Checks if module is enabled for user's facility
- Checks if user's role has access to the module
- If not: redirect to dashboard with toast "You don't have access to this module"

Use in each module's `layout.tsx`:
```typescript
export default function DailyReportsLayout({ children }) {
  return <ModuleGuard module="daily_reports">{children}</ModuleGuard>
}
```

## Completion Criteria
- [ ] App shell renders with header, sidebar (desktop), hamburger nav (mobile)
- [ ] Dashboard shows grid of module buttons (responsive: 2/3/4 columns)
- [ ] Only enabled modules appear on dashboard
- [ ] Only role-permitted modules appear
- [ ] Alert badges display correct counts
- [ ] Alert badges only show when count > 0
- [ ] Dark mode toggles correctly and persists
- [ ] All components render correctly in both light and dark mode
- [ ] Breadcrumbs show correct path on all pages
- [ ] User menu shows profile, dark mode, logout
- [ ] Notification bell shows count
- [ ] Module guard prevents unauthorized access
- [ ] Mobile hamburger menu works correctly
- [ ] Minimum 48x48px touch targets on all interactive elements
- [ ] Logo displays correctly in header

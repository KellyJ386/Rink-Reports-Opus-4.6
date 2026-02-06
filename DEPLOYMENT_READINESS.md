# Deployment Readiness Report

**Project:** Max Facility Rink Reports (MFO)
**Date:** 2026-02-06
**Branch:** `claude/setup-mfo-platform-es0w4`
**Build Status:** PASSING (29 routes compiled, 0 errors, 0 warnings)
**Audit Version:** 2 (deep codebase inspection)

---

## Summary Dashboard

### Overall Deployment Readiness: 78.2%

```
████████████████░░░░ 78.2%
```

| Tier | Phases | Weight | Avg Score |
|------|--------|--------|-----------|
| Foundation (2x) | 0-3 | 2.0x | 94.0% |
| Features (1x) | 4-11 | 1.0x | 71.0% |
| Enhancements (0.75x) | 12-13 | 0.75x | 32.5% |

**Weighted Formula:** `(Σ phase_score × weight) / Σ weights`
**Calculation:** `(752 + 568 + 48.75) / 17.5 = 78.2%`

---

## Per-Module Breakdown

| Phase | Module | Score | Progress | Status |
|-------|--------|-------|----------|--------|
| 0 | Project Scaffold | 95% | `███████████████████░` | Near Complete |
| 1 | Database Schema | 96% | `███████████████████░` | Near Complete |
| 2 | Auth & RLS | 100% | `████████████████████` | Complete |
| 3 | Admin Control Center | 85% | `█████████████████░░░` | Functional |
| 4 | Dashboard & Layout | 75% | `███████████████░░░░░` | Functional |
| 5 | Daily Reports | 78% | `████████████████░░░░` | Functional |
| 6 | Ice Depth Management | 63% | `█████████████░░░░░░░` | Partial |
| 7 | Ice Operations | 57% | `███████████░░░░░░░░░` | Partial + Bug |
| 8 | Employee Scheduling | 55% | `███████████░░░░░░░░░` | Partial |
| 9 | Incident Reporting | 85% | `█████████████████░░░` | Functional |
| 10 | Refrigeration Plant | 75% | `███████████████░░░░░` | Functional |
| 11 | Air Quality | 80% | `████████████████░░░░` | Functional |
| 12 | Notifications System | 35% | `███████░░░░░░░░░░░░░` | Scaffolded |
| 13 | Reporting & Export | 30% | `██████░░░░░░░░░░░░░░` | Scaffolded |

---

## Per-Phase Detail

### Phase 0: Project Scaffold — 95%

**What's Done:**
- Next.js 16.1.6 with TypeScript strict mode
- Tailwind CSS v4 with `@theme inline` + all 10 brand colors in `globals.css`
- 21 Shadcn/ui components manually created (alert, avatar, badge, button, card, checkbox, dialog, dropdown-menu, input, label, scroll-area, select, separator, sheet, switch, table, tabs, textarea, toast, toaster, tooltip)
- All 4 Supabase clients: `client.ts`, `server.ts`, `admin.ts`, `middleware.ts`
- ESLint configured (`eslint.config.mjs` with Next.js config)
- All dependencies installed (jsPDF, xlsx, Resend, Zustand, RHF, Zod, date-fns)
- `components.json`, `tsconfig.json`, `next.config.ts` properly configured
- `.env.local.example` with all required environment variable keys
- Complete folder structure including `src/components/{ui,layout,forms,diagrams,scheduling,shared}` and `src/lib/{supabase,bluetooth,hooks,utils,types,constants}`

**Gaps:**
- [ ] Missing `.prettierrc` config file (ESLint present but Prettier not configured)

---

### Phase 1: Database Schema — 96%

**What's Done:**
- 30 tables created across all modules
- 73 indexes for query performance (exceeds 60+ spec)
- 15 of 16 enums defined as proper PostgreSQL types
- TypeScript types (`lib/types/database.ts`) with 45 exported interfaces
- `updated_at` trigger function with automatic timestamps on all tables
- Seed data (`supabase/seed.sql`, 109 lines: facilities, rinks, zones, module settings, tabs, equipment, shift types, thresholds)

**Gaps:**
- [ ] `ice_event_type` enum not created as a proper PostgreSQL enum — `ice_events.event_type` uses CHECK constraint instead (`CHECK (event_type IN ('cut', 'flood', 'full_resurface', 'patch'))`)

---

### Phase 2: Auth & RLS — 100%

**What's Done:**
- 119 Row-Level Security policies across all 30 tables
- Auth helper functions: `auth.facility_id()`, `auth.user_role()`
- All 6 auth actions: `signIn`, `signOut`, `forgotPassword`, `resetPassword`, `getSession`, `getUserProfile`
- Zustand auth hook (`useAuth.ts`) with profile state, fetchProfile, clearProfile
- Login page with email/password, error handling, loading state
- Forgot-password page with success state
- Reset-password page with confirm field
- Auth callback route (`/auth/callback`) for Supabase code exchange
- Auth layout with navy background, centered card

---

### Phase 3: Admin Control Center — 85%

**What's Done:**
- All 9 required components created with `'use client'` directive:
  AdminTabs, FacilitySettings, UserManagement, ModuleSettings, EquipmentManager, ThresholdSettings, TabBuilder, ShiftTypeManager, RinkManager
- 44 exported server action functions (exceeds 28+ spec)
- `getAuthenticatedAdmin()` helper — facility_id from session, not passed as param
- Admin page with role check (`facility_admin` + `super_admin` only) and `Promise.all` parallel data fetching
- Components pass plain objects to actions (NOT FormData) for most functions
- Optimistic local state updates + toast notifications on all CRUD operations

**Gaps:**
- [ ] AdminTabs does NOT filter visible tabs based on `module_settings.is_enabled` — `modules` prop is passed but never used for filtering; all 8 tabs always shown
- [ ] `upsertThreshold` still accepts FormData instead of plain object (inconsistent with pattern)
- [ ] `createTab`/`updateTab` still accept FormData instead of plain object

---

### Phase 4: Dashboard & Layout — 75%

**What's Done:**
- All 7 layout components: Sidebar.tsx, Header.tsx, DarkModeToggle.tsx, MobileNav.tsx, Breadcrumbs.tsx, AppShell.tsx, index.ts barrel export
- `(app)/layout.tsx` is a server component that fetches profile and passes userName/userRole to AppShell
- Sidebar hidden on mobile (`lg:hidden`), MobileNav visible on small screens with 48px min touch targets
- DarkModeToggle persists to localStorage, respects system preference, toggles `.dark` class
- Dashboard page with 4 stat cards + 7 module navigation cards
- Breadcrumbs auto-generated from pathname

**Gaps:**
- [ ] Dashboard stat cards show hardcoded `"--"` placeholders — no Supabase queries for live counts
- [ ] Header bell icon is static `<Bell />` — no unread count badge, no onClick handler, no navigation to `/notifications`
- [ ] Sidebar and MobileNav hardcode all 7 module links — do not check `module_settings.is_enabled`
- [ ] No user profile dropdown menu (just sign-out button)

---

### Phase 5: Daily Reports — 78%

**What's Done:**
- Reports list page with status badges and summary cards (Drafts, Pending Review, Approved)
- All 9 server actions implemented: getDailyReports, getDailyReport, createDailyReport, updateDailyReport, submitDailyReport, approveDailyReport, rejectDailyReport, getChecklistItemsForReport, saveChecklistResponse
- New report form with date picker and duplicate date detection
- Detail page with dynamic checklist sections
- `ChecklistSection.tsx` with auto-saving responses, threshold flagging, multi-field types
- `DailyReportActions.tsx` with submit/approve/reject workflow buttons
- Mobile card view + desktop table view

**Gaps:**
- [ ] Uses native FormData / manual validation instead of React Hook Form + Zod
- [ ] No print-friendly CSS (`@media print`) for report output
- [ ] Approval/rejection workflow exists in actions but DailyReportActions.tsx provides full UI triggers (previously flagged in error — actually working)

---

### Phase 6: Ice Depth Management — 63%

**What's Done:**
- Readings list with RinkSelector component (button filter via URL search params)
- Summary cards: Latest Depth, Average Depth, Flagged Count
- Server actions with proper threshold-based flagging logic (checks critical_low, critical_high, warning_low, warning_high from admin config)
- New measurement form with rink/zone selection, depth, method, notes
- Ice events section showing cuts, floods, resurfaces, patches with depth changes
- Flagged measurements highlighted with yellow border/background

**Gaps:**
- [ ] Web Bluetooth API not implemented — `src/lib/bluetooth/` is empty (.gitkeep only); form shows "Bluetooth Caliper" as an option but no actual connection code
- [ ] No depth history charts or trend visualization — no chart library imported
- [ ] No IceRinkDiagram SVG component — `src/components/diagrams/` is empty (.gitkeep only)
- [ ] No `[id]/page.tsx` detail page for individual measurements

---

### Phase 7: Ice Operations — 57%

**What's Done:**
- Operations list page with summary cards (Today's Events, Today's Ice Makes, Maintenance Due)
- IceOperationsFilter.tsx with 6 filter options
- Server actions: getIceEvents, getIceEvent, createIceEvent, getIceMakes, createIceMake, getMaintenanceLogs, createMaintenanceLog, getEquipmentList, getRinks
- Detail page for ice events (`[id]/page.tsx`) with full info
- Equipment and maintenance cards with status badges
- Mobile card + desktop table views

**Gaps:**
- [ ] **CRITICAL BUG**: Event type mismatch between code and database
  - Code (`actions.ts` line 20): `'resurfacing' | 'flood' | 'scrape' | 'edge' | 'maintenance'`
  - DB CHECK constraint: `'cut' | 'flood' | 'full_resurface' | 'patch'`
  - Only `'flood'` matches — all other INSERTs will fail at runtime
  - Ice Depth module (`ice-depth/actions.ts`) correctly uses `['cut','flood','full_resurface','patch']`
- [ ] `createIceMake` action exists but is **never called** — no UI form for ice makes (resurface_type: full, half, spot, dry_cut)
- [ ] Ice makes fetched in page but only used for summary card count — no table, list, or detail view
- [ ] No operations timeline/calendar view
- [ ] Uses plain forms instead of React Hook Form + Zod

---

### Phase 8: Employee Scheduling — 55%

**What's Done:**
- Schedule list page with 3 tabs (Schedules, Time Off, Shift Swaps) and summary cards
- 18 server actions including: getSchedules, createSchedule, publishSchedule, getTimeOffRequests, createTimeOffRequest, approveTimeOff, denyTimeOff, getShiftSwapRequests, createShiftSwapRequest, approveShiftSwap, denyShiftSwap, schedule entry CRUD, getEmployeeAvailability, getEmployees
- ScheduleActions.tsx client component with New Schedule dialog + publish action
- Responsive tables for all three tabs with status badges and pending count indicators
- Role-based authorization (managers+ for approvals)

**Gaps:**
- [ ] No `/scheduling/new/page.tsx` (new schedule form as standalone page)
- [ ] No `/scheduling/[id]/page.tsx` (schedule detail/edit page)
- [ ] No drag-and-drop schedule builder — no @dnd-kit or react-beautiful-dnd installed
- [ ] No weekly/monthly calendar view — no react-big-calendar or similar
- [ ] No employee availability management UI (action exists, no frontend)
- [ ] `src/components/scheduling/` is empty (.gitkeep only) — no CalendarView, ShiftBlock, etc.
- [ ] Uses plain forms instead of React Hook Form + Zod

---

### Phase 9: Incident Reporting — 85%

**What's Done:**
- Incidents list with severity/status/type color-coded badges (Critical=red, High=orange, Medium=yellow, Low=green)
- 10 server actions: getIncidents, getIncident, createIncident, updateIncident, resolveIncident, closeIncident, getFollowUps, createFollowUp, getRinks, getEmployees
- NewIncidentForm.tsx: comprehensive form with type, severity, rink, location, date/time, injured party, witnesses, immediate action
- Detail page with full incident view, follow-ups displayed as timeline cards
- IncidentDetailActions.tsx: add follow-up, resolve (with root cause), close dialogs
- Auto-incrementing incident numbers (SERIAL column, displayed as #197, etc.)
- Status workflow: open → investigating → resolved → closed

**Gaps:**
- [ ] No BodyDiagram SVG component — `src/components/diagrams/` is empty (.gitkeep only)
- [ ] No incident statistics/trend analysis page — only summary cards on list page
- [ ] Uses hardcoded incident types instead of loading from database configuration
- [ ] Uses plain forms instead of React Hook Form + Zod

---

### Phase 10: Refrigeration Plant — 75%

**What's Done:**
- Readings list with summary cards (Compressors, Total Readings, Flagged Readings, Maintenance Records)
- Compressor status cards showing latest readings (suction PSI, discharge PSI, slab temp, brine supply)
- Tabs for Recent Readings and Maintenance Log
- 7 server actions: getRefrigerationReadings, createReading, getReading, getRefrigerationMaintenance, createMaintenance, getCompressors, getRefrigerationThresholds
- NewReadingForm.tsx: 5-card form with all fields — equipment selector, pressures (suction/discharge/oil/condenser PSI), temperatures (7 fields in F), room environment, notes, manual flag toggle
- Detail page with grouped display (Pressure, Temperature, Environment sections)
- Flagged badge on readings list and detail

**Gaps:**
- [ ] No historical trend charts for plant performance — no chart library integrated
- [ ] No threshold-based auto-flagging — only manual is_flagged checkbox
- [ ] No maintenance scheduling reminders
- [ ] Uses plain forms instead of React Hook Form + Zod

---

### Phase 11: Air Quality — 80%

**What's Done:**
- Readings list with color-coded summary cards (CO, NO2, Humidity, Temperature)
- Threshold-based color coding: CO (>25 ppm = red, >10 ppm = yellow), NO2 (>1 ppm = red, >0.5 ppm = yellow)
- Overall status determined by worst gas reading (alert > warning > normal)
- 5 server actions: getAirQualityReadings, getAirQualityReading, createReading, getThresholdsForModule, getRinks
- NewAirQualityForm.tsx: 4-card form with rink, location, CO ppm, NO2 ppm, temperature F, humidity %, notes, manual flag
- Detail page with status badge, gas levels card, environmental conditions card
- Flagged reading count and indicators

**Gaps:**
- [ ] Thresholds hardcoded in component helper functions — `getThresholdsForModule` action exists but page.tsx doesn't use it for dynamic thresholds
- [ ] No trend charts or historical analysis — no visualization library
- [ ] No automated threshold alert notifications (no integration with Phase 12)
- [ ] Uses plain forms instead of React Hook Form + Zod

---

### Phase 12: Notifications System — 35%

**What's Done:**
- Notifications list page with unread count in page header
- NotificationList.tsx client component with: relative time formatting, type-based color dots, mark-as-read toggles, delete buttons, external link navigation, unread visual indicator
- 7 server actions: getNotifications, markAsRead, markAllAsRead, deleteNotification, getNotificationPreferences, updateNotificationPreference, createNotification
- Database schema with `notifications` and `notification_preferences` tables + RLS

**Gaps:**
- [ ] **Resend email integration**: `resend@6.9.1` installed — **0 imports across entire src/** — no email sending capability
- [ ] **SMS integration**: Not implemented at all
- [ ] **Supabase Realtime**: Not connected — search for `subscribe`, `channel(`, `realtime` yields 0 results in src/
- [ ] Header bell icon is static: `<Bell />` with no badge, no dynamic count, no onClick, no navigation to /notifications
- [ ] `createNotification` utility exists but is **never imported or called** by any other module — notification creation is orphaned
- [ ] No notification preferences UI page (actions exist, no frontend)
- [ ] No admin notification configuration page

---

### Phase 13: Reporting & Export — 30%

**What's Done:**
- Reports list page with quick export cards, archive table with format badges
- Report generation form with: title, type (7 options), format (PDF/CSV/Excel), date range
- 7 server actions: getReportArchives, generateReport, deleteReport, getScheduledReports, createScheduledReport, toggleScheduledReport, deleteScheduledReport
- Scheduled reports support daily/weekly/monthly frequencies with active/inactive toggle

**Gaps:**
- [ ] **jsPDF**: `jspdf@4.1.0` + `jspdf-autotable@5.0.7` installed — **0 imports in src/** — no PDF generation
- [ ] **xlsx**: `xlsx@0.18.5` installed — **0 imports in src/** — no Excel generation
- [ ] **CSV**: No CSV generation logic anywhere
- [ ] `generateReport` only creates a database archive record — code comment at line 48-49: *"In a real implementation, this would generate the actual file. For now, we create the archive record"*
- [ ] Download button on reports page has **no onClick handler** — clicking does nothing
- [ ] No compliance report templates (health & safety, regulatory)
- [ ] No email delivery of generated reports (requires Resend, also non-functional)
- [ ] Scheduled reports are database entries only — no cron job, serverless function, or trigger to execute them

---

## Cross-Module Issues

### Critical Issues

| # | Issue | Severity | Impact | Affected |
|---|-------|----------|--------|----------|
| 1 | **Ice Operations event_type enum mismatch** | CRITICAL | Runtime INSERT failures — code sends `'resurfacing'` etc. but DB only accepts `'cut','flood','full_resurface','patch'` | Phase 7 |
| 2 | **jsPDF/xlsx/Resend installed but never imported** | CRITICAL | Export and email notification features are 100% non-functional | Phases 12-13 |
| 3 | **React Hook Form barely used** | HIGH | 0 files import react-hook-form; only 4 files use Zod (ice-depth + 2 admin components) | Phases 5-11 |
| 4 | **Zero test files** | HIGH | No Vitest config, no Playwright config, no test files of any kind | All phases |

### Moderate Issues

| # | Issue | Severity | Impact | Affected |
|---|-------|----------|--------|----------|
| 5 | **Modules don't check `module_settings.is_enabled`** | MODERATE | Disabled modules accessible via URL; only admin actions.ts references module_settings | All feature modules |
| 6 | **Dashboard shows placeholder data** | MODERATE | All 4 stat cards show `"--"` — landing page provides no useful information | Phase 4 |
| 7 | **Header notification bell is dead UI** | MODERATE | Static icon — no badge, no handler, no navigation | Phase 4/12 |
| 8 | **Dark mode has only ~10 `dark:` class usages** | MODERATE | Only 6 files use dark: classes — most components may break in dark mode | All phases |
| 9 | **Empty component directories** | MODERATE | `forms/`, `diagrams/`, `scheduling/`, `shared/`, `bluetooth/` all contain only .gitkeep | Phases 5-9 |
| 10 | **No chart/trend visualizations anywhere** | MODERATE | Historical analysis features missing — no chart library integrated | Phases 6, 10, 11 |
| 11 | **createNotification is orphaned** | MODERATE | Utility function exists but zero imports from any other module | Phase 12 |

### Low Priority

| # | Issue | Severity | Impact | Affected |
|---|-------|----------|--------|----------|
| 12 | Missing `.prettierrc` | LOW | Code formatting consistency | Phase 0 |
| 13 | `ice_event_type` uses CHECK instead of enum | LOW | Functional but inconsistent with other 15 enums | Phase 1 |
| 14 | No print-friendly CSS | LOW | Daily reports can't be cleanly printed | Phase 5 |
| 15 | Air quality thresholds hardcoded in components | LOW | Action fetches DB thresholds but UI ignores them | Phase 11 |
| 16 | Some admin actions still use FormData | LOW | `upsertThreshold`, `createTab`, `updateTab` inconsistent with plain-object pattern | Phase 3 |

---

## Recommended Next Actions (Priority Order)

### Tier 1 — Critical Fixes (Do First)

1. **Fix Ice Operations event_type enum mismatch** (Phase 7)
   - Align `ice-operations/actions.ts` event types with DB CHECK constraint
   - Change code types from `'resurfacing','scrape','edge','maintenance'` to `'cut','flood','full_resurface','patch'`
   - Update IceOperationsFilter.tsx dropdown labels to match
   - Update new event form dropdown options
   - **Effort:** ~1 hour

2. **Implement actual PDF/CSV/Excel generation** (Phase 13)
   - Create `lib/export/pdf.ts` using jsPDF with branded MFO templates
   - Create `lib/export/excel.ts` using xlsx with formatted worksheets
   - Create `lib/export/csv.ts` with header + row generation + proper escaping
   - Wire into `generateReport` action to produce actual file content
   - Add API route or server action for file download
   - **Effort:** ~6-8 hours

3. **Implement Resend email integration** (Phase 12)
   - Create `lib/email/resend.ts` client with `RESEND_API_KEY`
   - Create email templates for notifications (alert, approval, assignment)
   - Wire into `createNotification` to send email when email channel enabled
   - Wire into report delivery for scheduled reports
   - **Effort:** ~3-4 hours

### Tier 2 — Core Feature Gaps (High Priority)

4. **Wire up dashboard with live Supabase data** (Phase 4)
   - Replace `"--"` placeholders with actual queries: count reports today, count open incidents, count today's resurfaces, count staff on duty
   - Make dashboard an async server component
   - **Effort:** ~2 hours

5. **Add module enable/disable gating** (Cross-cutting)
   - Fetch `module_settings` in `(app)/layout.tsx` and pass to AppShell
   - Filter Sidebar and MobileNav links based on `is_enabled`
   - Add middleware or layout check that redirects disabled module routes to dashboard
   - Filter AdminTabs based on enabled modules
   - **Effort:** ~3 hours

6. **Implement Supabase Realtime for notifications** (Phase 12)
   - Subscribe to `notifications` table changes in a client-side hook
   - Update Header bell icon with dynamic unread count badge
   - Show real-time toast when new notification arrives
   - **Effort:** ~3-4 hours

7. **Wire createNotification into feature modules** (Phase 12)
   - Call from Daily Reports (on submit/approve/reject)
   - Call from Incidents (on create critical/high severity)
   - Call from Air Quality (on threshold exceeded)
   - Call from Scheduling (on shift assignment, swap request)
   - **Effort:** ~2-3 hours

### Tier 3 — Feature Completions (Medium Priority)

8. **Add React Hook Form + Zod to forms** (Phases 5-11)
   - Priority order: Incidents (most complex), Daily Reports, Ice Operations, Refrigeration, Air Quality
   - Create Zod schemas in `lib/types/` for each module
   - Replace plain `<form>` with RHF `useForm()` + `zodResolver`
   - Already partially done: ice-depth and 2 admin components use Zod
   - **Effort:** ~4-6 hours

9. **Build missing scheduling features** (Phase 8)
   - Schedule detail page (`/scheduling/[id]/page.tsx`)
   - `/scheduling/new/page.tsx` standalone form
   - Calendar view component (consider lightweight alternative to react-big-calendar)
   - Employee availability UI
   - **Effort:** ~6-8 hours

10. **Create SVG diagram components** (Phases 6, 9)
    - `src/components/diagrams/IceRinkDiagram.tsx` for depth zone visualization
    - `src/components/diagrams/BodyDiagram.tsx` for incident injury marking
    - **Effort:** ~4-6 hours

11. **Add trend charts across modules** (Phases 6, 10, 11)
    - Install Recharts or similar lightweight chart library
    - Ice depth history chart over time
    - Refrigeration performance trends (pressure, temperature)
    - Air quality trends with threshold reference lines
    - **Effort:** ~4-6 hours

### Tier 4 — Polish & Quality (Lower Priority)

12. **Expand dark mode coverage** (Cross-cutting)
    - Audit all 30+ components for `dark:` class support
    - Currently only 10 dark: usages across 6 files
    - Add dark variants for cards, tables, forms, badges, modals
    - **Effort:** ~3-4 hours

13. **Add Vitest + Playwright configuration** (Cross-cutting)
    - Configure `vitest.config.ts` for unit/integration tests
    - Configure `playwright.config.ts` for E2E tests
    - Add test files for critical paths (auth, admin CRUD, form submission)
    - **Effort:** ~8-12 hours

14. **Bluetooth caliper integration** (Phase 6)
    - Implement Web Bluetooth API client in `lib/bluetooth/`
    - Feature detection + permission handling
    - Connect to depth caliper device readings
    - **Effort:** ~4-6 hours

15. **Ice makes CRUD UI** (Phase 7)
    - Create form for ice makes (resurface_type: full, half, spot, dry_cut)
    - Add ice makes table/list view
    - Add ice make detail page
    - **Effort:** ~3-4 hours

---

## Build Verification

```
$ npm run build

Route (app)
┌ ○ /                                       (static)
├ ○ /_not-found                             (static)
├ ƒ /admin                                  (dynamic)
├ ƒ /air-quality                            (dynamic)
├ ƒ /air-quality/[id]                       (dynamic)
├ ƒ /air-quality/new                        (dynamic)
├ ƒ /auth/callback                          (dynamic)
├ ƒ /daily-reports                          (dynamic)
├ ƒ /daily-reports/[id]                     (dynamic)
├ ƒ /daily-reports/new                      (dynamic)
├ ƒ /dashboard                              (dynamic)
├ ○ /forgot-password                        (static)
├ ƒ /ice-depth                              (dynamic)
├ ƒ /ice-depth/new                          (dynamic)
├ ƒ /ice-operations                         (dynamic)
├ ƒ /ice-operations/[id]                    (dynamic)
├ ƒ /ice-operations/new                     (dynamic)
├ ƒ /incidents                              (dynamic)
├ ƒ /incidents/[id]                         (dynamic)
├ ƒ /incidents/new                          (dynamic)
├ ○ /login                                  (static)
├ ƒ /notifications                          (dynamic)
├ ƒ /refrigeration                          (dynamic)
├ ƒ /refrigeration/[id]                     (dynamic)
├ ƒ /refrigeration/new                      (dynamic)
├ ƒ /reports                                (dynamic)
├ ƒ /reports/generate                       (dynamic)
├ ○ /reset-password                         (static)
└ ƒ /scheduling                             (dynamic)

29 routes — 5 static, 24 dynamic
Build: SUCCESS (0 errors, 0 warnings)
Compiled in 6.6s
```

---

## Zod & React Hook Form Usage Audit

| Library | Installed Version | Files Using It | Status |
|---------|-------------------|----------------|--------|
| react-hook-form | 7.71.1 | **0 files** | UNUSED |
| @hookform/resolvers | installed | **0 files** | UNUSED |
| zod | 4.3.6 | **4 files** | Partially used |

**Zod usage found in:**
1. `src/app/(app)/ice-depth/actions.ts` — schema validation
2. `src/app/(app)/ice-depth/new/page.tsx` — uses schema
3. `src/app/(app)/admin/components/RinkManager.tsx` — admin validation
4. `src/app/(app)/admin/components/FacilitySettings.tsx` — admin validation

---

## File Inventory Summary

| Category | Count |
|----------|-------|
| Route pages | 29 |
| Server action files | 10 |
| Client components | 15+ |
| Shadcn/ui components | 21 |
| Layout components | 6 |
| Admin components | 9 |
| Database tables | 30 |
| RLS policies | 119 |
| TypeScript types/interfaces | 45 |
| SQL migrations | 2 |
| Test files | 0 |
| Empty directories (with .gitkeep) | 5 |

---

## Risk Assessment for Production

| Risk Level | Count | Description |
|------------|-------|-------------|
| BLOCKER | 1 | Ice Operations event_type mismatch — runtime INSERT failures |
| HIGH | 3 | File generation non-functional, Email non-functional, No form validation |
| MODERATE | 5 | Module gating missing, dashboard placeholder data, no Realtime, dark mode gaps, orphaned notification utility |
| LOW | 5 | Prettier missing, hardcoded thresholds, no charts, no Bluetooth, no tests |

**Minimum viable deployment requires fixing:** Items #1-3 from Tier 1 (event type bug, file generation, email integration) plus #4-5 from Tier 2 (dashboard data, module gating).

---

*Last updated: 2026-02-06 | Audit version 2 (deep codebase inspection with 5 parallel agents)*

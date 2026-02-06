# Phase 5: Daily Reports

## Status
COMPLETED

## Description
Daily operational reporting system for ice rink facilities. Capture and track daily readings, conditions, and operator notes across all operational areas.

## Prerequisites
- Phase 0: Project Scaffold (COMPLETED)
- Phase 1: Database Schema (COMPLETED)
- Phase 2: Auth & RLS (COMPLETED)
- Phase 3: Admin Control Center (COMPLETED)
- Phase 4: Dashboard & Layout (COMPLETED)

## Deliverables
- Daily report creation and submission forms
- Dynamic form fields based on admin-configured tabs/checklists
- Report review and approval workflow
- Historical report browsing and search
- Daily report summary on dashboard
- Print-friendly report view

## Files Created
- `src/app/(app)/daily-reports/page.tsx` — Server component listing reports with status badges, summary cards (Drafts, Pending Review, Approved), mobile card view + desktop table view
- `src/app/(app)/daily-reports/actions.ts` — Server actions:
  - getDailyReports (with status/date filters, profile joins)
  - getDailyReport (single by ID with reviewer info)
  - createDailyReport (with duplicate date check)
  - updateDailyReport (draft-only editing)
  - submitDailyReport (draft → submitted)
  - approveDailyReport (manager+ role check)
  - rejectDailyReport (requires rejection reason)
  - getChecklistItemsForReport (tabs + items + responses)
  - saveChecklistResponse (upsert pattern)
- `src/app/(app)/daily-reports/new/page.tsx` — New report form with date picker
- `src/app/(app)/daily-reports/[id]/page.tsx` — Report detail page with tabs/checklist sections
- `src/app/(app)/daily-reports/[id]/ChecklistSection.tsx` — Dynamic checklist form matching admin-configured items
- `src/app/(app)/daily-reports/[id]/DailyReportActions.tsx` — Submit/approve/reject actions bar

## Implementation Notes
- Reports support full workflow: draft → submitted → approved/rejected
- Checklist forms dynamically generated from admin tab/checklist configuration
- Profile names joined via Supabase foreign key aliases
- Duplicate date detection prevents multiple reports for same day
- Only managers+ can approve/reject submitted reports

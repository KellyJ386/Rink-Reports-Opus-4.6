# Phase 8: Employee Scheduling

## Status
COMPLETED

## Description
Employee scheduling and shift management system. Handle staff assignments, shift rotations, availability, and time tracking for facility operations.

## Prerequisites
- Phase 0: Project Scaffold (COMPLETED)
- Phase 1: Database Schema (COMPLETED)
- Phase 2: Auth & RLS (COMPLETED)
- Phase 3: Admin Control Center (COMPLETED)
- Phase 4: Dashboard & Layout (COMPLETED)

## Deliverables
- Shift schedule creation and management
- Employee availability input
- Drag-and-drop schedule builder
- Shift swap and coverage requests
- Schedule publishing and notifications
- Weekly/monthly schedule views
- Time-off request management

## Files Created
- `src/app/(app)/scheduling/page.tsx` — Server component with tabs (Schedules, Time Off, Shift Swaps), summary cards (Total Schedules, Draft, Pending Time Off, Swap Requests), desktop tables + badge counts on tabs
- `src/app/(app)/scheduling/actions.ts` — Server actions:
  - getSchedules (with status filter)
  - createSchedule (weekly schedule)
  - publishSchedule (draft → published)
  - getTimeOffRequests (with status)
  - createTimeOffRequest
  - approveTimeOffRequest / denyTimeOffRequest
  - getShiftSwapRequests (with status)
  - approveShiftSwap / denyShiftSwap
- `src/app/(app)/scheduling/ScheduleActions.tsx` — Client component with New Schedule dialog + publish action

## Implementation Notes
- Schedule status workflow: draft → published → cancelled
- Time off requests: pending → approved/denied
- Shift swap requests: pending → approved/denied/cancelled
- Pending counts shown as badge indicators on tab triggers
- Week range display formats start-end dates (Mon-Sun)
- Role-based approval: managers+ can approve/deny requests

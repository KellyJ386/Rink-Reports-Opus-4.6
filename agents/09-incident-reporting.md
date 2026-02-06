# Phase 9: Incident Reporting

## Status
COMPLETED

## Description
Incident reporting and tracking system. Capture, document, and follow up on facility incidents including injuries, equipment failures, and safety concerns.

## Prerequisites
- Phase 0: Project Scaffold (COMPLETED)
- Phase 1: Database Schema (COMPLETED)
- Phase 2: Auth & RLS (COMPLETED)
- Phase 3: Admin Control Center (COMPLETED)
- Phase 4: Dashboard & Layout (COMPLETED)

## Deliverables
- Incident report creation form with categorization
- Incident severity classification
- Follow-up action tracking
- Incident history and search
- Compliance-ready incident documentation
- Incident statistics and trend analysis

## Files Created
- `src/app/(app)/incidents/page.tsx` — Server component with summary cards (Total, Open, Investigating, Critical Active), incidents table with severity/status/type badges, color-coded severity badges
- `src/app/(app)/incidents/actions.ts` — Server actions:
  - getIncidents (with severity/status filter, profile joins)
  - getIncident (single by ID with reporter/assignee names)
  - createIncident (auto-generates incident_number)
  - updateIncidentStatus (status transitions)
  - addFollowUp (follow-up action record)
  - getFollowUps (for incident detail)
- `src/app/(app)/incidents/new/page.tsx` — New incident page wrapper
- `src/app/(app)/incidents/new/NewIncidentForm.tsx` — Client form (type, severity, title, description, location, injured party, witnesses, immediate action)
- `src/app/(app)/incidents/[id]/page.tsx` — Incident detail with full info and follow-ups
- `src/app/(app)/incidents/[id]/IncidentDetailActions.tsx` — Status update + add follow-up actions

## Implementation Notes
- Incident types: injury, equipment_failure, safety_hazard, property_damage, near_miss, other
- Severity levels: low (green), medium (yellow), high (orange), critical (red)
- Status workflow: open → investigating → resolved → closed
- Auto-incrementing incident_number for easy reference
- Follow-ups linked to incidents with action_taken, notes, date
- Type and severity badges use brand alert colors

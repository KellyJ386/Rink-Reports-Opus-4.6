# Phase 6: Ice Depth Management

## Status
COMPLETED

## Description
Ice depth tracking and management system. Monitor ice thickness across rink surfaces, track measurements over time, and alert when depths fall outside configured thresholds.

## Prerequisites
- Phase 0: Project Scaffold (COMPLETED)
- Phase 1: Database Schema (COMPLETED)
- Phase 2: Auth & RLS (COMPLETED)
- Phase 3: Admin Control Center (COMPLETED)
- Phase 4: Dashboard & Layout (COMPLETED)

## Deliverables
- Ice depth measurement entry forms
- Rink surface zone mapping
- Depth history charts and trends
- Threshold alerts for too thick/thin ice
- Ice cut and flood tracking
- Measurement scheduling reminders

## Files Created
- `src/app/(app)/ice-depth/page.tsx` — Server component with rink selector, summary cards (Latest Depth, Average Depth, Flagged), measurements table + ice events section, mobile card + desktop table views
- `src/app/(app)/ice-depth/actions.ts` — Server actions:
  - getIceDepthMeasurements (with rink filter, zone/rink/profile joins)
  - getIceEvents (with rink filter, profile joins)
  - getRinksWithZones (rinks + nested zones)
  - createMeasurement (with flagging logic)
- `src/app/(app)/ice-depth/new/page.tsx` — New measurement form (rink, zone, depth, method, notes)
- `src/app/(app)/ice-depth/RinkSelector.tsx` — Client component for filtering by rink via URL search params

## Implementation Notes
- Measurements include rink_name, zone_name, measured_by_name from Supabase joins
- Flagged measurements highlighted with yellow border/background
- RinkSelector uses router.push with search params for server-side filtering
- Supports multiple measurement methods (caliper, drill, manual)
- Ice events section shows cuts, floods, resurfaces, patches with depth changes

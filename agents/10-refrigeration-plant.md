# Phase 10: Refrigeration Plant

## Status
COMPLETED

## Description
Refrigeration plant monitoring and management. Track compressor readings, coolant levels, temperatures, pressures, and maintenance schedules for the ice-making refrigeration system.

## Prerequisites
- Phase 0: Project Scaffold (COMPLETED)
- Phase 1: Database Schema (COMPLETED)
- Phase 2: Auth & RLS (COMPLETED)
- Phase 3: Admin Control Center (COMPLETED)
- Phase 4: Dashboard & Layout (COMPLETED)

## Deliverables
- Refrigeration system reading entry forms
- Compressor status monitoring
- Temperature and pressure logging
- Coolant level tracking
- Equipment maintenance scheduling
- Threshold alerts for abnormal readings
- Historical trend charts for plant performance

## Files Created
- `src/app/(app)/refrigeration/page.tsx` — Server component with summary cards (Latest Suction PSI, Discharge PSI, Condenser Temp, Slab Temp), readings table with flagged indicator, equipment filter
- `src/app/(app)/refrigeration/actions.ts` — Server actions:
  - getRefrigerationReadings (ordered by event_time desc, equipment joins)
  - createReading (full compressor/condenser/brine/slab reading)
  - getMaintenanceRecords (equipment maintenance history)
  - createMaintenanceRecord (maintenance event with parts/cost)
  - getEquipment (compressor/pump equipment list)
- `src/app/(app)/refrigeration/new/page.tsx` — New reading page wrapper
- `src/app/(app)/refrigeration/new/NewReadingForm.tsx` — Client form with fields:
  - Equipment selector
  - Suction/discharge pressure (PSI)
  - Suction/discharge temperature (F)
  - Oil pressure (PSI) and temperature (F)
  - Condenser pressure (PSI) and temperature (F)
  - Brine supply/return temperatures (F)
  - Slab temperature (F), room temp, room humidity
  - Flagged checkbox, notes
- `src/app/(app)/refrigeration/[id]/page.tsx` — Reading detail page with all values displayed

## Implementation Notes
- All pressure values in PSI, temperatures in Fahrenheit
- Flagged readings highlighted for follow-up
- Equipment dropdown filtered to compressor/pump types from admin config
- Summary cards show latest values from most recent reading
- Supports both compressor readings and maintenance records

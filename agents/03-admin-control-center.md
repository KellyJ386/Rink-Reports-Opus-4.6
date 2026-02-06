# Phase 3: Admin Control Center

## Status
COMPLETED

## Description
Full admin system: facility settings, user management, module config, equipment setup, thresholds, tab/checklist builder. This is a priority phase that enables administrators to configure the entire application.

## Prerequisites
- Phase 0: Project Scaffold (COMPLETED)
- Phase 1: Database Schema (COMPLETED)
- Phase 2: Auth & RLS (COMPLETED)

## Deliverables
- Facility settings management (name, address, timezone, branding)
- User management (invite, edit roles, deactivate)
- Module configuration (enable/disable feature modules)
- Equipment setup and registration
- Threshold configuration for alerts and warnings
- Dynamic tab builder for report customization
- Checklist builder for operational procedures
- Admin-only route protection

## Files Created
- `src/app/(app)/admin/page.tsx` — Admin page (server component), role check, parallel data fetching
- `src/app/(app)/admin/actions.ts` — 1700+ line server actions file:
  - getAuthenticatedAdmin helper
  - Facility: getFacility, updateFacility
  - Users: getUsers, inviteUser, updateUser, updateUserRole, deactivateUser, toggleUserActive
  - Modules: getModuleSettings, toggleModule, updateModuleSetting
  - Equipment: getEquipment, createEquipment, updateEquipment, deleteEquipment
  - Thresholds: getThresholds, upsertThreshold, createThreshold, updateThreshold, deleteThreshold
  - Tabs: getTabConfigurations, createTab, createTabConfiguration, updateTab, updateTabConfiguration, deleteTab, deleteTabConfiguration
  - Checklists: getChecklistItems, createChecklistItem, updateChecklistItem, deleteChecklistItem
  - Shifts: getShiftTypes, createShiftType, updateShiftType, deleteShiftType
  - Rinks: getRinks, createRink, updateRink, deleteRink, getRinkZones, createRinkZone, updateRinkZone, deleteRinkZone
- `src/app/(app)/admin/components/AdminTabs.tsx` — Tab navigation across 8 admin sections
- `src/app/(app)/admin/components/FacilitySettings.tsx` — Facility form (name, address, timezone, etc.)
- `src/app/(app)/admin/components/UserManagement.tsx` — User list with invite/edit/deactivate dialogs
- `src/app/(app)/admin/components/ModuleSettings.tsx` — Module enable/disable switches with icons
- `src/app/(app)/admin/components/EquipmentManager.tsx` — Equipment CRUD with type/status/maintenance
- `src/app/(app)/admin/components/ThresholdSettings.tsx` — Threshold config per module/metric
- `src/app/(app)/admin/components/TabBuilder.tsx` — Dynamic tab + checklist item builder
- `src/app/(app)/admin/components/ShiftTypeManager.tsx` — Shift type CRUD with color picker
- `src/app/(app)/admin/components/RinkManager.tsx` — Rink + zone management with nested CRUD

## Implementation Notes
- Actions use `getAuthenticatedAdmin()` helper — gets facility_id from session, NOT passed as param
- Components pass plain objects (NOT FormData) to server actions
- All components use optimistic local state updates + toast notifications
- Admin access restricted to facility_admin and super_admin roles
- Supabase joins return nested objects named after the table (e.g. `rink_zones`)

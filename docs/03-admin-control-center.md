# Agent 03: Admin Control Center ⭐ PRIORITY

## Objective
Build the complete Admin Control Center. This is the FOUNDATION that all other modules depend on. Every configurable option, every dropdown list, every threshold setting, every tab definition comes from here. This must be bulletproof.

## Prerequisites
- Agents 00-02 completed
- RLS policies active (admin-only access to config tables)

## Reference
- PRD Section 7.9 (Admin Control Center)
- PRD Section 4 (User Roles & Permissions)
- CLAUDE.md: Admin Configuration Pattern

---

## Architecture

The Admin Control Center lives at `/admin` and contains 8 sections, each as a sub-route:

```
/admin                    → Admin dashboard/navigation
/admin/facility           → Facility Settings
/admin/rinks              → Rink Configuration
/admin/users              → User Management
/admin/modules            → Module Settings (enable/disable + tab config)
/admin/checklists         → Checklist Builder
/admin/equipment          → Equipment Setup (machines, compressors, pumps)
/admin/thresholds         → Threshold Configuration
/admin/data-retention     → Data Retention Settings
```

---

## Tasks

### 1. Admin Layout & Navigation
**File:** `src/app/(app)/admin/layout.tsx`

- Admin-only route guard: check role is `facility_admin` or `super_admin`, redirect others to /dashboard with toast
- Left sidebar (desktop) / tab bar (mobile) with links to all 8 admin sections
- Each section shows as a card/button with icon and description
- Breadcrumb: Dashboard > Admin > [Section Name]

**Admin Dashboard** (`/admin/page.tsx`):
- Grid of 8 cards (similar to main dashboard pattern)
- Each card: Icon + Section Name + Brief description
- 2 columns mobile, 3-4 columns desktop

### 2. Facility Settings
**Route:** `/admin/facility`
**Tables:** `facilities`, `operating_hours`

Form fields:
- Facility Name (text input, required)
- Address (text area)
- Time Zone (dropdown — list of US/Canada time zones)
- Seasonal Operation (toggle switch)
- Open Months (multi-select checkboxes, visible when seasonal is ON)
- Facility Logo Upload (file input → Supabase Storage → save URL to `facilities.logo_url`)
- Session Duration Hours (number input, 1-24, default 12)

Operating Hours sub-section:
- 7 rows (Mon-Sun), each with:
  - Day label
  - "Closed" toggle
  - Open Time picker (disabled if closed)
  - Close Time picker (disabled if closed)

Save button at bottom. Toast on success/error.

### 3. Rink Configuration
**Route:** `/admin/rinks`
**Tables:** `rinks`, `ice_depth_points`, `ice_depth_thresholds`

**Rink List View:**
- Table/list of configured rinks with: Name, Dimensions, # Measurement Points, Status
- "Add Rink" button → modal
- Edit/Deactivate actions per row

**Add/Edit Rink Modal:**
- Rink Name (text input)
- Length (number, default 200)
- Width (number, default 85)
- Sort Order (number)

**Ice Depth Diagram Setup:**
- When user clicks "Configure Points" on a rink:
- Display the rink diagram SVG (scaled to configured dimensions)
- **Point Placement Mode:** User taps/clicks on the diagram to place numbered points
- Each click creates a new point with auto-incrementing number
- Points display as numbered circles on the diagram
- Points are draggable to adjust position
- Delete point: click point → confirm delete
- Save positions (stored as x_percent, y_percent in `ice_depth_points`)

**Ice Depth Thresholds:**
- Green range: min and max (default 1.00" - 1.74")
- Yellow range: min and max (default 1.75" - 3.50")
- Red range: min and max (default 0.00" - 0.99")
- Applied facility-wide (stored in `ice_depth_thresholds`)

### 4. User Management
**Route:** `/admin/users`
**Tables:** `profiles` (via Supabase Auth admin API)

**User List View:**
- Table with columns: Name, Email, Role, Last Active, Status (Active/Inactive)
- Search/filter by name, email, role
- Sort by any column

**Invite User Modal:**
- Email (text input, required)
- Full Name (text input, required)
- Role (dropdown: facility_admin, manager, supervisor, staff, read_only)
- Send Invitation button → calls `inviteUser` server action from Agent 02
- Shows success/error message

**Edit User:**
- Click user row → edit modal or inline
- Change role (dropdown)
- Deactivate/Reactivate toggle
- Note: No password reset from admin — user uses forgot password flow

### 5. Module Settings
**Route:** `/admin/modules`
**Tables:** `module_settings`

Display all 8 modules (excluding admin itself) as cards/rows:
- Module Name
- Enabled/Disabled toggle
- Role Access: multi-select checkboxes for which roles can access

When a module is disabled:
- Its dashboard button is hidden
- Its routes return redirect to dashboard
- Its data is preserved (not deleted)

### 6. Daily Reports Tab Configuration
**Route:** `/admin/modules/daily-reports` (or sub-section of modules page)
**Tables:** `daily_report_tabs`

**Tab List:**
- Sortable list of all tabs (drag to reorder)
- Each shows: Name, # Checklist Items, Active/Inactive
- "Add Tab" button → inline form or modal
- Edit name, toggle active, delete (with confirmation)
- Maximum 30 tabs enforced

**Per Tab:**
- Click tab → navigate to checklist builder for that tab

### 7. Checklist Builder
**Route:** `/admin/checklists/[tabId]`
**Tables:** `checklist_items`

Three sub-tabs: Opening | Closing | Daily Operations

For each checklist type:
- List of items (sortable via drag)
- Each item shows: Item text, Recurrence badge, Active/Inactive
- "Add Item" → inline text input + recurrence dropdown (daily/weekly/monthly/seasonal)
- Edit item text inline
- Toggle active/inactive
- Delete with confirmation
- Reorder via drag and drop

### 8. Equipment Setup
**Route:** `/admin/equipment`
**Tables:** `machines`, `equipment`, `circle_check_items`, `equipment_reading_types`

Three sections with tabs or accordion:

**A. Machines (Zambonis/Resurfacers):**
- List with: Name, Fuel Type, Status
- "Add Machine" modal: Name, Fuel Type (Gas/Electric)
- Per machine: "Configure Circle Check" button → opens circle check item editor
  - Sortable list of inspection items
  - Add/edit/delete/reorder items
  - Default 30+ items for new machines (pre-populate from seed)

**B. Refrigeration Equipment:**
- List with: Name, Type, # Reading Types, Status
- "Add Equipment" modal: Name, Equipment Type (compressor/pump/condenser/custom)
- Per equipment: "Configure Readings" button → opens reading type editor
  - List of reading types: Name, Unit, Min Threshold, Max Threshold
  - Add/edit/delete
  - Special toggle: "Is Oil Level Check" (changes input to OK/Low/Add dropdown)

**C. Shift Types** (for Scheduling module):
- List with: Name, Color, Status
- "Add Shift Type" modal: Name, Color picker
- Edit/deactivate

### 9. Threshold Configuration
**Route:** `/admin/thresholds`
**Tables:** `ice_depth_thresholds`, `equipment_reading_types`, `air_quality_metrics`

Consolidated view of all alert thresholds across modules:

**Ice Depth Thresholds:**
- Green/Yellow/Red ranges (same as rink config, but accessible here too)

**Refrigeration Thresholds:**
- List of all equipment reading types with their min/max values
- Edit inline

**Air Quality Thresholds:**
- List of all metrics with min/max values
- Edit inline

### 10. Data Retention Settings
**Route:** `/admin/data-retention`
**Tables:** `facilities`

Simple form:
- Standard Data Retention: number input (years, default 3)
- Incident Data Retention: number input (years, default 7)
- Archive Mode: toggle (for seasonal facilities)
- When Archive Mode is ON: show explanation text about data preservation during closure

### 11. Incident Location Configuration
**Route:** sub-section of `/admin/modules` or standalone
**Tables:** `incident_locations`

- Sortable list of location options for incident report dropdown
- Add/edit/delete/reorder

### 12. Air Quality Configuration
**Route:** sub-section of `/admin/modules` or standalone
**Tables:** `air_quality_metrics`, `air_quality_locations`

**Metrics:**
- List: Name, Unit, Min Threshold, Max Threshold
- Add/edit/delete
- Defaults: CO (PPM), CO2 (PPM), NO2 (PPM), Humidity (%), Temperature (°F)

**Reading Locations:**
- List: Name, Sort Order
- Add/edit/delete
- Defaults: Ice Level, Stands, Lobby

---

## Server Actions Pattern

Every admin form should follow this pattern:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const FacilitySettingsSchema = z.object({
  name: z.string().min(1, 'Facility name is required'),
  address: z.string().optional(),
  time_zone: z.string(),
  // ... etc
})

export async function updateFacilitySettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const parsed = FacilitySettingsSchema.safeParse({
    name: formData.get('name'),
    // ... etc
  })

  if (!parsed.success) return { success: false, error: parsed.error.flatten() }

  const { error } = await supabase
    .from('facilities')
    .update(parsed.data)
    .eq('id', /* facility_id from user profile */)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/facility')
  return { success: true }
}
```

---

## UI Requirements

- All admin forms use Shadcn components (Input, Select, Switch, Dialog, Table)
- Sortable lists use drag-and-drop (use `@dnd-kit/core` or similar)
- All destructive actions (delete) require confirmation dialog
- Toast notifications on all save/error events
- Responsive: forms stack on mobile, tables scroll horizontally
- Touch-friendly: all interactive elements meet 48x48px minimum

## Completion Criteria
- [ ] Admin dashboard displays all 8 sections
- [ ] Non-admin users are redirected away from /admin
- [ ] Facility settings save and load correctly
- [ ] Operating hours save per day of week
- [ ] Rinks can be created, edited, deactivated
- [ ] Ice depth points can be placed on rink diagram via click
- [ ] Ice depth points are draggable and deletable
- [ ] Ice depth thresholds save correctly
- [ ] Users can be invited via email with role assignment
- [ ] User roles can be changed
- [ ] Modules can be enabled/disabled
- [ ] Module role access can be configured
- [ ] Daily Report tabs can be added (up to 30), renamed, reordered, deactivated
- [ ] Checklist items can be added per tab per checklist type with recurrence
- [ ] Machines can be added with fuel type
- [ ] Circle check items configurable per machine (add/edit/delete/reorder)
- [ ] Refrigeration equipment configurable with custom reading types and thresholds
- [ ] Shift types configurable with colors
- [ ] Incident locations configurable
- [ ] Air quality metrics and locations configurable
- [ ] Data retention settings save correctly
- [ ] All thresholds viewable in consolidated threshold screen
- [ ] All admin forms validate with Zod
- [ ] All admin forms show toast on success/error
- [ ] All destructive actions require confirmation
- [ ] Dark mode works on all admin screens
- [ ] Mobile responsive on all admin screens

# Agent 09: Incident Reporting

## Objective
Build the Incident Reporting module with incident/accident forms, interactive body diagram for injury marking, and report history.

## Prerequisites
- Agents 00-04 completed
- Incident locations configured in Admin (Agent 03)

## Reference
- PRD Section 7.6 (Incident Reporting)

---

## Routes
```
/incidents              → Report history list
/incidents/new          → New incident/accident form
/incidents/[id]         → Report detail view
```

## Tasks

### 1. New Report Form
**Route:** `/incidents/new`

**Form Fields:**
- **Incident Type** (dropdown: Incident / Accident)
  - When "Accident" selected: show additional injury fields (injured party name, type, body diagram)
- **Date and Time** (date/time picker, defaults to now, editable)
- **Location** (dropdown from `incident_locations` + "Other" option with free text field)
- **Description** (multi-line text area, required)
- **Injured Party Name** (text input — visible only when type = Accident)
- **Injured Party Type** (dropdown: Patron / Staff — visible only when type = Accident)
- **Body Diagram** (interactive — visible only when type = Accident)
- **Witnesses** (text field for names)

**Auto-filled:**
- Submitted By (current user)
- Timestamp (auto)

**On Submit:**
- Insert into `incident_reports` with all fields
- `body_diagram_regions`: array of selected body region IDs
- Create `active_alerts` entry for module `incidents` (triggers dashboard badge)
- Send notification to managers (configurable)
- Toast success, redirect to report detail view

### 2. Interactive Body Diagram Component
**File:** `src/components/diagrams/BodyDiagram.tsx`

**Design:**
- SVG human figure with front and back views displayed side-by-side
- Clean, professional medical-style illustration
- Light grey body outline on white background (dark mode: light outline on dark)

**Tappable Regions (as defined in PRD):**
Each region is an SVG path/area that can be tapped:

Front view regions:
- Head, Face, Neck
- Left/Right Shoulder
- Left/Right Upper Arm
- Left/Right Elbow
- Left/Right Forearm
- Left/Right Wrist
- Left/Right Hand
- Chest, Abdomen
- Hip/Pelvis
- Left/Right Upper Leg (Thigh)
- Left/Right Knee
- Left/Right Lower Leg (Shin)
- Left/Right Ankle
- Left/Right Foot

Back view regions:
- Head (back), Neck (back)
- Upper Back, Lower Back
- (Shoulders, arms, legs same as front — shared IDs)

**Interaction:**
- Tap a region → region fills with red (Alert Red #D32F2F) with slight transparency
- Tap again → deselects (region returns to normal)
- Multiple regions can be selected simultaneously
- Selected regions stored as string array: `['head_front', 'left_knee', 'lower_back']`

**Props:**
```typescript
interface BodyDiagramProps {
  selectedRegions: string[];
  onRegionToggle: (regionId: string) => void;
  readOnly?: boolean; // for detail view — shows marks but not interactive
}
```

**Clear Button:** "Clear All" button below diagram to reset all selections

### 3. Body Region Constants
**File:** `src/lib/constants/bodyRegions.ts`

```typescript
export const BODY_REGIONS = [
  { id: 'head_front', label: 'Head (Front)', view: 'front' },
  { id: 'face', label: 'Face', view: 'front' },
  { id: 'neck_front', label: 'Neck', view: 'front' },
  { id: 'left_shoulder', label: 'Left Shoulder', view: 'both' },
  { id: 'right_shoulder', label: 'Right Shoulder', view: 'both' },
  // ... all regions from PRD
  { id: 'head_back', label: 'Head (Back)', view: 'back' },
  { id: 'upper_back', label: 'Upper Back', view: 'back' },
  { id: 'lower_back', label: 'Lower Back', view: 'back' },
  // ... etc
] as const;
```

### 4. Report History List
**Route:** `/incidents/page.tsx`

**List View:**
- Chronological list of all incidents/accidents (newest first)
- Each row shows: Date/Time, Type (Incident/Accident badge), Location, Description (truncated), Submitted By
- Type badges: "Incident" in Alert Yellow, "Accident" in Alert Red

**Filters:**
- Date range picker
- Type filter (All / Incident / Accident)
- Location dropdown

**Search:**
- Free text search across description and injured party name

**"New Report" Button:** prominent button at top → navigates to `/incidents/new`

### 5. Report Detail View
**Route:** `/incidents/[id]/page.tsx`

Display all report fields in a clean, readable layout:
- Report header with type badge and date
- All form fields displayed as labeled values
- Body diagram (read-only mode) showing marked injury regions in red
- Selected body regions also listed as text below diagram
- Submitted By and timestamp at bottom

## Server Actions
```typescript
export async function createIncidentReport(data: IncidentReportInput)
export async function getIncidentReports(filters: IncidentFilters)
export async function getIncidentReport(id: string)
```

## Completion Criteria
- [ ] New report form renders with all fields
- [ ] Incident type toggle shows/hides accident-specific fields
- [ ] Location dropdown populated from admin config with "Other" free text option
- [ ] Body diagram SVG renders front and back views
- [ ] All body regions are tappable and highlight in red when selected
- [ ] Multiple regions can be selected simultaneously
- [ ] Clear All button resets body diagram
- [ ] Body regions stored as string array in database
- [ ] Report saves correctly to database
- [ ] Dashboard alert badge updates on new incident
- [ ] Report history list displays with correct type badges
- [ ] Filters (date range, type, location) work correctly
- [ ] Free text search works
- [ ] Detail view shows all data including body diagram in read-only mode
- [ ] Mobile responsive (body diagram scales, form full-width)
- [ ] Dark mode supported

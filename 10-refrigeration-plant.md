# Agent 10: Refrigeration Plant Logs

## Objective
Build the Refrigeration Plant Logs module for tracking equipment readings with admin-configurable fields and alert thresholds.

## Prerequisites
- Agents 00-04 completed
- Equipment, reading types, and thresholds configured in Admin (Agent 03)

## Reference
- PRD Section 7.7 (Refrigeration Plant Logs)

---

## Routes
```
/refrigeration              → Equipment list with status
/refrigeration/[equipmentId] → Reading entry form
/refrigeration/history       → Reading history
```

## Tasks

### 1. Equipment List View
**Route:** `/refrigeration/page.tsx`

- List all configured equipment from `equipment` table (for user's facility)
- Each equipment card/row shows:
  - Equipment name
  - Equipment type badge (compressor, pump, condenser)
  - Last reading time ("2 hours ago" or "No readings yet")
  - Status indicator:
    - Green dot: last reading all within range
    - Red dot: last reading had out-of-range values
    - Grey dot: no readings yet
- Tap equipment → navigate to reading entry form

### 2. Reading Entry Form
**Route:** `/refrigeration/[equipmentId]/page.tsx`

**Header:** Equipment name and type

**Dynamic Form Fields:**
- Fetch `equipment_reading_types` for this equipment
- For each reading type, render appropriate input:
  - **Numeric readings:** Number input with unit label (e.g., "PSI", "°F")
  - **Oil level checks** (where `is_oil_level = true`): Dropdown with OK / Low / Add options

**Out-of-Range Warning:**
- As user enters a value, compare against min/max thresholds from `equipment_reading_types`
- If out of range:
  - Input field border turns Alert Red
  - Warning message appears below field: "⚠️ [Reading Name] is outside normal range ([min] - [max] [unit])"
  - Submission still allowed (it's a warning, not a block)

**Timestamp:** Auto-filled, editable
**Notes:** Optional text field

**On Submit:**
1. Create `refrigeration_readings` record
2. Create `refrigeration_reading_values` for each reading type entered
3. The database trigger (`check_refrig_out_of_range`) automatically sets `is_out_of_range`
4. If any values are out of range:
   - Create `active_alerts` entry (module: refrigeration)
   - Send notification to configured recipients
5. Toast success, option to enter next equipment or return to list

### 3. Reading History
**Route:** `/refrigeration/history`

**Table View:**
- Filterable by: Equipment, Date range
- Columns: Date/Time, Equipment, Recorded By, then one column per reading type with value
- Out-of-range values highlighted in red
- Sort by date (newest first)

**Per-Equipment History:**
- Also accessible from equipment list ("View History" action)
- Shows trend of readings over time for that specific equipment
- Optional: simple line chart showing readings over last 30 days (use Recharts or defer)

### 4. Alert Resolution
- When a new reading for the same equipment comes in within range, auto-resolve the active alert
- Or: manager can acknowledge alert from notifications/dashboard

## Completion Criteria
- [ ] Equipment list shows all admin-configured equipment
- [ ] Status indicators reflect latest reading status
- [ ] Reading form dynamically generates fields from admin config
- [ ] Numeric inputs show correct units
- [ ] Oil level inputs show OK/Low/Add dropdown
- [ ] Out-of-range warnings display in real-time as values are entered
- [ ] Readings save correctly to database with all values
- [ ] Database trigger correctly flags out-of-range values
- [ ] Dashboard alert badge updates on out-of-range reading
- [ ] Notifications sent for out-of-range readings
- [ ] History view shows readings with out-of-range highlighting
- [ ] Filters work on history view
- [ ] Mobile responsive
- [ ] Dark mode supported

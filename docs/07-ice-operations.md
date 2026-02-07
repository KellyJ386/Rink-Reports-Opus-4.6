# Agent 07: Ice Operations

## Objective
Build the Ice Operations module with four sub-tabs: Ice Makes, Blade Changes, Edging, and Circle Checks.

## Prerequisites
- Agents 00-04 completed
- Machines and circle check items configured in Admin (Agent 03)

## Reference
- PRD Section 7.4 (Ice Operations)

---

## Routes
```
/ice-operations              → Tab bar with 4 tabs (default to Ice Makes)
/ice-operations/ice-makes    → Ice Makes form + log
/ice-operations/blade-change → Blade Change form + log
/ice-operations/edging       → Edging form + log
/ice-operations/circle-check → Circle Check form
```

## Tasks

### 1. Tab Navigation
- Horizontal tab bar at top: Ice Makes | Blade Change | Edging | Circle Check
- Active tab highlighted with Action Green underline
- Persistent across sub-routes

### 2. Ice Makes Tab
**Form Fields:**
- Timestamp (date/time picker, defaults to now, editable)
- Rink (dropdown from `rinks` table)
- Machine (dropdown from `machines` table)
- Machine Hours (number input)
- Ice Taken (number input with decimal — measurement of ice shaved)
- Water Used (number input — gallons)
- Notes (optional text area)

**Auto-filled (not editable):**
- Facility (from session)
- Operator (current user's name)

**On Submit:**
- Insert into `ice_makes` table
- Toast success
- Clear form for next entry
- Show in log below

**Log View (below form or toggle):**
- List of today's ice makes (expandable to date range)
- Each entry: Time, Rink, Machine, Operator, Hours, Ice Taken, Water
- Most recent first

### 3. Blade Change Tab
**Form Fields:**
- Timestamp (date/time, defaults to now)
- Machine (dropdown from `machines`)
- Notes (optional)

Auto-filled: Facility, Operator

**On Submit:** Insert into `blade_changes`, toast, clear form.

**Log View:** Today's blade changes below form.

### 4. Edging Tab
**Form Fields:**
- Timestamp (date/time, defaults to now)
- Rink (dropdown from `rinks`)
- Notes (optional)

Auto-filled: Facility, Operator

**On Submit:** Insert into `edging_logs`, toast, clear form.

**Log View:** Today's edging logs below form.

### 5. Circle Check Tab
**Flow:**
1. Machine Selector: Dropdown to select which machine
2. On selection: load circle check items from `circle_check_items` for that machine
3. Display fuel type badge (Gas/Electric) based on machine config

**Checklist Display:**
- List of all inspection items for selected machine
- Each item: Checkbox + Item text
- Default state: all unchecked
- When checked: item passes (green checkmark)
- When left unchecked: item fails — a notes text field appears below that item for the operator to describe the issue (required)

**Submit:**
- Create `circle_checks` record (machine_id, operator_id, event_time)
- Create `circle_check_results` for each item (passed: true/false, fail_notes if failed)
- Validation: if any item is unchecked (failed), its notes field must not be empty
- Toast success, reset form

**Log View:** Recent circle checks with pass/fail summary.

### 6. Shared Components

**OperationsForm** — reusable form wrapper:
```typescript
// Handles: auto-fill operator/facility, timestamp default, Zod validation, submit pattern
```

**OperationsLog** — reusable log list:
```typescript
// Handles: fetch today's entries, date range expansion, table display
```

## Completion Criteria
- [ ] Four-tab navigation works correctly
- [ ] Ice Makes form submits with all fields to database
- [ ] Rink and Machine dropdowns populate from admin config
- [ ] Auto-filled fields (operator, facility) display correctly
- [ ] Blade Change form works
- [ ] Edging form works
- [ ] Circle Check loads correct items per machine
- [ ] Fuel type badge displays correctly
- [ ] Failed circle check items show notes field
- [ ] Failed items require notes before submit
- [ ] Logs show today's entries below each form
- [ ] Forms clear after successful submission
- [ ] Toast notifications on success/error
- [ ] Mobile responsive (forms full-width, large inputs)
- [ ] Dark mode supported

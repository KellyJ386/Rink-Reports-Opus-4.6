# Agent 05: Daily Reports Module

## Objective
Build the Daily Reports module with customizable tabs (from Admin config), three checklist types per tab (Opening, Closing, Daily Operations), and checklist completion tracking.

## Prerequisites
- Agents 00-04 completed
- Admin has configured tabs and checklist items (via Agent 03)

## Reference
- PRD Section 7.2 (Daily Reports)

---

## Routes
```
/daily-reports                → Tab selection view
/daily-reports/[tabId]        → Checklist type selector (Opening/Closing/Daily Ops)
/daily-reports/[tabId]/[type] → Checklist view
```

## Tasks

### 1. Tab Selection View
**Route:** `/daily-reports/page.tsx`

- Fetch all active `daily_report_tabs` for user's facility, ordered by `sort_order`
- Display as:
  - Desktop: Horizontal scrollable tab bar at top
  - Mobile: Grid of tab buttons (2 columns)
- Each tab shows:
  - Tab name
  - Completion indicator: green checkmark if ALL checklist items for today are complete across all 3 types
  - Partial indicator: yellow dot if some items complete
  - Empty indicator: grey dot if no items complete today

### 2. Checklist Type Selector
**Route:** `/daily-reports/[tabId]/page.tsx`

When user taps a tab, show three options:
- Opening
- Closing
- Daily Operations

Display as three large buttons (same style as dashboard) with:
- Checklist type name
- Completion count: "5/8 complete" for today
- Checkmark if all items done

### 3. Checklist View
**Route:** `/daily-reports/[tabId]/[type]/page.tsx`

**Header:** "[Tab Name] - [Checklist Type]" (e.g., "Front Desk - Opening")

**Date Selector:**
- Defaults to today
- Date picker to select past dates (view/edit)
- Cannot select future dates

**Checklist Items:**
- Fetch from `checklist_items` where `tab_id` matches and `checklist_type` matches
- Filter by recurrence: only show items whose recurrence matches today's cycle
  - Daily: always show
  - Weekly: show on configured day (or always, let admin decide)
  - Monthly: show on 1st of month
  - Seasonal: show during configured months
- For each item, fetch completion status from `checklist_completions` for selected date

**Each Checklist Item Row:**
- Checkbox (left)
- Item text
- When checked: show timestamp and username on right side
- When unchecked: show empty state

**Checkbox Behavior:**
- Tap checkbox → immediately save to `checklist_completions`:
  - `checklist_item_id`, `facility_id`, `completed_date`, `is_completed: true`
  - `completed_by: auth.uid()`, `completed_at: now()`
- Tap again to uncheck → update record: `is_completed: false`, new timestamp
- No need to press a Save button — each checkbox is an instant save (optimistic UI)

**Notes Field:**
- Optional text area at bottom of checklist
- Save with its own save button (or auto-save on blur)
- Store as a note associated with the tab + date + checklist type (may need a `daily_report_notes` table — create if needed)

### 4. Daily Report Notes Table (if needed)
If not already in schema, create migration:

```sql
CREATE TABLE daily_report_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  tab_id UUID NOT NULL REFERENCES daily_report_tabs(id) ON DELETE CASCADE,
  checklist_type checklist_type NOT NULL,
  note_date DATE NOT NULL,
  notes TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tab_id, checklist_type, note_date)
);
```

### 5. Recurrence Logic
```typescript
// src/lib/utils/recurrence.ts

function shouldShowItem(item: ChecklistItem, date: Date): boolean {
  switch (item.recurrence) {
    case 'daily': return true;
    case 'weekly': return date.getDay() === /* configured day */;
    case 'monthly': return date.getDate() === 1;
    case 'seasonal': return /* check if month is in facility open_months */;
  }
}
```

### 6. Completion Summary Query
For the tab selection view, create a server-side function that returns completion stats per tab for today:

```typescript
// For each tab: { tabId, total, completed, percentage }
```

## Completion Criteria
- [ ] Tab selection view shows all admin-configured tabs
- [ ] Completion indicators update in real-time as items are checked
- [ ] Three checklist types accessible per tab
- [ ] Checklist items load from admin configuration
- [ ] Checkbox taps save immediately (optimistic UI)
- [ ] Timestamp and username display when item is checked
- [ ] Items can be unchecked (records new timestamp)
- [ ] Date selector allows viewing/editing past dates
- [ ] Notes field saves per tab/type/date
- [ ] Recurrence filtering works correctly
- [ ] Mobile responsive (full-width checklist items, large touch targets)
- [ ] Dark mode supported
- [ ] Items load even when no completions exist yet (empty state)

# Agent 08: Employee Scheduling

## Objective
Build a full-featured employee scheduling system with calendar views, availability submission, shift assignment, shift swaps, and open shift broadcasting.

## Prerequisites
- Agents 00-04 completed
- Shift types configured in Admin (Agent 03)
- User profiles exist with roles

## Reference
- PRD Section 7.5 (Employee Scheduling)

---

## Routes
```
/scheduling                  → Calendar view (default: week)
/scheduling/availability     → Employee availability submission
/scheduling/swaps            → Shift swap requests (manager queue)
/scheduling/open-shifts      → Open shifts list
```

## Tasks

### 1. Calendar Views

**View Toggle:** Day | Week | Month buttons at top of page

#### Week View (Default — Desktop)
- Grid layout: columns = days (Mon-Sun for selected week), rows = employees OR positions
- Toggle: "By Employee" / "By Position" view switch
- **By Employee:** Each row is an employee name, cells show their shift blocks
- **By Position:** Each row is a shift type, cells show assigned employees
- Shift blocks: colored rectangles matching shift type color, showing time range and employee name
- Navigation: Previous/Next week arrows, "Today" button
- Click empty cell → Create Shift modal (pre-filled with date)
- Click shift block → Edit/details popup

#### Day View (Default — Mobile)
- Timeline view: vertical time axis (6am-midnight or facility hours)
- All shifts for selected day displayed as colored blocks
- Grouped by employee or position
- Navigation: Previous/Next day arrows, date picker
- Tap shift → Edit/details

#### Month View
- Traditional calendar grid
- Each day cell shows: shift count, open shift count (if any)
- Tap day → expands to day view
- Color indicators for days with open shifts

### 2. Shift Block Component
**File:** `src/components/scheduling/ShiftBlock.tsx`

```typescript
interface ShiftBlockProps {
  shift: Shift;
  shiftType: ShiftType;  // for color
  employee?: Profile;     // null if open shift
  compact?: boolean;      // for month view
  onClick: () => void;
}
```

- Background color from shift type
- Shows: time range, employee name (or "OPEN" if unassigned)
- Visual distinction for open/broadcast shifts (dashed border or pulsing)
- Draggable on desktop (for reassignment between employees)

### 3. Create Shift Modal
**Trigger:** "Add Shift" button or click empty calendar cell

**Fields:**
- Date (pre-filled from clicked cell or date picker)
- Start Time (time picker)
- End Time (time picker)
- Position/Shift Type (dropdown from `shift_types`)
- Assign To (dropdown of employees — filtered to show only those available on this date/time)
  - Show availability status next to each name: ✅ Available, ⚠️ No availability submitted, ❌ Not available
- Leave Unassigned (checkbox — creates open shift)
- Notes (optional)

**On Submit:**
- Insert into `shifts` table
- If unassigned: set `is_open: true`
- Toast success, refresh calendar

### 4. Employee Availability Submission
**Route:** `/scheduling/availability`
**Access:** All roles (staff submit their own)

**Interface:**
- Calendar view (week or month)
- Click/tap date → add availability block
- For each block: Start Time, End Time
- Recurring toggle: "Repeat weekly" → sets `is_recurring: true`, `recurring_day`
- View submitted availability with edit/delete options

**Recurring Availability:**
- When recurring is enabled, auto-populate future weeks
- Show recurring entries with a repeat icon
- Can override individual dates

### 5. Shift Assignment (Admin/Manager)
**Enhanced Create Shift flow:**
- When assigning, show employee dropdown filtered by:
  1. Employees with availability on selected date/time
  2. Employees qualified for the shift type (future enhancement — v1 show all)
- After assigning, notification sent to employee

**Drag and Drop (Desktop):**
- Drag shift block from one employee row to another
- On drop: update `shifts.assigned_to`
- Show confirmation if target employee has no availability for that time

### 6. Shift Swap Request Flow
**Employee Side:**
1. Employee views their shift on calendar
2. Clicks shift → "Request Swap" button
3. Select colleague to swap with (dropdown of facility employees)
4. Submit request → creates `shift_swap_requests` record (status: pending)
5. Notification sent to selected colleague AND managers

**Manager Queue:**
**Route:** `/scheduling/swaps`
- List of pending swap requests
- Each shows: Requester, Shift details, Target employee, Date requested
- Approve / Deny buttons with optional note
- On approve: swap the `assigned_to` on the shift, notify both employees
- On deny: notify requester with note

### 7. Open Shift Broadcasting
When a shift has `is_open: true`:

**Manager Action:**
- Toggle "Broadcast" on open shift → sets `is_broadcast: true`
- Notification sent to all facility employees (or filtered by qualified shift type)

**Open Shifts List:**
**Route:** `/scheduling/open-shifts`
- List of all open/broadcast shifts
- Each shows: Date, Time, Position, "Pick Up" button
- Employee clicks "Pick Up" → assigns shift to them, notification to manager

### 8. Server Actions

```typescript
// src/app/(app)/scheduling/actions.ts

export async function createShift(data: CreateShiftInput)
export async function updateShift(id: string, data: UpdateShiftInput)
export async function deleteShift(id: string)
export async function submitAvailability(data: AvailabilityInput)
export async function requestSwap(data: SwapRequestInput)
export async function reviewSwap(id: string, approved: boolean, note?: string)
export async function pickUpShift(shiftId: string)
export async function broadcastShift(shiftId: string)
```

## Completion Criteria
- [ ] Week view renders correctly with shift blocks on desktop
- [ ] Day view renders as timeline on mobile
- [ ] Month view shows shift counts per day
- [ ] View toggle (Day/Week/Month) works
- [ ] Shift blocks colored by shift type
- [ ] Create Shift modal works with all fields
- [ ] Employee dropdown shows availability status
- [ ] Open shifts display distinctly (dashed border)
- [ ] Availability submission works with date/time selection
- [ ] Recurring availability works
- [ ] Shift swap request flow: request → manager queue → approve/deny
- [ ] Both employees notified of swap decision
- [ ] Open shift broadcasting sends notifications
- [ ] Open shift pickup works for employees
- [ ] Drag and drop shift reassignment on desktop
- [ ] Calendar navigation (prev/next/today) works
- [ ] Manager can see all employees' schedules
- [ ] Staff can see only their own schedule + open shifts
- [ ] Mobile responsive on all views
- [ ] Dark mode supported

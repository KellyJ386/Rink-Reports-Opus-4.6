# Agent 06: Ice Depth Management

## Objective
Build the Ice Depth Management module with interactive rink diagram, color-coded measurement points, Bluetooth caliper integration, and measurement history.

## Prerequisites
- Agents 00-04 completed
- Rinks and measurement points configured in Admin (Agent 03)

## Reference
- PRD Section 7.3 (Ice Depth Management)

---

## Routes
```
/ice-depth              → Rink selector + diagram view
/ice-depth/history      → Measurement history
```

## Tasks

### 1. Rink Selector
- If facility has multiple rinks: dropdown at top to select which rink
- If single rink: auto-select, no dropdown
- Fetch rinks from `rinks` table for user's facility

### 2. Interactive Rink Diagram Component
**File:** `src/components/diagrams/IceRinkDiagram.tsx`

**SVG Rink Diagram:**
- Draw USA Hockey regulation rink outline (rounded rectangle with red/blue lines)
- Scale to configured dimensions (default 200ft x 85ft)
- Include: center line (red), blue lines, goal creases, face-off circles, face-off dots
- Center ice: display facility logo if uploaded (from `facilities.logo_url`)
- Responsive: fits container width, maintains aspect ratio
- Mobile: pinch-to-zoom and pan (use CSS transform or a library like `react-zoom-pan-pinch`)

**Measurement Points Overlay:**
- Fetch points from `ice_depth_points` for selected rink
- Render each point as a numbered circle on the diagram at (x_percent, y_percent) position
- Point circle size: ~30px diameter (large enough to tap on mobile)
- Point number displayed inside circle

**Point Colors:**
- Fetch the most recent reading for each point from `ice_depth_readings`
- Fetch thresholds from `ice_depth_thresholds` for facility
- Color logic:
  - No reading yet: Wolf Grey (#A5ACAF)
  - Reading within green range: Action Green (#69BE28)
  - Reading within yellow range: Alert Yellow (#FFB800)
  - Reading within red range: Alert Red (#D32F2F)

### 3. Measurement Entry Modal
When user taps a numbered point on the diagram:

**Modal/Sheet Contents:**
- Header: "Point #[number]"
- Last reading display: "[value]" on [date] by [user]" (if exists)
- **Bluetooth Button:** Large button "📡 Read from Caliper"
  - Activates Web Bluetooth pairing/reading flow
  - On successful read: populates the measurement field
- **Manual Entry:** Number input with decimal support
  - Placeholder: "e.g., 1.25"
  - Units label: inches (")
  - Step: 0.01
- **Save Button:** Saves reading, closes modal, updates point color on diagram
- **Cancel Button:** Closes without saving

**On Save:**
- Insert into `ice_depth_readings`:
  - `point_id`, `facility_id`, `rink_id`, `reading_inches`, `reading_source` (manual/bluetooth)
  - `measured_by: auth.uid()`, `measured_at: now()`
- Point color updates immediately on diagram (optimistic UI)

### 4. Web Bluetooth Caliper Integration
**File:** `src/lib/bluetooth/caliper.ts`

```typescript
// Web Bluetooth API integration for digital calipers
// Common Bluetooth caliper services:
// - Many use GATT service UUID: 0x181D (Generic Attribute) or custom
// - Read characteristic for measurement value

export async function connectCaliper(): Promise<BluetoothDevice> {
  const device = await navigator.bluetooth.requestDevice({
    // Accept common caliper services
    acceptAllDevices: true,
    optionalServices: ['generic_access', /* caliper-specific services */]
  });
  return device;
}

export async function readMeasurement(device: BluetoothDevice): Promise<number> {
  const server = await device.gatt!.connect();
  // Connect to measurement characteristic
  // Parse measurement value (typically in mm, convert to inches)
  // Return value in inches
}
```

**Hook:** `src/lib/hooks/useBluetoothCaliper.ts`
```typescript
export function useBluetoothCaliper() {
  // States: idle, connecting, connected, reading, error
  // Methods: connect(), read(), disconnect()
  // Handle: browser compatibility check (Web Bluetooth not in Firefox/Safari)
  // Fallback: show message "Bluetooth not supported in this browser. Use Chrome on desktop or Android."
}
```

**Browser Compatibility Note:**
- Web Bluetooth works in: Chrome (desktop + Android), Edge, Opera
- Does NOT work in: Firefox, Safari (iOS/macOS)
- Show appropriate fallback message when unsupported
- Manual entry always available as fallback

### 5. Measurement History View
**Route:** `/ice-depth/history`

- Table/list of all readings for selected rink
- Columns: Point #, Reading ("), Color indicator, Source (Manual/BT), Measured By, Date/Time
- Filters: Date range, Point number
- Sort by date (newest first default)
- Export button (CSV) — or defer to Agent 13

### 6. Batch Reading Summary
After entering readings for multiple points:
- Show a summary bar at bottom of diagram:
  - "15/20 points measured today"
  - Color breakdown: "12 green, 2 yellow, 1 red"
- Optional: "Complete All Points" progress indicator

## Data Flow
```
User taps point → Modal opens → Enter/read value → Save to ice_depth_readings
                                                   → Update point color on diagram
                                                   → Update summary bar
```

## Completion Criteria
- [ ] Rink diagram renders with correct markings (lines, circles, creases)
- [ ] Measurement points display at correct positions from admin config
- [ ] Points show correct colors based on most recent reading vs thresholds
- [ ] Tapping a point opens measurement modal
- [ ] Manual entry saves correctly with timestamp and user
- [ ] Bluetooth caliper connection works in Chrome
- [ ] Bluetooth reads populate the measurement field
- [ ] Unsupported browser shows helpful fallback message
- [ ] Point color updates immediately after saving reading
- [ ] Multi-rink selector works for facilities with multiple sheets
- [ ] Facility logo displays at center ice (if uploaded)
- [ ] Diagram is zoomable/pannable on mobile
- [ ] History view shows all readings with filters
- [ ] Summary bar shows measurement progress
- [ ] Grey points indicate unmeasured points
- [ ] Dark mode supported
- [ ] Mobile responsive (diagram fits screen, modal is full-width)

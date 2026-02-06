# Agent 11: Air Quality Monitoring

## Objective
Build the Air Quality Monitoring module for tracking CO, CO2, NO2, humidity, temperature, and other configurable metrics with compliance reporting.

## Prerequisites
- Agents 00-04 completed
- Air quality metrics and locations configured in Admin (Agent 03)

## Reference
- PRD Section 7.8 (Air Quality Monitoring)

---

## Routes
```
/air-quality              → Entry form
/air-quality/history      → Reading history/log
/air-quality/reports      → Compliance report generation
```

## Tasks

### 1. Entry Form
**Route:** `/air-quality/page.tsx`

**Form Fields:**
- **Location Selector:** Dropdown from `air_quality_locations` (e.g., Ice Level, Stands, Lobby)
- **Metric Fields:** One number input per configured metric from `air_quality_metrics`
  - Label: metric name + unit (e.g., "Carbon Monoxide (CO) — PPM")
  - Out-of-range warning: same pattern as refrigeration (field turns red if outside threshold)
- **Timestamp:** Auto-filled, editable
- **Notes:** Optional text area

**On Submit:**
1. Create `air_quality_readings` record
2. Create `air_quality_reading_values` for each metric
3. Database trigger flags out-of-range values
4. If any out of range: create `active_alerts`, send notifications
5. Toast success, clear form for next entry

### 2. History Log
**Route:** `/air-quality/history`

- Table view of all readings
- Columns: Date/Time, Location, then one column per metric, Recorded By
- Out-of-range values highlighted in red
- Filters: Date range, Location
- Sort by date (newest first)

### 3. Compliance Report Generation
**Route:** `/air-quality/reports`

**Report Generation Modal/Page:**
- Date Range Picker (start date, end date)
- Format Selector: PDF / CSV / Excel
- "Generate Report" button

**Report Contents:**
- Header: Facility name, report date range, generated date
- All readings within date range
- Timestamps, users who recorded
- Any threshold exceedances highlighted
- Summary: total readings, number of exceedances, metrics affected

**Use Case:** Facility provides this report to health inspectors during audits.

**Implementation:**
- PDF: use jspdf with jspdf-autotable (installed in Agent 00)
- CSV: generate on server, trigger download
- Excel: use xlsx package

(Full implementation may be coordinated with Agent 13 — but basic compliance report should work here.)

## Completion Criteria
- [ ] Entry form dynamically renders fields from admin-configured metrics
- [ ] Location dropdown populated from admin config
- [ ] Out-of-range warnings display correctly per metric thresholds
- [ ] Readings save to database with all metric values
- [ ] Out-of-range flagging works via database trigger
- [ ] Dashboard alert badge updates on out-of-range reading
- [ ] History log shows all readings with filters
- [ ] Out-of-range values highlighted in history
- [ ] Compliance report generates in PDF/CSV/Excel formats
- [ ] Report includes all required information for health inspectors
- [ ] Mobile responsive
- [ ] Dark mode supported

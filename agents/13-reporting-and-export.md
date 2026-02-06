# Phase 13: Reporting & Export

## Status
COMPLETED

## Description
PDF/CSV/Excel generation, scheduled reports, compliance reports. Provide comprehensive data export and reporting capabilities for operational analysis, regulatory compliance, and management review.

## Prerequisites
- Phase 0: Project Scaffold (COMPLETED)
- Phase 1: Database Schema (COMPLETED)
- Phase 2: Auth & RLS (COMPLETED)
- Phase 3: Admin Control Center (COMPLETED)
- Phase 4: Dashboard & Layout (COMPLETED)
- Phase 5-11: Feature modules (COMPLETED) (for data sources)
- Phase 12: Notifications System (COMPLETED) (for scheduled report delivery)

## Deliverables
- PDF report generation with branded templates
- CSV export for all data tables
- Excel export with formatted worksheets
- Scheduled report generation (daily, weekly, monthly)
- Compliance report templates (health & safety, regulatory)
- Custom date range filtering
- Report delivery via email (integrates with Notifications)
- Report archive and history

## Files Created
- `src/app/(app)/reports/page.tsx` — Server component with:
  - Quick export cards (Daily Summary, Ice Operations, Incidents, Air Quality, Refrigeration, Full Facility)
  - Recent reports archive table with download links
  - PDF/CSV/Excel format badges
  - File size display
- `src/app/(app)/reports/actions.ts` — Server actions:
  - generateReport (creates report archive entry with type/format/date range)
  - deleteReport
  - getScheduledReports (recurring report configurations)
  - createScheduledReport (daily/weekly/monthly recurrence)
  - toggleScheduledReport (activate/deactivate)
  - deleteScheduledReport
- `src/app/(app)/reports/generate/page.tsx` — Report generation form:
  - Report type selector (daily_summary, ice_operations, incidents, air_quality, refrigeration, scheduling, full_facility)
  - Format selector (PDF, CSV, Excel)
  - Date range picker (start/end)
  - Title input
  - Generate button with loading state

## Implementation Notes
- Report types map to module data sources
- Scheduled reports support daily, weekly, monthly frequencies
- File format options: PDF (jsPDF), CSV, Excel (xlsx)
- Report archives stored with metadata (type, format, date range, generated_by)
- Quick export cards provide one-click generation for common reports
- Scheduled reports can be toggled active/inactive without deletion

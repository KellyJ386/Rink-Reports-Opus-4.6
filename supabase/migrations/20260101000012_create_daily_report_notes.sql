-- ============================================
-- DAILY REPORT NOTES (per tab, per checklist type, per date)
-- ============================================
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

CREATE INDEX idx_daily_report_notes_tab ON daily_report_notes(tab_id, note_date);
CREATE INDEX idx_daily_report_notes_facility ON daily_report_notes(facility_id, note_date);

ALTER TABLE daily_report_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY daily_report_notes_select
  ON daily_report_notes FOR SELECT
  USING (facility_id = get_user_facility_id());

CREATE POLICY daily_report_notes_insert
  ON daily_report_notes FOR INSERT
  WITH CHECK (facility_id = get_user_facility_id() AND get_user_role() NOT IN ('read_only'));

CREATE POLICY daily_report_notes_update
  ON daily_report_notes FOR UPDATE
  USING (facility_id = get_user_facility_id() AND get_user_role() NOT IN ('read_only'));

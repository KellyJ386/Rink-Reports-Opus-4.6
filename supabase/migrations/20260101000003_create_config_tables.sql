-- ============================================
-- MODULE SETTINGS (enable/disable per facility)
-- ============================================
CREATE TABLE module_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  module module_id NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  allowed_roles user_role[] DEFAULT ARRAY['facility_admin','manager','supervisor','staff','read_only']::user_role[],
  UNIQUE(facility_id, module)
);

CREATE INDEX idx_module_settings_facility ON module_settings(facility_id);

-- ============================================
-- DAILY REPORT TABS (up to 30 per facility)
-- ============================================
CREATE TABLE daily_report_tabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dr_tabs_facility ON daily_report_tabs(facility_id);

-- ============================================
-- CHECKLIST ITEMS (per tab per checklist type)
-- ============================================
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tab_id UUID NOT NULL REFERENCES daily_report_tabs(id) ON DELETE CASCADE,
  checklist_type checklist_type NOT NULL,
  item_text TEXT NOT NULL,
  recurrence recurrence_frequency DEFAULT 'daily',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checklist_items_tab ON checklist_items(tab_id);
CREATE INDEX idx_checklist_items_type ON checklist_items(tab_id, checklist_type);

-- ============================================
-- CIRCLE CHECK ITEMS (per machine)
-- ============================================
CREATE TABLE circle_check_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_circle_check_items_machine ON circle_check_items(machine_id);

-- ============================================
-- SHIFT TYPES (Admin configurable)
-- ============================================
CREATE TABLE shift_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#69BE28',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_shift_types_facility ON shift_types(facility_id);

-- ============================================
-- INCIDENT LOCATIONS (Admin configurable dropdown)
-- ============================================
CREATE TABLE incident_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_incident_locations_facility ON incident_locations(facility_id);

-- ============================================
-- AIR QUALITY METRICS (Admin configurable)
-- ============================================
CREATE TABLE air_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  min_threshold NUMERIC,
  max_threshold NUMERIC,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_aq_metrics_facility ON air_quality_metrics(facility_id);

-- ============================================
-- AIR QUALITY LOCATIONS (where readings are taken)
-- ============================================
CREATE TABLE air_quality_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_aq_locations_facility ON air_quality_locations(facility_id);

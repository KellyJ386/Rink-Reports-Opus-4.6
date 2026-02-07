-- ============================================
-- DAILY REPORT CHECKLIST COMPLETIONS
-- ============================================
CREATE TABLE checklist_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_item_id UUID NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT TRUE,
  completed_by UUID REFERENCES profiles(id),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_checklist_completions_unique
  ON checklist_completions(checklist_item_id, completed_date)
  WHERE is_completed = TRUE;
CREATE INDEX idx_checklist_completions_facility_date
  ON checklist_completions(facility_id, completed_date);

-- ============================================
-- ICE DEPTH READINGS
-- ============================================
CREATE TABLE ice_depth_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  point_id UUID NOT NULL REFERENCES ice_depth_points(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  rink_id UUID NOT NULL REFERENCES rinks(id) ON DELETE CASCADE,
  reading_inches NUMERIC NOT NULL,
  reading_source TEXT DEFAULT 'manual',
  measured_by UUID NOT NULL REFERENCES profiles(id),
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_depth_readings_rink_date ON ice_depth_readings(rink_id, measured_at DESC);
CREATE INDEX idx_depth_readings_facility ON ice_depth_readings(facility_id);

-- ============================================
-- ICE MAKES
-- ============================================
CREATE TABLE ice_makes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  rink_id UUID NOT NULL REFERENCES rinks(id),
  machine_id UUID NOT NULL REFERENCES machines(id),
  operator_id UUID NOT NULL REFERENCES profiles(id),
  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  machine_hours NUMERIC,
  ice_taken NUMERIC,
  water_used NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ice_makes_facility_date ON ice_makes(facility_id, event_time DESC);

-- ============================================
-- BLADE CHANGES
-- ============================================
CREATE TABLE blade_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id),
  operator_id UUID NOT NULL REFERENCES profiles(id),
  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blade_changes_facility ON blade_changes(facility_id, event_time DESC);

-- ============================================
-- EDGING LOGS
-- ============================================
CREATE TABLE edging_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  rink_id UUID NOT NULL REFERENCES rinks(id),
  operator_id UUID NOT NULL REFERENCES profiles(id),
  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_edging_logs_facility ON edging_logs(facility_id, event_time DESC);

-- ============================================
-- CIRCLE CHECKS
-- ============================================
CREATE TABLE circle_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id),
  operator_id UUID NOT NULL REFERENCES profiles(id),
  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_circle_checks_facility ON circle_checks(facility_id, event_time DESC);

-- ============================================
-- CIRCLE CHECK RESULTS (per item per check)
-- ============================================
CREATE TABLE circle_check_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_check_id UUID NOT NULL REFERENCES circle_checks(id) ON DELETE CASCADE,
  check_item_id UUID NOT NULL REFERENCES circle_check_items(id),
  passed BOOLEAN NOT NULL DEFAULT TRUE,
  fail_notes TEXT
);

CREATE INDEX idx_circle_check_results_check ON circle_check_results(circle_check_id);

-- ============================================
-- INCIDENT REPORTS
-- ============================================
CREATE TABLE incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  incident_type incident_type NOT NULL,
  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location_id UUID REFERENCES incident_locations(id),
  location_text TEXT,
  description TEXT NOT NULL,
  injured_party_name TEXT,
  injured_party_type party_type,
  body_diagram_regions TEXT[],
  witnesses TEXT,
  submitted_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incidents_facility_date ON incident_reports(facility_id, event_time DESC);
CREATE INDEX idx_incidents_type ON incident_reports(facility_id, incident_type);

-- ============================================
-- REFRIGERATION READINGS
-- ============================================
CREATE TABLE refrigeration_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id),
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refrig_readings_facility ON refrigeration_readings(facility_id, recorded_at DESC);
CREATE INDEX idx_refrig_readings_equipment ON refrigeration_readings(equipment_id, recorded_at DESC);

-- ============================================
-- REFRIGERATION READING VALUES (per reading type)
-- ============================================
CREATE TABLE refrigeration_reading_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_id UUID NOT NULL REFERENCES refrigeration_readings(id) ON DELETE CASCADE,
  reading_type_id UUID NOT NULL REFERENCES equipment_reading_types(id),
  numeric_value NUMERIC,
  oil_level_value oil_level,
  is_out_of_range BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_refrig_values_reading ON refrigeration_reading_values(reading_id);

-- ============================================
-- AIR QUALITY READINGS
-- ============================================
CREATE TABLE air_quality_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  location_id UUID REFERENCES air_quality_locations(id),
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aq_readings_facility ON air_quality_readings(facility_id, recorded_at DESC);

-- ============================================
-- AIR QUALITY READING VALUES
-- ============================================
CREATE TABLE air_quality_reading_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_id UUID NOT NULL REFERENCES air_quality_readings(id) ON DELETE CASCADE,
  metric_id UUID NOT NULL REFERENCES air_quality_metrics(id),
  value NUMERIC NOT NULL,
  is_out_of_range BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_aq_values_reading ON air_quality_reading_values(reading_id);

-- ============================================
-- EMPLOYEE SCHEDULING: SHIFTS
-- ============================================
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  shift_type_id UUID NOT NULL REFERENCES shift_types(id),
  assigned_to UUID REFERENCES profiles(id),
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_open BOOLEAN DEFAULT FALSE,
  is_broadcast BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shifts_facility_date ON shifts(facility_id, shift_date);
CREATE INDEX idx_shifts_assigned ON shifts(assigned_to, shift_date);
CREATE INDEX idx_shifts_open ON shifts(facility_id, is_open) WHERE is_open = TRUE;

-- ============================================
-- EMPLOYEE AVAILABILITY
-- ============================================
CREATE TABLE employee_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id),
  available_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_day day_of_week,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_availability_employee ON employee_availability(employee_id, available_date);
CREATE INDEX idx_availability_facility ON employee_availability(facility_id, available_date);

-- ============================================
-- SHIFT SWAP REQUESTS
-- ============================================
CREATE TABLE shift_swap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id),
  target_id UUID NOT NULL REFERENCES profiles(id),
  status swap_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_swap_requests_facility ON shift_swap_requests(facility_id, status);
CREATE INDEX idx_swap_requests_shift ON shift_swap_requests(shift_id);

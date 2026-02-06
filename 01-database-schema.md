# Agent 01: Database Schema

## Objective
Create the complete Supabase/PostgreSQL schema for MFO. All tables, enums, indexes, foreign keys, and trigger functions. No RLS policies yet (that's Agent 02).

## Prerequisites
- Agent 00 completed (Supabase local instance running)

## Reference
Read `CLAUDE.md` for naming conventions and architecture decisions.

---

## Tasks

### 1. Create Enums Migration
**File:** `supabase/migrations/20260101000001_create_enums.sql`

```sql
-- User roles
CREATE TYPE user_role AS ENUM (
  'super_admin', 'facility_admin', 'manager', 'supervisor', 'staff', 'read_only'
);

-- Incident types
CREATE TYPE incident_type AS ENUM ('incident', 'accident');

-- Injured party type
CREATE TYPE party_type AS ENUM ('patron', 'staff');

-- Fuel type for machines
CREATE TYPE fuel_type AS ENUM ('gas', 'electric');

-- Checklist type
CREATE TYPE checklist_type AS ENUM ('opening', 'closing', 'daily_operations');

-- Recurrence frequency
CREATE TYPE recurrence_frequency AS ENUM ('daily', 'weekly', 'monthly', 'seasonal');

-- Notification channel
CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'sms');

-- Shift swap status
CREATE TYPE swap_status AS ENUM ('pending', 'approved', 'denied');

-- Oil level check
CREATE TYPE oil_level AS ENUM ('ok', 'low', 'add');

-- Module identifier
CREATE TYPE module_id AS ENUM (
  'daily_reports', 'ice_depth', 'ice_operations', 'scheduling',
  'incidents', 'refrigeration', 'air_quality', 'admin'
);

-- Day of week
CREATE TYPE day_of_week AS ENUM (
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
);
```

### 2. Core Tables Migration
**File:** `supabase/migrations/20260101000002_create_core_tables.sql`

```sql
-- ============================================
-- FACILITIES
-- ============================================
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  time_zone TEXT NOT NULL DEFAULT 'America/New_York',
  logo_url TEXT,
  seasonal_operation BOOLEAN DEFAULT FALSE,
  open_months INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7,8,9,10,11,12],
  data_retention_years INTEGER DEFAULT 3,
  incident_retention_years INTEGER DEFAULT 7,
  archive_mode BOOLEAN DEFAULT FALSE,
  session_duration_hours INTEGER DEFAULT 12,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- OPERATING HOURS
-- ============================================
CREATE TABLE operating_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  day_of_week day_of_week NOT NULL,
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT FALSE,
  UNIQUE(facility_id, day_of_week)
);

-- ============================================
-- USERS / PROFILES
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_facility ON profiles(facility_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================
-- RINKS (Ice Sheets)
-- ============================================
CREATE TABLE rinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Rink A", "Main Rink", etc.
  length_ft NUMERIC DEFAULT 200,
  width_ft NUMERIC DEFAULT 85,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rinks_facility ON rinks(facility_id);

-- ============================================
-- ICE DEPTH MEASUREMENT POINTS
-- ============================================
CREATE TABLE ice_depth_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rink_id UUID NOT NULL REFERENCES rinks(id) ON DELETE CASCADE,
  point_number INTEGER NOT NULL,
  x_percent NUMERIC NOT NULL, -- 0-100 position on diagram
  y_percent NUMERIC NOT NULL, -- 0-100 position on diagram
  UNIQUE(rink_id, point_number)
);

CREATE INDEX idx_depth_points_rink ON ice_depth_points(rink_id);

-- ============================================
-- ICE DEPTH THRESHOLDS
-- ============================================
CREATE TABLE ice_depth_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  green_min NUMERIC NOT NULL DEFAULT 1.00,
  green_max NUMERIC NOT NULL DEFAULT 1.74,
  yellow_min NUMERIC NOT NULL DEFAULT 1.75,
  yellow_max NUMERIC NOT NULL DEFAULT 3.50,
  red_min NUMERIC NOT NULL DEFAULT 0.00,
  red_max NUMERIC NOT NULL DEFAULT 0.99,
  UNIQUE(facility_id)
);

-- ============================================
-- MACHINES (Zambonis / Resurfacers)
-- ============================================
CREATE TABLE machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fuel_type fuel_type NOT NULL DEFAULT 'gas',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_machines_facility ON machines(facility_id);

-- ============================================
-- EQUIPMENT (Compressors, Pumps, Condensers)
-- ============================================
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Compressor #1 - Rink A"
  equipment_type TEXT NOT NULL, -- "compressor", "pump", "condenser"
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_equipment_facility ON equipment(facility_id);

-- ============================================
-- EQUIPMENT READING TYPES (Admin configurable)
-- ============================================
CREATE TABLE equipment_reading_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Head Pressure"
  unit TEXT NOT NULL, -- "PSI", "°F", etc.
  min_threshold NUMERIC, -- alert if below
  max_threshold NUMERIC, -- alert if above
  sort_order INTEGER DEFAULT 0,
  is_oil_level BOOLEAN DEFAULT FALSE -- special UI for OK/Low/Add
);

CREATE INDEX idx_reading_types_equipment ON equipment_reading_types(equipment_id);
```

### 3. Module Configuration Tables
**File:** `supabase/migrations/20260101000003_create_config_tables.sql`

```sql
-- ============================================
-- MODULE SETTINGS (enable/disable per facility)
-- ============================================
CREATE TABLE module_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  module module_id NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  -- Role access: which roles can access this module
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
  name TEXT NOT NULL, -- "Front Desk", "Zamboni Log", etc.
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
  name TEXT NOT NULL, -- "Zamboni Operator", "Front Desk", etc.
  color TEXT NOT NULL DEFAULT '#69BE28', -- hex color for calendar
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
  name TEXT NOT NULL, -- "Main Rink", "Lobby", "Locker Room A", etc.
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
  name TEXT NOT NULL, -- "Carbon Monoxide (CO)"
  unit TEXT NOT NULL, -- "PPM"
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
  name TEXT NOT NULL, -- "Ice Level", "Stands", "Lobby"
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_aq_locations_facility ON air_quality_locations(facility_id);
```

### 4. Operational Data Tables
**File:** `supabase/migrations/20260101000004_create_operational_tables.sql`

```sql
-- ============================================
-- DAILY REPORT CHECKLIST COMPLETIONS
-- ============================================
CREATE TABLE checklist_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_item_id UUID NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL, -- the date this item was checked
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
  reading_source TEXT DEFAULT 'manual', -- 'manual' or 'bluetooth'
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
  ice_taken NUMERIC, -- measurement of ice shaved
  water_used NUMERIC, -- gallons
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
  fail_notes TEXT -- required if passed = false
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
  location_text TEXT, -- free text option
  description TEXT NOT NULL,
  injured_party_name TEXT, -- required if accident
  injured_party_type party_type, -- required if accident
  body_diagram_regions TEXT[], -- array of region identifiers
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
  numeric_value NUMERIC, -- for numeric readings
  oil_level_value oil_level, -- for oil level checks
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
  assigned_to UUID REFERENCES profiles(id), -- NULL = open shift
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_open BOOLEAN DEFAULT FALSE, -- true = available for pickup
  is_broadcast BOOLEAN DEFAULT FALSE, -- true = broadcasted to qualified employees
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
  recurring_day day_of_week, -- if recurring, which day
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
  target_id UUID NOT NULL REFERENCES profiles(id), -- who they want to swap with
  status swap_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id), -- manager who approved/denied
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_swap_requests_facility ON shift_swap_requests(facility_id, status);
CREATE INDEX idx_swap_requests_shift ON shift_swap_requests(shift_id);
```

### 5. Notifications & Alerts Tables
**File:** `supabase/migrations/20260101000005_create_notification_tables.sql`

```sql
-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT, -- deep link within app
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC);

-- ============================================
-- NOTIFICATION PREFERENCES
-- ============================================
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL, -- 'out_of_range', 'incident', 'shift_reminder', etc.
  channel notification_channel NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  UNIQUE(profile_id, trigger_type, channel)
);

CREATE INDEX idx_notif_prefs_profile ON notification_preferences(profile_id);

-- ============================================
-- ALERTS (active alerts for dashboard badges)
-- ============================================
CREATE TABLE active_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  module module_id NOT NULL,
  alert_type TEXT NOT NULL, -- 'out_of_range', 'new_incident', etc.
  reference_id UUID, -- links to the specific record
  message TEXT,
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ
);

CREATE INDEX idx_alerts_facility_module ON active_alerts(facility_id, module, is_acknowledged);
```

### 6. Utility Functions & Triggers
**File:** `supabase/migrations/20260101000006_create_functions.sql`

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER tr_facilities_updated
  BEFORE UPDATE ON facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_shifts_updated
  BEFORE UPDATE ON shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to check if a reading is out of range
CREATE OR REPLACE FUNCTION check_refrig_out_of_range()
RETURNS TRIGGER AS $$
DECLARE
  min_val NUMERIC;
  max_val NUMERIC;
BEGIN
  SELECT min_threshold, max_threshold INTO min_val, max_val
  FROM equipment_reading_types WHERE id = NEW.reading_type_id;

  IF NEW.numeric_value IS NOT NULL THEN
    NEW.is_out_of_range := (
      (min_val IS NOT NULL AND NEW.numeric_value < min_val) OR
      (max_val IS NOT NULL AND NEW.numeric_value > max_val)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_refrig_range_check
  BEFORE INSERT OR UPDATE ON refrigeration_reading_values
  FOR EACH ROW EXECUTE FUNCTION check_refrig_out_of_range();

-- Same for air quality
CREATE OR REPLACE FUNCTION check_aq_out_of_range()
RETURNS TRIGGER AS $$
DECLARE
  min_val NUMERIC;
  max_val NUMERIC;
BEGIN
  SELECT min_threshold, max_threshold INTO min_val, max_val
  FROM air_quality_metrics WHERE id = NEW.metric_id;

  NEW.is_out_of_range := (
    (min_val IS NOT NULL AND NEW.value < min_val) OR
    (max_val IS NOT NULL AND NEW.value > max_val)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_aq_range_check
  BEFORE INSERT OR UPDATE ON air_quality_reading_values
  FOR EACH ROW EXECUTE FUNCTION check_aq_out_of_range();
```

### 7. Seed Data
**File:** `supabase/seed.sql`

Create seed data for development:
- 1 facility ("Syracuse University Tennity Ice Pavilion")
- 2 rinks ("Rink A", "Rink B")
- Operating hours (Mon-Sun)
- Default module settings (all enabled)
- 5 Daily Report tabs (Front Desk, Zamboni Log, Skate Rental, Concessions, Janitorial)
- 3-5 checklist items per tab per checklist type
- 2 machines ("Zamboni #1 - Gas", "Zamboni #2 - Electric")
- 10 circle check items per machine
- 2 compressors, 1 glycol pump with reading types and thresholds
- Default ice depth thresholds
- 15 measurement points on Rink A
- 4 shift types
- 5 incident locations
- Default air quality metrics (CO, CO2, NO2, Humidity, Temp) with thresholds
- 3 air quality locations

**Do NOT seed user data** — users are created via Supabase Auth.

## Completion Criteria
- [ ] All migrations run without errors: `npx supabase db reset`
- [ ] Seed data loads correctly
- [ ] All foreign key relationships are valid
- [ ] Indexes exist on all frequently queried columns
- [ ] Triggers fire correctly (test updated_at, out-of-range checks)
- [ ] No circular dependencies between tables
- [ ] All enums cover required values

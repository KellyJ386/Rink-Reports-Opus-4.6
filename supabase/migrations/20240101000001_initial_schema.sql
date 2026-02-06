-- Migration: 20240101000001_initial_schema.sql
-- Phase 1: Complete database schema for MFO platform
-- All tables, enums, indexes, and relationships

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'super_admin',
  'facility_admin',
  'manager',
  'supervisor',
  'staff',
  'read_only'
);

CREATE TYPE module_type AS ENUM (
  'daily_reports',
  'ice_depth',
  'ice_operations',
  'scheduling',
  'incidents',
  'refrigeration',
  'air_quality'
);

CREATE TYPE report_status AS ENUM (
  'draft',
  'submitted',
  'reviewed',
  'approved',
  'rejected'
);

CREATE TYPE incident_type AS ENUM (
  'injury',
  'equipment_failure',
  'safety_hazard',
  'property_damage',
  'near_miss',
  'other'
);

CREATE TYPE incident_severity AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE incident_status AS ENUM (
  'open',
  'investigating',
  'resolved',
  'closed'
);

CREATE TYPE shift_status AS ENUM (
  'draft',
  'published',
  'cancelled'
);

CREATE TYPE swap_status AS ENUM (
  'pending',
  'approved',
  'denied',
  'cancelled'
);

CREATE TYPE time_off_status AS ENUM (
  'pending',
  'approved',
  'denied',
  'cancelled'
);

CREATE TYPE notification_channel AS ENUM (
  'in_app',
  'email',
  'sms'
);

CREATE TYPE notification_type AS ENUM (
  'alert',
  'threshold_warning',
  'report_submitted',
  'report_approved',
  'report_rejected',
  'shift_assigned',
  'shift_swap_request',
  'incident_created',
  'maintenance_due',
  'general'
);

CREATE TYPE checklist_field_type AS ENUM (
  'checkbox',
  'number',
  'text',
  'select',
  'temperature',
  'pressure',
  'time'
);

CREATE TYPE equipment_type AS ENUM (
  'zamboni',
  'edger',
  'compressor',
  'pump',
  'dehumidifier',
  'sensor',
  'other'
);

CREATE TYPE equipment_status AS ENUM (
  'active',
  'maintenance',
  'retired'
);

CREATE TYPE day_of_week AS ENUM (
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
);

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Facilities
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state_province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  timezone TEXT DEFAULT 'America/New_York',
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  session_duration_hours INTEGER DEFAULT 10,
  number_of_rinks INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- User profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_profiles_facility_id ON profiles(facility_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================================
-- ADMIN CONFIGURATION TABLES
-- ============================================================

-- Module settings per facility
CREATE TABLE module_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  module module_type NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(facility_id, module)
);

CREATE INDEX idx_module_settings_facility ON module_settings(facility_id);

-- Tab configurations (for Daily Reports dynamic tabs)
CREATE TABLE tab_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  module module_type NOT NULL DEFAULT 'daily_reports',
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_tab_configurations_facility ON tab_configurations(facility_id);
CREATE INDEX idx_tab_configurations_module ON tab_configurations(module);

-- Checklist items (configurable per tab)
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  tab_id UUID NOT NULL REFERENCES tab_configurations(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  field_type checklist_field_type NOT NULL DEFAULT 'checkbox',
  options JSONB, -- for select fields: ["option1", "option2"]
  default_value TEXT,
  unit TEXT, -- e.g., "°F", "psi", "inches"
  min_value NUMERIC,
  max_value NUMERIC,
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_checklist_items_tab ON checklist_items(tab_id);
CREATE INDEX idx_checklist_items_facility ON checklist_items(facility_id);

-- Equipment registry
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type equipment_type NOT NULL,
  make TEXT,
  model TEXT,
  serial_number TEXT,
  year INTEGER,
  status equipment_status DEFAULT 'active',
  notes TEXT,
  maintenance_interval_days INTEGER,
  last_maintenance_at TIMESTAMPTZ,
  next_maintenance_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_equipment_facility ON equipment(facility_id);
CREATE INDEX idx_equipment_type ON equipment(type);
CREATE INDEX idx_equipment_status ON equipment(status);

-- Thresholds (alert ranges per metric)
CREATE TABLE thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  module module_type NOT NULL,
  metric_name TEXT NOT NULL,
  metric_label TEXT NOT NULL,
  unit TEXT,
  warning_low NUMERIC,
  warning_high NUMERIC,
  critical_low NUMERIC,
  critical_high NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(facility_id, module, metric_name)
);

CREATE INDEX idx_thresholds_facility ON thresholds(facility_id);
CREATE INDEX idx_thresholds_module ON thresholds(module);

-- Shift types (scheduling categories)
CREATE TABLE shift_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#002244',
  start_time TIME,
  end_time TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_shift_types_facility ON shift_types(facility_id);

-- Rinks (each facility can have multiple rinks)
CREATE TABLE rinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dimensions_length NUMERIC, -- feet
  dimensions_width NUMERIC,  -- feet
  surface_type TEXT DEFAULT 'ice',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_rinks_facility ON rinks(facility_id);

-- Rink zones (for ice depth measurement locations)
CREATE TABLE rink_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rink_id UUID NOT NULL REFERENCES rinks(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  x_position NUMERIC, -- percentage 0-100 for diagram placement
  y_position NUMERIC,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_rink_zones_rink ON rink_zones(rink_id);
CREATE INDEX idx_rink_zones_facility ON rink_zones(facility_id);

-- ============================================================
-- DAILY REPORTS (Phase 5)
-- ============================================================

CREATE TABLE daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  status report_status DEFAULT 'draft',
  submitted_by UUID REFERENCES profiles(id),
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(facility_id, report_date)
);

CREATE INDEX idx_daily_reports_facility ON daily_reports(facility_id);
CREATE INDEX idx_daily_reports_date ON daily_reports(report_date);
CREATE INDEX idx_daily_reports_status ON daily_reports(status);

-- Checklist responses (entries in a daily report)
CREATE TABLE checklist_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  daily_report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
  tab_id UUID NOT NULL REFERENCES tab_configurations(id) ON DELETE CASCADE,
  value TEXT, -- stored as text, interpreted by field_type
  numeric_value NUMERIC, -- for numeric/temp/pressure fields
  is_flagged BOOLEAN DEFAULT false,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  event_time TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_checklist_responses_report ON checklist_responses(daily_report_id);
CREATE INDEX idx_checklist_responses_item ON checklist_responses(checklist_item_id);
CREATE INDEX idx_checklist_responses_facility ON checklist_responses(facility_id);

-- ============================================================
-- ICE DEPTH MANAGEMENT (Phase 6)
-- ============================================================

CREATE TABLE ice_depth_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  rink_id UUID NOT NULL REFERENCES rinks(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES rink_zones(id) ON DELETE CASCADE,
  depth_inches NUMERIC(5,3) NOT NULL,
  measurement_method TEXT DEFAULT 'manual', -- 'manual' or 'bluetooth'
  is_flagged BOOLEAN DEFAULT false,
  notes TEXT,
  measured_by UUID NOT NULL REFERENCES profiles(id),
  event_time TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_ice_depth_facility ON ice_depth_measurements(facility_id);
CREATE INDEX idx_ice_depth_rink ON ice_depth_measurements(rink_id);
CREATE INDEX idx_ice_depth_zone ON ice_depth_measurements(zone_id);
CREATE INDEX idx_ice_depth_event_time ON ice_depth_measurements(event_time);

-- Ice cuts/floods
CREATE TABLE ice_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  rink_id UUID NOT NULL REFERENCES rinks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('cut', 'flood', 'full_resurface', 'patch')),
  depth_removed_inches NUMERIC(5,3),
  depth_added_inches NUMERIC(5,3),
  water_temperature_f NUMERIC(5,1),
  notes TEXT,
  performed_by UUID NOT NULL REFERENCES profiles(id),
  event_time TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_ice_events_facility ON ice_events(facility_id);
CREATE INDEX idx_ice_events_rink ON ice_events(rink_id);
CREATE INDEX idx_ice_events_type ON ice_events(event_type);
CREATE INDEX idx_ice_events_time ON ice_events(event_time);

-- ============================================================
-- ICE OPERATIONS (Phase 7)
-- ============================================================

CREATE TABLE ice_makes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  rink_id UUID NOT NULL REFERENCES rinks(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
  resurface_type TEXT NOT NULL CHECK (resurface_type IN ('full', 'half', 'spot', 'dry_cut')),
  water_temperature_f NUMERIC(5,1),
  ice_temperature_f NUMERIC(5,1),
  water_usage_gallons NUMERIC(8,1),
  duration_minutes INTEGER,
  blade_condition TEXT CHECK (blade_condition IN ('new', 'good', 'fair', 'poor')),
  notes TEXT,
  operator_id UUID NOT NULL REFERENCES profiles(id),
  event_time TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_ice_makes_facility ON ice_makes(facility_id);
CREATE INDEX idx_ice_makes_rink ON ice_makes(rink_id);
CREATE INDEX idx_ice_makes_equipment ON ice_makes(equipment_id);
CREATE INDEX idx_ice_makes_event_time ON ice_makes(event_time);

CREATE TABLE ice_maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL, -- e.g., 'blade_change', 'oil_change', 'filter_replacement'
  description TEXT,
  parts_used TEXT,
  cost NUMERIC(10,2),
  performed_by UUID NOT NULL REFERENCES profiles(id),
  event_time TIMESTAMPTZ DEFAULT now() NOT NULL,
  next_due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_ice_maintenance_facility ON ice_maintenance_logs(facility_id);
CREATE INDEX idx_ice_maintenance_equipment ON ice_maintenance_logs(equipment_id);

-- ============================================================
-- EMPLOYEE SCHEDULING (Phase 8)
-- ============================================================

CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- Monday of the week
  status shift_status DEFAULT 'draft',
  published_by UUID REFERENCES profiles(id),
  published_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(facility_id, week_start)
);

CREATE INDEX idx_schedules_facility ON schedules(facility_id);
CREATE INDEX idx_schedules_week ON schedules(week_start);

CREATE TABLE schedule_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shift_type_id UUID REFERENCES shift_types(id) ON DELETE SET NULL,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_schedule_entries_facility ON schedule_entries(facility_id);
CREATE INDEX idx_schedule_entries_schedule ON schedule_entries(schedule_id);
CREATE INDEX idx_schedule_entries_employee ON schedule_entries(employee_id);
CREATE INDEX idx_schedule_entries_date ON schedule_entries(shift_date);

CREATE TABLE employee_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week day_of_week NOT NULL,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT true,
  effective_from DATE,
  effective_until DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_availability_facility ON employee_availability(facility_id);
CREATE INDEX idx_availability_employee ON employee_availability(employee_id);

CREATE TABLE shift_swap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  requester_entry_id UUID NOT NULL REFERENCES schedule_entries(id) ON DELETE CASCADE,
  target_entry_id UUID REFERENCES schedule_entries(id) ON DELETE SET NULL,
  target_employee_id UUID REFERENCES profiles(id),
  status swap_status DEFAULT 'pending',
  reason TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_swap_requests_facility ON shift_swap_requests(facility_id);
CREATE INDEX idx_swap_requests_status ON shift_swap_requests(status);

CREATE TABLE time_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status time_off_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_time_off_facility ON time_off_requests(facility_id);
CREATE INDEX idx_time_off_employee ON time_off_requests(employee_id);
CREATE INDEX idx_time_off_status ON time_off_requests(status);

-- ============================================================
-- INCIDENT REPORTING (Phase 9)
-- ============================================================

CREATE TABLE incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  rink_id UUID REFERENCES rinks(id) ON DELETE SET NULL,
  incident_number SERIAL,
  type incident_type NOT NULL,
  severity incident_severity NOT NULL DEFAULT 'low',
  status incident_status DEFAULT 'open',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  injured_party_name TEXT,
  injured_party_contact TEXT,
  witnesses TEXT,
  immediate_action TEXT,
  root_cause TEXT,
  reported_by UUID NOT NULL REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  event_time TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_incidents_facility ON incident_reports(facility_id);
CREATE INDEX idx_incidents_type ON incident_reports(type);
CREATE INDEX idx_incidents_severity ON incident_reports(severity);
CREATE INDEX idx_incidents_status ON incident_reports(status);
CREATE INDEX idx_incidents_event_time ON incident_reports(event_time);

CREATE TABLE incident_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
  action_taken TEXT NOT NULL,
  notes TEXT,
  follow_up_by UUID NOT NULL REFERENCES profiles(id),
  follow_up_date TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_follow_ups_incident ON incident_follow_ups(incident_id);
CREATE INDEX idx_follow_ups_facility ON incident_follow_ups(facility_id);

-- ============================================================
-- REFRIGERATION PLANT (Phase 10)
-- ============================================================

CREATE TABLE refrigeration_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
  suction_pressure_psi NUMERIC(8,2),
  discharge_pressure_psi NUMERIC(8,2),
  suction_temperature_f NUMERIC(6,2),
  discharge_temperature_f NUMERIC(6,2),
  oil_pressure_psi NUMERIC(8,2),
  oil_temperature_f NUMERIC(6,2),
  condenser_pressure_psi NUMERIC(8,2),
  condenser_temperature_f NUMERIC(6,2),
  brine_supply_temperature_f NUMERIC(6,2),
  brine_return_temperature_f NUMERIC(6,2),
  slab_temperature_f NUMERIC(6,2),
  room_temperature_f NUMERIC(6,2),
  room_humidity_percent NUMERIC(5,2),
  is_flagged BOOLEAN DEFAULT false,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  event_time TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_refrig_readings_facility ON refrigeration_readings(facility_id);
CREATE INDEX idx_refrig_readings_equipment ON refrigeration_readings(equipment_id);
CREATE INDEX idx_refrig_readings_time ON refrigeration_readings(event_time);

CREATE TABLE refrigeration_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL,
  description TEXT,
  parts_replaced TEXT,
  coolant_added_lbs NUMERIC(8,2),
  cost NUMERIC(10,2),
  performed_by UUID NOT NULL REFERENCES profiles(id),
  vendor TEXT,
  event_time TIMESTAMPTZ DEFAULT now() NOT NULL,
  next_due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_refrig_maint_facility ON refrigeration_maintenance(facility_id);
CREATE INDEX idx_refrig_maint_equipment ON refrigeration_maintenance(equipment_id);

-- ============================================================
-- AIR QUALITY (Phase 11)
-- ============================================================

CREATE TABLE air_quality_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  rink_id UUID REFERENCES rinks(id) ON DELETE SET NULL,
  co_ppm NUMERIC(8,2),         -- Carbon monoxide
  no2_ppm NUMERIC(8,4),        -- Nitrogen dioxide
  humidity_percent NUMERIC(5,2),
  temperature_f NUMERIC(6,2),
  location TEXT,                -- where in the facility
  is_flagged BOOLEAN DEFAULT false,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  event_time TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_air_quality_facility ON air_quality_readings(facility_id);
CREATE INDEX idx_air_quality_rink ON air_quality_readings(rink_id);
CREATE INDEX idx_air_quality_time ON air_quality_readings(event_time);

-- ============================================================
-- NOTIFICATIONS (Phase 12)
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- optional deep link to relevant page
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  channels notification_channel[] DEFAULT ARRAY['in_app']::notification_channel[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_facility ON notifications(facility_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(type);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  in_app BOOLEAN DEFAULT true,
  email BOOLEAN DEFAULT true,
  sms BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, facility_id, notification_type)
);

CREATE INDEX idx_notif_prefs_user ON notification_preferences(user_id);

-- ============================================================
-- REPORTING & EXPORT (Phase 13)
-- ============================================================

CREATE TABLE report_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'compliance', 'custom'
  title TEXT NOT NULL,
  file_format TEXT NOT NULL CHECK (file_format IN ('pdf', 'csv', 'xlsx')),
  file_url TEXT,
  file_size_bytes BIGINT,
  date_range_start DATE,
  date_range_end DATE,
  generated_by UUID NOT NULL REFERENCES profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_report_archives_facility ON report_archives(facility_id);
CREATE INDEX idx_report_archives_type ON report_archives(report_type);

CREATE TABLE scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  title TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  file_format TEXT NOT NULL CHECK (file_format IN ('pdf', 'csv', 'xlsx')),
  recipients UUID[] DEFAULT ARRAY[]::UUID[], -- user IDs
  email_recipients TEXT[] DEFAULT ARRAY[]::TEXT[], -- email addresses
  config JSONB DEFAULT '{}', -- filters, date ranges, etc.
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_scheduled_reports_facility ON scheduled_reports(facility_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with an updated_at column
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'updated_at'
      AND table_schema = 'public'
      AND table_name != 'notifications'
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t
    );
  END LOOP;
END;
$$;

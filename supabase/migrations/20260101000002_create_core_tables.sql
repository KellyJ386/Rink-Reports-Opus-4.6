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
  name TEXT NOT NULL,
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
  x_percent NUMERIC NOT NULL,
  y_percent NUMERIC NOT NULL,
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
  name TEXT NOT NULL,
  equipment_type TEXT NOT NULL,
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
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  min_threshold NUMERIC,
  max_threshold NUMERIC,
  sort_order INTEGER DEFAULT 0,
  is_oil_level BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_reading_types_equipment ON equipment_reading_types(equipment_id);

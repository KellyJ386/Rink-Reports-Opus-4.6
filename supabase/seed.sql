-- Development seed data for MFO platform
-- Run after initial schema migration

-- ============================================================
-- FACILITY
-- ============================================================
INSERT INTO facilities (id, name, short_name, address_line1, city, state_province, postal_code, country, timezone, phone, email, number_of_rinks)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Northside Ice Arena', 'Northside', '1234 Ice Rink Blvd', 'Minneapolis', 'MN', '55401', 'US', 'America/Chicago', '(612) 555-0100', 'info@northsideicearena.com', 2),
  ('00000000-0000-0000-0000-000000000002', 'Lakewood Community Rink', 'Lakewood', '567 Lake St', 'Toronto', 'ON', 'M5V 2T6', 'CA', 'America/Toronto', '(416) 555-0200', 'info@lakewoodrink.ca', 1);

-- ============================================================
-- RINKS
-- ============================================================
INSERT INTO rinks (id, facility_id, name, dimensions_length, dimensions_width, sort_order)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Main Rink', 200, 85, 1),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Studio Rink', 165, 75, 2),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Community Pad', 200, 85, 1);

-- ============================================================
-- RINK ZONES (9-zone grid for ice depth)
-- ============================================================
INSERT INTO rink_zones (facility_id, rink_id, name, label, x_position, y_position, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'nw', 'NW Corner', 15, 15, 1),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'n', 'North Center', 50, 15, 2),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'ne', 'NE Corner', 85, 15, 3),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'w', 'West Center', 15, 50, 4),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'center', 'Center', 50, 50, 5),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'e', 'East Center', 85, 50, 6),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'sw', 'SW Corner', 15, 85, 7),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 's', 'South Center', 50, 85, 8),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'se', 'SE Corner', 85, 85, 9);

-- ============================================================
-- MODULE SETTINGS
-- ============================================================
INSERT INTO module_settings (facility_id, module, is_enabled) VALUES
  ('00000000-0000-0000-0000-000000000001', 'daily_reports', true),
  ('00000000-0000-0000-0000-000000000001', 'ice_depth', true),
  ('00000000-0000-0000-0000-000000000001', 'ice_operations', true),
  ('00000000-0000-0000-0000-000000000001', 'scheduling', true),
  ('00000000-0000-0000-0000-000000000001', 'incidents', true),
  ('00000000-0000-0000-0000-000000000001', 'refrigeration', true),
  ('00000000-0000-0000-0000-000000000001', 'air_quality', true);

-- ============================================================
-- TAB CONFIGURATIONS (Daily Reports)
-- ============================================================
INSERT INTO tab_configurations (id, facility_id, module, name, label, sort_order) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'daily_reports', 'opening', 'Opening Checklist', 1),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'daily_reports', 'ice_conditions', 'Ice Conditions', 2),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'daily_reports', 'closing', 'Closing Checklist', 3);

-- ============================================================
-- CHECKLIST ITEMS
-- ============================================================
INSERT INTO checklist_items (facility_id, tab_id, label, field_type, sort_order, is_required) VALUES
  -- Opening checklist
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Doors unlocked', 'checkbox', 1, true),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Lights on', 'checkbox', 2, true),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'HVAC running', 'checkbox', 3, true),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Lobby temperature', 'temperature', 4, false),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Opening notes', 'text', 5, false),
  -- Ice conditions
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Ice temperature (°F)', 'temperature', 1, true),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Ice surface quality', 'select', 2, true),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Boards in good condition', 'checkbox', 3, false),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Glass clean', 'checkbox', 4, false),
  -- Closing checklist
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'All areas cleared', 'checkbox', 1, true),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Doors locked', 'checkbox', 2, true),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Lights off', 'checkbox', 3, true),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Alarm set', 'checkbox', 4, true),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Closing notes', 'text', 5, false);

-- ============================================================
-- EQUIPMENT
-- ============================================================
INSERT INTO equipment (facility_id, name, type, make, model, year, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Zamboni #1', 'zamboni', 'Zamboni', '552', 2020, 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Zamboni #2', 'zamboni', 'Zamboni', '552', 2018, 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Edger #1', 'edger', 'EDGE', 'AutoEdger Pro', 2021, 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Compressor #1', 'compressor', 'Frick', 'RWB II', 2015, 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Compressor #2', 'compressor', 'Frick', 'RWB II', 2015, 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Brine Pump #1', 'pump', 'Grundfos', 'CR 64-2', 2016, 'active'),
  ('00000000-0000-0000-0000-000000000001', 'Dehumidifier', 'dehumidifier', 'Dectron', 'DRY-O-TRON', 2019, 'active');

-- ============================================================
-- SHIFT TYPES
-- ============================================================
INSERT INTO shift_types (facility_id, name, color, start_time, end_time) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Morning', '#69BE28', '06:00', '14:00'),
  ('00000000-0000-0000-0000-000000000001', 'Afternoon', '#002244', '14:00', '22:00'),
  ('00000000-0000-0000-0000-000000000001', 'Night', '#A5ACAF', '22:00', '06:00');

-- ============================================================
-- THRESHOLDS
-- ============================================================
INSERT INTO thresholds (facility_id, module, metric_name, metric_label, unit, warning_low, warning_high, critical_low, critical_high) VALUES
  -- Ice depth thresholds
  ('00000000-0000-0000-0000-000000000001', 'ice_depth', 'ice_depth', 'Ice Depth', 'inches', 0.75, 1.25, 0.50, 1.50),
  -- Air quality thresholds
  ('00000000-0000-0000-0000-000000000001', 'air_quality', 'co_ppm', 'Carbon Monoxide', 'ppm', NULL, 20, NULL, 35),
  ('00000000-0000-0000-0000-000000000001', 'air_quality', 'no2_ppm', 'Nitrogen Dioxide', 'ppm', NULL, 0.25, NULL, 0.50),
  -- Refrigeration thresholds
  ('00000000-0000-0000-0000-000000000001', 'refrigeration', 'suction_pressure', 'Suction Pressure', 'psi', 20, 40, 15, 50),
  ('00000000-0000-0000-0000-000000000001', 'refrigeration', 'discharge_pressure', 'Discharge Pressure', 'psi', 120, 180, 100, 200),
  ('00000000-0000-0000-0000-000000000001', 'refrigeration', 'slab_temperature', 'Slab Temperature', '°F', 18, 24, 15, 28);

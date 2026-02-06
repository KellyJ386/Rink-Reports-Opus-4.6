-- Seed data for development
-- NOTE: Do NOT seed user data — users are created via Supabase Auth
-- This file populates facility config and reference data only

-- ============================================
-- 1. FACILITY
-- ============================================
INSERT INTO facilities (id, name, address, time_zone, seasonal_operation, session_duration_hours)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Syracuse University Tennity Ice Pavilion',
  '507 Skytop Road, Syracuse, NY 13244',
  'America/New_York',
  FALSE,
  12
);

-- ============================================
-- 2. OPERATING HOURS (Mon-Sun)
-- ============================================
INSERT INTO operating_hours (facility_id, day_of_week, open_time, close_time, is_closed) VALUES
  ('00000000-0000-0000-0000-000000000001', 'monday',    '06:00', '22:00', FALSE),
  ('00000000-0000-0000-0000-000000000001', 'tuesday',   '06:00', '22:00', FALSE),
  ('00000000-0000-0000-0000-000000000001', 'wednesday', '06:00', '22:00', FALSE),
  ('00000000-0000-0000-0000-000000000001', 'thursday',  '06:00', '22:00', FALSE),
  ('00000000-0000-0000-0000-000000000001', 'friday',    '06:00', '23:00', FALSE),
  ('00000000-0000-0000-0000-000000000001', 'saturday',  '07:00', '23:00', FALSE),
  ('00000000-0000-0000-0000-000000000001', 'sunday',    '08:00', '20:00', FALSE);

-- ============================================
-- 3. RINKS
-- ============================================
INSERT INTO rinks (id, facility_id, name, length_ft, width_ft, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Rink A', 200, 85, 1),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Rink B', 200, 85, 2);

-- ============================================
-- 4. ICE DEPTH THRESHOLDS
-- ============================================
INSERT INTO ice_depth_thresholds (facility_id, green_min, green_max, yellow_min, yellow_max, red_min, red_max)
VALUES ('00000000-0000-0000-0000-000000000001', 1.00, 1.74, 1.75, 3.50, 0.00, 0.99);

-- ============================================
-- 5. ICE DEPTH MEASUREMENT POINTS (15 on Rink A)
-- ============================================
INSERT INTO ice_depth_points (rink_id, point_number, x_percent, y_percent) VALUES
  ('00000000-0000-0000-0000-000000000010', 1,  10, 15),
  ('00000000-0000-0000-0000-000000000010', 2,  25, 15),
  ('00000000-0000-0000-0000-000000000010', 3,  50, 15),
  ('00000000-0000-0000-0000-000000000010', 4,  75, 15),
  ('00000000-0000-0000-0000-000000000010', 5,  90, 15),
  ('00000000-0000-0000-0000-000000000010', 6,  10, 50),
  ('00000000-0000-0000-0000-000000000010', 7,  25, 50),
  ('00000000-0000-0000-0000-000000000010', 8,  50, 50),
  ('00000000-0000-0000-0000-000000000010', 9,  75, 50),
  ('00000000-0000-0000-0000-000000000010', 10, 90, 50),
  ('00000000-0000-0000-0000-000000000010', 11, 10, 85),
  ('00000000-0000-0000-0000-000000000010', 12, 25, 85),
  ('00000000-0000-0000-0000-000000000010', 13, 50, 85),
  ('00000000-0000-0000-0000-000000000010', 14, 75, 85),
  ('00000000-0000-0000-0000-000000000010', 15, 90, 85);

-- ============================================
-- 6. MODULE SETTINGS (all enabled by default)
-- ============================================
INSERT INTO module_settings (facility_id, module, is_enabled) VALUES
  ('00000000-0000-0000-0000-000000000001', 'daily_reports',  TRUE),
  ('00000000-0000-0000-0000-000000000001', 'ice_depth',      TRUE),
  ('00000000-0000-0000-0000-000000000001', 'ice_operations',  TRUE),
  ('00000000-0000-0000-0000-000000000001', 'scheduling',      TRUE),
  ('00000000-0000-0000-0000-000000000001', 'incidents',       TRUE),
  ('00000000-0000-0000-0000-000000000001', 'refrigeration',   TRUE),
  ('00000000-0000-0000-0000-000000000001', 'air_quality',     TRUE),
  ('00000000-0000-0000-0000-000000000001', 'admin',           TRUE);

-- ============================================
-- 7. DAILY REPORT TABS (5 tabs)
-- ============================================
INSERT INTO daily_report_tabs (id, facility_id, name, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'Front Desk',    1),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'Zamboni Log',   2),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'Skate Rental',  3),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', 'Concessions',   4),
  ('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', 'Janitorial',    5);

-- ============================================
-- 8. CHECKLIST ITEMS (3-5 per tab per type)
-- ============================================

-- Front Desk - Opening
INSERT INTO checklist_items (tab_id, checklist_type, item_text, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000020', 'opening', 'Unlock front doors', 1),
  ('00000000-0000-0000-0000-000000000020', 'opening', 'Turn on lobby lights', 2),
  ('00000000-0000-0000-0000-000000000020', 'opening', 'Boot up POS system', 3),
  ('00000000-0000-0000-0000-000000000020', 'opening', 'Check voicemail for messages', 4);

-- Front Desk - Closing
INSERT INTO checklist_items (tab_id, checklist_type, item_text, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000020', 'closing', 'Close out POS register', 1),
  ('00000000-0000-0000-0000-000000000020', 'closing', 'Lock front doors', 2),
  ('00000000-0000-0000-0000-000000000020', 'closing', 'Turn off lobby lights', 3);

-- Front Desk - Daily Operations
INSERT INTO checklist_items (tab_id, checklist_type, item_text, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000020', 'daily_operations', 'Check lost and found', 1),
  ('00000000-0000-0000-0000-000000000020', 'daily_operations', 'Verify schedule board is updated', 2),
  ('00000000-0000-0000-0000-000000000020', 'daily_operations', 'Restock brochures and flyers', 3);

-- Zamboni Log - Opening
INSERT INTO checklist_items (tab_id, checklist_type, item_text, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000021', 'opening', 'Check fuel/charge levels', 1),
  ('00000000-0000-0000-0000-000000000021', 'opening', 'Inspect blade condition', 2),
  ('00000000-0000-0000-0000-000000000021', 'opening', 'Verify water tank is filled', 3);

-- Zamboni Log - Closing
INSERT INTO checklist_items (tab_id, checklist_type, item_text, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000021', 'closing', 'Drain wash water', 1),
  ('00000000-0000-0000-0000-000000000021', 'closing', 'Park in designated area', 2),
  ('00000000-0000-0000-0000-000000000021', 'closing', 'Plug in electric unit for charging', 3);

-- Zamboni Log - Daily Operations
INSERT INTO checklist_items (tab_id, checklist_type, item_text, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000021', 'daily_operations', 'Record ice makes in system', 1),
  ('00000000-0000-0000-0000-000000000021', 'daily_operations', 'Report any mechanical issues', 2),
  ('00000000-0000-0000-0000-000000000021', 'daily_operations', 'Clean snow pit area', 3);

-- Skate Rental - Opening
INSERT INTO checklist_items (tab_id, checklist_type, item_text, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000022', 'opening', 'Organize skates by size', 1),
  ('00000000-0000-0000-0000-000000000022', 'opening', 'Inspect skates for damage', 2),
  ('00000000-0000-0000-0000-000000000022', 'opening', 'Set up rental counter', 3);

-- Skate Rental - Closing
INSERT INTO checklist_items (tab_id, checklist_type, item_text, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000022', 'closing', 'Collect all returned skates', 1),
  ('00000000-0000-0000-0000-000000000022', 'closing', 'Sanitize skates', 2),
  ('00000000-0000-0000-0000-000000000022', 'closing', 'Reconcile rental count', 3);

-- Concessions - Opening
INSERT INTO checklist_items (tab_id, checklist_type, item_text, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000023', 'opening', 'Turn on equipment (coffee maker, etc)', 1),
  ('00000000-0000-0000-0000-000000000023', 'opening', 'Check food expiry dates', 2),
  ('00000000-0000-0000-0000-000000000023', 'opening', 'Restock display items', 3);

-- Concessions - Closing
INSERT INTO checklist_items (tab_id, checklist_type, item_text, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000023', 'closing', 'Clean all surfaces and equipment', 1),
  ('00000000-0000-0000-0000-000000000023', 'closing', 'Turn off equipment', 2),
  ('00000000-0000-0000-0000-000000000023', 'closing', 'Take out trash', 3);

-- Janitorial - Opening
INSERT INTO checklist_items (tab_id, checklist_type, item_text, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000024', 'opening', 'Clean restrooms', 1),
  ('00000000-0000-0000-0000-000000000024', 'opening', 'Mop lobby floor', 2),
  ('00000000-0000-0000-0000-000000000024', 'opening', 'Empty trash cans', 3);

-- Janitorial - Closing
INSERT INTO checklist_items (tab_id, checklist_type, item_text, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000024', 'closing', 'Final restroom cleaning', 1),
  ('00000000-0000-0000-0000-000000000024', 'closing', 'Vacuum carpeted areas', 2),
  ('00000000-0000-0000-0000-000000000024', 'closing', 'Lock supply closet', 3),
  ('00000000-0000-0000-0000-000000000024', 'closing', 'Set alarm system', 4);

-- ============================================
-- 9. MACHINES (2 Zambonis)
-- ============================================
INSERT INTO machines (id, facility_id, name, fuel_type, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 'Zamboni #1', 'gas', 1),
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', 'Zamboni #2', 'electric', 2);

-- ============================================
-- 10. CIRCLE CHECK ITEMS (per machine, 10 each)
-- ============================================

-- Zamboni #1 (Gas)
INSERT INTO circle_check_items (machine_id, item_text, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000030', 'Check engine oil level', 1),
  ('00000000-0000-0000-0000-000000000030', 'Check coolant level', 2),
  ('00000000-0000-0000-0000-000000000030', 'Check fuel level', 3),
  ('00000000-0000-0000-0000-000000000030', 'Inspect blade condition and alignment', 4),
  ('00000000-0000-0000-0000-000000000030', 'Check tire pressure', 5),
  ('00000000-0000-0000-0000-000000000030', 'Test lights and signals', 6),
  ('00000000-0000-0000-0000-000000000030', 'Check wash water system', 7),
  ('00000000-0000-0000-0000-000000000030', 'Inspect conveyor belt', 8),
  ('00000000-0000-0000-0000-000000000030', 'Check hydraulic system', 9),
  ('00000000-0000-0000-0000-000000000030', 'Verify emergency shut-off', 10);

-- Zamboni #2 (Electric)
INSERT INTO circle_check_items (machine_id, item_text, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000031', 'Check battery charge level', 1),
  ('00000000-0000-0000-0000-000000000031', 'Inspect charging cable condition', 2),
  ('00000000-0000-0000-0000-000000000031', 'Inspect blade condition and alignment', 3),
  ('00000000-0000-0000-0000-000000000031', 'Check tire pressure', 4),
  ('00000000-0000-0000-0000-000000000031', 'Test lights and signals', 5),
  ('00000000-0000-0000-0000-000000000031', 'Check wash water system', 6),
  ('00000000-0000-0000-0000-000000000031', 'Inspect conveyor belt', 7),
  ('00000000-0000-0000-0000-000000000031', 'Check hydraulic system', 8),
  ('00000000-0000-0000-0000-000000000031', 'Verify emergency shut-off', 9),
  ('00000000-0000-0000-0000-000000000031', 'Check battery water level', 10);

-- ============================================
-- 11. REFRIGERATION EQUIPMENT
-- ============================================
INSERT INTO equipment (id, facility_id, name, equipment_type, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', 'Compressor #1 - Rink A', 'compressor', 1),
  ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001', 'Compressor #2 - Rink B', 'compressor', 2),
  ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000001', 'Glycol Pump #1',         'pump',       3);

-- Equipment Reading Types with thresholds
-- Compressor #1
INSERT INTO equipment_reading_types (equipment_id, name, unit, min_threshold, max_threshold, sort_order, is_oil_level) VALUES
  ('00000000-0000-0000-0000-000000000040', 'Suction Pressure',    'PSI', 20,  40,  1, FALSE),
  ('00000000-0000-0000-0000-000000000040', 'Head Pressure',       'PSI', 150, 220, 2, FALSE),
  ('00000000-0000-0000-0000-000000000040', 'Oil Pressure',        'PSI', 40,  80,  3, FALSE),
  ('00000000-0000-0000-0000-000000000040', 'Oil Level',           NULL,  NULL, NULL, 4, TRUE),
  ('00000000-0000-0000-0000-000000000040', 'Discharge Temp',      '°F',  100, 200, 5, FALSE),
  ('00000000-0000-0000-0000-000000000040', 'Suction Temp',        '°F',  10,  40,  6, FALSE);

-- Compressor #2
INSERT INTO equipment_reading_types (equipment_id, name, unit, min_threshold, max_threshold, sort_order, is_oil_level) VALUES
  ('00000000-0000-0000-0000-000000000041', 'Suction Pressure',    'PSI', 20,  40,  1, FALSE),
  ('00000000-0000-0000-0000-000000000041', 'Head Pressure',       'PSI', 150, 220, 2, FALSE),
  ('00000000-0000-0000-0000-000000000041', 'Oil Pressure',        'PSI', 40,  80,  3, FALSE),
  ('00000000-0000-0000-0000-000000000041', 'Oil Level',           NULL,  NULL, NULL, 4, TRUE),
  ('00000000-0000-0000-0000-000000000041', 'Discharge Temp',      '°F',  100, 200, 5, FALSE),
  ('00000000-0000-0000-0000-000000000041', 'Suction Temp',        '°F',  10,  40,  6, FALSE);

-- Glycol Pump
INSERT INTO equipment_reading_types (equipment_id, name, unit, min_threshold, max_threshold, sort_order, is_oil_level) VALUES
  ('00000000-0000-0000-0000-000000000042', 'Glycol Pressure',     'PSI', 15, 30,  1, FALSE),
  ('00000000-0000-0000-0000-000000000042', 'Glycol Temperature',  '°F',  15, 28,  2, FALSE),
  ('00000000-0000-0000-0000-000000000042', 'Flow Rate',           'GPM', 80, 150, 3, FALSE);

-- ============================================
-- 12. SHIFT TYPES
-- ============================================
INSERT INTO shift_types (facility_id, name, color, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Zamboni Operator', '#69BE28', 1),
  ('00000000-0000-0000-0000-000000000001', 'Front Desk',       '#002244', 2),
  ('00000000-0000-0000-0000-000000000001', 'Skate Rental',     '#FFB800', 3),
  ('00000000-0000-0000-0000-000000000001', 'Maintenance',      '#A5ACAF', 4);

-- ============================================
-- 13. INCIDENT LOCATIONS
-- ============================================
INSERT INTO incident_locations (facility_id, name, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Rink A - Ice Surface', 1),
  ('00000000-0000-0000-0000-000000000001', 'Rink B - Ice Surface', 2),
  ('00000000-0000-0000-0000-000000000001', 'Lobby',               3),
  ('00000000-0000-0000-0000-000000000001', 'Locker Room A',       4),
  ('00000000-0000-0000-0000-000000000001', 'Parking Lot',         5);

-- ============================================
-- 14. AIR QUALITY METRICS (with thresholds)
-- ============================================
INSERT INTO air_quality_metrics (facility_id, name, unit, min_threshold, max_threshold, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Carbon Monoxide (CO)', 'PPM',  NULL, 25,   1),
  ('00000000-0000-0000-0000-000000000001', 'Carbon Dioxide (CO2)', 'PPM',  NULL, 5000, 2),
  ('00000000-0000-0000-0000-000000000001', 'Nitrogen Dioxide (NO2)', 'PPM', NULL, 1,   3),
  ('00000000-0000-0000-0000-000000000001', 'Humidity',             '%',    30,   60,   4),
  ('00000000-0000-0000-0000-000000000001', 'Temperature',          '°F',   55,   75,   5);

-- ============================================
-- 15. AIR QUALITY LOCATIONS
-- ============================================
INSERT INTO air_quality_locations (facility_id, name, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Ice Level',  1),
  ('00000000-0000-0000-0000-000000000001', 'Stands',     2),
  ('00000000-0000-0000-0000-000000000001', 'Lobby',      3);

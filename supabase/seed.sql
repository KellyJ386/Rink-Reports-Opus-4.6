-- ============================================
-- SEED DATA FOR DEVELOPMENT
-- ============================================

-- 1 Facility
INSERT INTO facilities (id, name, address, time_zone, seasonal_operation, open_months)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Syracuse University Tennity Ice Pavilion',
  '711 Comstock Ave, Syracuse, NY 13210',
  'America/New_York',
  TRUE,
  ARRAY[9,10,11,12,1,2,3,4]
);

-- Operating Hours (Mon-Sun)
INSERT INTO operating_hours (facility_id, day_of_week, open_time, close_time, is_closed) VALUES
('00000000-0000-0000-0000-000000000001', 'monday',    '06:00', '23:00', FALSE),
('00000000-0000-0000-0000-000000000001', 'tuesday',   '06:00', '23:00', FALSE),
('00000000-0000-0000-0000-000000000001', 'wednesday', '06:00', '23:00', FALSE),
('00000000-0000-0000-0000-000000000001', 'thursday',  '06:00', '23:00', FALSE),
('00000000-0000-0000-0000-000000000001', 'friday',    '06:00', '23:59', FALSE),
('00000000-0000-0000-0000-000000000001', 'saturday',  '07:00', '23:59', FALSE),
('00000000-0000-0000-0000-000000000001', 'sunday',    '07:00', '22:00', FALSE);

-- 2 Rinks
INSERT INTO rinks (id, facility_id, name, length_ft, width_ft, sort_order) VALUES
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Rink A', 200, 85, 1),
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Rink B', 200, 85, 2);

-- Default module settings (all enabled)
INSERT INTO module_settings (facility_id, module, is_enabled) VALUES
('00000000-0000-0000-0000-000000000001', 'daily_reports', TRUE),
('00000000-0000-0000-0000-000000000001', 'ice_depth', TRUE),
('00000000-0000-0000-0000-000000000001', 'ice_operations', TRUE),
('00000000-0000-0000-0000-000000000001', 'scheduling', TRUE),
('00000000-0000-0000-0000-000000000001', 'incidents', TRUE),
('00000000-0000-0000-0000-000000000001', 'refrigeration', TRUE),
('00000000-0000-0000-0000-000000000001', 'air_quality', TRUE),
('00000000-0000-0000-0000-000000000001', 'admin', TRUE);

-- 5 Daily Report Tabs
INSERT INTO daily_report_tabs (id, facility_id, name, sort_order) VALUES
('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'Front Desk', 1),
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'Zamboni Log', 2),
('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'Skate Rental', 3),
('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', 'Concessions', 4),
('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', 'Janitorial', 5);

-- Checklist items: Front Desk
INSERT INTO checklist_items (tab_id, checklist_type, item_text, sort_order) VALUES
('00000000-0000-0000-0000-000000000020', 'opening', 'Unlock front doors', 1),
('00000000-0000-0000-0000-000000000020', 'opening', 'Turn on lobby lights', 2),
('00000000-0000-0000-0000-000000000020', 'opening', 'Boot up POS system', 3),
('00000000-0000-0000-0000-000000000020', 'closing', 'Lock front doors', 1),
('00000000-0000-0000-0000-000000000020', 'closing', 'Shut down POS system', 2),
('00000000-0000-0000-0000-000000000020', 'closing', 'Set alarm system', 3),
('00000000-0000-0000-0000-000000000020', 'daily_operations', 'Check lost and found', 1),
('00000000-0000-0000-0000-000000000020', 'daily_operations', 'Verify schedule posted', 2),
('00000000-0000-0000-0000-000000000020', 'daily_operations', 'Restock brochures', 3);

-- Checklist items: Zamboni Log
INSERT INTO checklist_items (tab_id, checklist_type, item_text, sort_order) VALUES
('00000000-0000-0000-0000-000000000021', 'opening', 'Check Zamboni fuel levels', 1),
('00000000-0000-0000-0000-000000000021', 'opening', 'Inspect blades for damage', 2),
('00000000-0000-0000-0000-000000000021', 'opening', 'Fill wash water tank', 3),
('00000000-0000-0000-0000-000000000021', 'closing', 'Park Zamboni in bay', 1),
('00000000-0000-0000-0000-000000000021', 'closing', 'Drain wash water', 2),
('00000000-0000-0000-0000-000000000021', 'closing', 'Clean snow pit', 3),
('00000000-0000-0000-0000-000000000021', 'daily_operations', 'Log resurfacing times', 1),
('00000000-0000-0000-0000-000000000021', 'daily_operations', 'Check conditioner cloth', 2),
('00000000-0000-0000-0000-000000000021', 'daily_operations', 'Record machine hours', 3);

-- Checklist items: Skate Rental
INSERT INTO checklist_items (tab_id, checklist_type, item_text, sort_order) VALUES
('00000000-0000-0000-0000-000000000022', 'opening', 'Set up rental counter', 1),
('00000000-0000-0000-0000-000000000022', 'opening', 'Count skate inventory', 2),
('00000000-0000-0000-0000-000000000022', 'opening', 'Check skate condition', 3),
('00000000-0000-0000-0000-000000000022', 'closing', 'Collect all rental skates', 1),
('00000000-0000-0000-0000-000000000022', 'closing', 'Sanitize skates', 2),
('00000000-0000-0000-0000-000000000022', 'closing', 'Lock rental storage', 3),
('00000000-0000-0000-0000-000000000022', 'daily_operations', 'Sharpen dull skates', 1),
('00000000-0000-0000-0000-000000000022', 'daily_operations', 'Replace broken laces', 2),
('00000000-0000-0000-0000-000000000022', 'daily_operations', 'Log rental counts', 3);

-- Checklist items: Concessions
INSERT INTO checklist_items (tab_id, checklist_type, item_text, sort_order) VALUES
('00000000-0000-0000-0000-000000000023', 'opening', 'Turn on coffee machine', 1),
('00000000-0000-0000-0000-000000000023', 'opening', 'Check food stock', 2),
('00000000-0000-0000-0000-000000000023', 'opening', 'Set up display', 3),
('00000000-0000-0000-0000-000000000023', 'closing', 'Clean all surfaces', 1),
('00000000-0000-0000-0000-000000000023', 'closing', 'Empty trash bins', 2),
('00000000-0000-0000-0000-000000000023', 'closing', 'Secure cash drawer', 3),
('00000000-0000-0000-0000-000000000023', 'daily_operations', 'Record temperature logs', 1),
('00000000-0000-0000-0000-000000000023', 'daily_operations', 'Restock beverages', 2),
('00000000-0000-0000-0000-000000000023', 'daily_operations', 'Wipe down tables', 3);

-- Checklist items: Janitorial
INSERT INTO checklist_items (tab_id, checklist_type, item_text, sort_order) VALUES
('00000000-0000-0000-0000-000000000024', 'opening', 'Mop lobby floor', 1),
('00000000-0000-0000-0000-000000000024', 'opening', 'Clean restrooms', 2),
('00000000-0000-0000-0000-000000000024', 'opening', 'Empty overnight trash', 3),
('00000000-0000-0000-0000-000000000024', 'closing', 'Final restroom check', 1),
('00000000-0000-0000-0000-000000000024', 'closing', 'Mop all floors', 2),
('00000000-0000-0000-0000-000000000024', 'closing', 'Lock supply closet', 3),
('00000000-0000-0000-0000-000000000024', 'daily_operations', 'Spot-clean locker rooms', 1),
('00000000-0000-0000-0000-000000000024', 'daily_operations', 'Restock paper products', 2),
('00000000-0000-0000-0000-000000000024', 'daily_operations', 'Check soap dispensers', 3);

-- 2 Machines
INSERT INTO machines (id, facility_id, name, fuel_type, sort_order) VALUES
('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 'Zamboni #1 - Gas', 'gas', 1),
('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', 'Zamboni #2 - Electric', 'electric', 2);

-- 10 Circle check items per machine
INSERT INTO circle_check_items (machine_id, item_text, sort_order) VALUES
('00000000-0000-0000-0000-000000000030', 'Check tire pressure', 1),
('00000000-0000-0000-0000-000000000030', 'Inspect blade condition', 2),
('00000000-0000-0000-0000-000000000030', 'Check oil level', 3),
('00000000-0000-0000-0000-000000000030', 'Inspect conditioner towel', 4),
('00000000-0000-0000-0000-000000000030', 'Check wash water system', 5),
('00000000-0000-0000-0000-000000000030', 'Verify lights working', 6),
('00000000-0000-0000-0000-000000000030', 'Check hydraulic fluid', 7),
('00000000-0000-0000-0000-000000000030', 'Inspect snow tank', 8),
('00000000-0000-0000-0000-000000000030', 'Check fuel level', 9),
('00000000-0000-0000-0000-000000000030', 'Test horn/backup alarm', 10),
('00000000-0000-0000-0000-000000000031', 'Check tire pressure', 1),
('00000000-0000-0000-0000-000000000031', 'Inspect blade condition', 2),
('00000000-0000-0000-0000-000000000031', 'Check battery charge level', 3),
('00000000-0000-0000-0000-000000000031', 'Inspect conditioner towel', 4),
('00000000-0000-0000-0000-000000000031', 'Check wash water system', 5),
('00000000-0000-0000-0000-000000000031', 'Verify lights working', 6),
('00000000-0000-0000-0000-000000000031', 'Check hydraulic fluid', 7),
('00000000-0000-0000-0000-000000000031', 'Inspect snow tank', 8),
('00000000-0000-0000-0000-000000000031', 'Verify charging cable intact', 9),
('00000000-0000-0000-0000-000000000031', 'Test horn/backup alarm', 10);

-- Equipment: 2 compressors + 1 glycol pump
INSERT INTO equipment (id, facility_id, name, equipment_type, sort_order) VALUES
('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', 'Compressor #1 - Rink A', 'compressor', 1),
('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001', 'Compressor #2 - Rink B', 'compressor', 2),
('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000001', 'Glycol Pump #1', 'pump', 3);

-- Equipment reading types with thresholds
INSERT INTO equipment_reading_types (equipment_id, name, unit, min_threshold, max_threshold, sort_order, is_oil_level) VALUES
('00000000-0000-0000-0000-000000000040', 'Head Pressure', 'PSI', 150, 250, 1, FALSE),
('00000000-0000-0000-0000-000000000040', 'Suction Pressure', 'PSI', 20, 50, 2, FALSE),
('00000000-0000-0000-0000-000000000040', 'Oil Pressure', 'PSI', 40, 80, 3, FALSE),
('00000000-0000-0000-0000-000000000040', 'Oil Level', NULL, NULL, NULL, 4, TRUE),
('00000000-0000-0000-0000-000000000040', 'Discharge Temp', '°F', 120, 200, 5, FALSE),
('00000000-0000-0000-0000-000000000041', 'Head Pressure', 'PSI', 150, 250, 1, FALSE),
('00000000-0000-0000-0000-000000000041', 'Suction Pressure', 'PSI', 20, 50, 2, FALSE),
('00000000-0000-0000-0000-000000000041', 'Oil Pressure', 'PSI', 40, 80, 3, FALSE),
('00000000-0000-0000-0000-000000000041', 'Oil Level', NULL, NULL, NULL, 4, TRUE),
('00000000-0000-0000-0000-000000000041', 'Discharge Temp', '°F', 120, 200, 5, FALSE),
('00000000-0000-0000-0000-000000000042', 'Flow Rate', 'GPM', 30, 80, 1, FALSE),
('00000000-0000-0000-0000-000000000042', 'Inlet Temp', '°F', 15, 30, 2, FALSE),
('00000000-0000-0000-0000-000000000042', 'Outlet Temp', '°F', 10, 25, 3, FALSE);

-- Default ice depth thresholds
INSERT INTO ice_depth_thresholds (facility_id, green_min, green_max, yellow_min, yellow_max, red_min, red_max)
VALUES ('00000000-0000-0000-0000-000000000001', 1.00, 1.74, 1.75, 3.50, 0.00, 0.99);

-- 15 measurement points on Rink A (5x3 grid pattern)
INSERT INTO ice_depth_points (rink_id, point_number, x_percent, y_percent) VALUES
('00000000-0000-0000-0000-000000000010', 1,  10, 20),
('00000000-0000-0000-0000-000000000010', 2,  10, 50),
('00000000-0000-0000-0000-000000000010', 3,  10, 80),
('00000000-0000-0000-0000-000000000010', 4,  30, 20),
('00000000-0000-0000-0000-000000000010', 5,  30, 50),
('00000000-0000-0000-0000-000000000010', 6,  30, 80),
('00000000-0000-0000-0000-000000000010', 7,  50, 20),
('00000000-0000-0000-0000-000000000010', 8,  50, 50),
('00000000-0000-0000-0000-000000000010', 9,  50, 80),
('00000000-0000-0000-0000-000000000010', 10, 70, 20),
('00000000-0000-0000-0000-000000000010', 11, 70, 50),
('00000000-0000-0000-0000-000000000010', 12, 70, 80),
('00000000-0000-0000-0000-000000000010', 13, 90, 20),
('00000000-0000-0000-0000-000000000010', 14, 90, 50),
('00000000-0000-0000-0000-000000000010', 15, 90, 80);

-- 4 Shift types
INSERT INTO shift_types (facility_id, name, color, sort_order) VALUES
('00000000-0000-0000-0000-000000000001', 'Zamboni Operator', '#69BE28', 1),
('00000000-0000-0000-0000-000000000001', 'Front Desk', '#002244', 2),
('00000000-0000-0000-0000-000000000001', 'Skate Rental', '#A5ACAF', 3),
('00000000-0000-0000-0000-000000000001', 'Maintenance', '#FFB800', 4);

-- 5 Incident locations
INSERT INTO incident_locations (facility_id, name, sort_order) VALUES
('00000000-0000-0000-0000-000000000001', 'Main Rink (Rink A)', 1),
('00000000-0000-0000-0000-000000000001', 'Rink B', 2),
('00000000-0000-0000-0000-000000000001', 'Lobby', 3),
('00000000-0000-0000-0000-000000000001', 'Locker Room A', 4),
('00000000-0000-0000-0000-000000000001', 'Locker Room B', 5);

-- Default air quality metrics with thresholds
INSERT INTO air_quality_metrics (facility_id, name, unit, min_threshold, max_threshold, sort_order) VALUES
('00000000-0000-0000-0000-000000000001', 'Carbon Monoxide (CO)', 'PPM', NULL, 25, 1),
('00000000-0000-0000-0000-000000000001', 'Carbon Dioxide (CO2)', 'PPM', NULL, 5000, 2),
('00000000-0000-0000-0000-000000000001', 'Nitrogen Dioxide (NO2)', 'PPM', NULL, 0.5, 3),
('00000000-0000-0000-0000-000000000001', 'Relative Humidity', '%', 30, 60, 4),
('00000000-0000-0000-0000-000000000001', 'Temperature', '°F', 50, 65, 5);

-- 3 Air quality monitoring locations
INSERT INTO air_quality_locations (facility_id, name, sort_order) VALUES
('00000000-0000-0000-0000-000000000001', 'Ice Level', 1),
('00000000-0000-0000-0000-000000000001', 'Stands', 2),
('00000000-0000-0000-0000-000000000001', 'Lobby', 3);

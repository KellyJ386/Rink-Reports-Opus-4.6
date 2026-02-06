-- Migration: Create RLS policies for all tables
-- Agent 02 - Step 1

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ice_depth_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE ice_depth_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_reading_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_report_tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_check_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE air_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE air_quality_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_report_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ice_depth_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ice_makes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blade_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE edging_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_check_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE refrigeration_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE refrigeration_reading_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE air_quality_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE air_quality_reading_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_report_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get current user's facility_id
CREATE OR REPLACE FUNCTION get_user_facility_id()
RETURNS UUID AS $$
  SELECT facility_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user has admin-level access (facility_admin+)
CREATE OR REPLACE FUNCTION is_admin_role()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('facility_admin', 'super_admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user has manager-level access (manager+)
CREATE OR REPLACE FUNCTION is_manager_or_above()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('facility_admin', 'super_admin', 'manager');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user has supervisor-level access (supervisor+)
CREATE OR REPLACE FUNCTION is_supervisor_or_above()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('facility_admin', 'super_admin', 'manager', 'supervisor');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user can write (not read_only)
CREATE OR REPLACE FUNCTION can_write()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() != 'read_only';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- FACILITIES
-- ============================================
CREATE POLICY facilities_select ON facilities
  FOR SELECT USING (id = get_user_facility_id());

CREATE POLICY facilities_update ON facilities
  FOR UPDATE USING (is_admin_role() AND id = get_user_facility_id());

-- ============================================
-- OPERATING HOURS
-- ============================================
CREATE POLICY operating_hours_select ON operating_hours
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY operating_hours_insert ON operating_hours
  FOR INSERT WITH CHECK (is_admin_role() AND facility_id = get_user_facility_id());

CREATE POLICY operating_hours_update ON operating_hours
  FOR UPDATE USING (is_admin_role() AND facility_id = get_user_facility_id());

CREATE POLICY operating_hours_delete ON operating_hours
  FOR DELETE USING (is_admin_role() AND facility_id = get_user_facility_id());

-- ============================================
-- PROFILES
-- ============================================
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY profiles_update_admin ON profiles
  FOR UPDATE USING (is_admin_role() AND facility_id = get_user_facility_id());

-- ============================================
-- RINKS
-- ============================================
CREATE POLICY rinks_select ON rinks
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY rinks_insert ON rinks
  FOR INSERT WITH CHECK (is_admin_role() AND facility_id = get_user_facility_id());

CREATE POLICY rinks_update ON rinks
  FOR UPDATE USING (is_admin_role() AND facility_id = get_user_facility_id());

CREATE POLICY rinks_delete ON rinks
  FOR DELETE USING (is_admin_role() AND facility_id = get_user_facility_id());

-- ============================================
-- ICE DEPTH POINTS
-- ============================================
CREATE POLICY ice_depth_points_select ON ice_depth_points
  FOR SELECT USING (
    rink_id IN (SELECT id FROM rinks WHERE facility_id = get_user_facility_id())
  );

CREATE POLICY ice_depth_points_insert ON ice_depth_points
  FOR INSERT WITH CHECK (
    is_admin_role() AND rink_id IN (SELECT id FROM rinks WHERE facility_id = get_user_facility_id())
  );

CREATE POLICY ice_depth_points_update ON ice_depth_points
  FOR UPDATE USING (
    is_admin_role() AND rink_id IN (SELECT id FROM rinks WHERE facility_id = get_user_facility_id())
  );

CREATE POLICY ice_depth_points_delete ON ice_depth_points
  FOR DELETE USING (
    is_admin_role() AND rink_id IN (SELECT id FROM rinks WHERE facility_id = get_user_facility_id())
  );

-- ============================================
-- ICE DEPTH THRESHOLDS
-- ============================================
CREATE POLICY ice_depth_thresholds_select ON ice_depth_thresholds
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY ice_depth_thresholds_insert ON ice_depth_thresholds
  FOR INSERT WITH CHECK (is_admin_role() AND facility_id = get_user_facility_id());

CREATE POLICY ice_depth_thresholds_update ON ice_depth_thresholds
  FOR UPDATE USING (is_admin_role() AND facility_id = get_user_facility_id());

CREATE POLICY ice_depth_thresholds_delete ON ice_depth_thresholds
  FOR DELETE USING (is_admin_role() AND facility_id = get_user_facility_id());

-- ============================================
-- MACHINES
-- ============================================
CREATE POLICY machines_select ON machines
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY machines_insert ON machines
  FOR INSERT WITH CHECK (is_admin_role() AND facility_id = get_user_facility_id());

CREATE POLICY machines_update ON machines
  FOR UPDATE USING (is_admin_role() AND facility_id = get_user_facility_id());

CREATE POLICY machines_delete ON machines
  FOR DELETE USING (is_admin_role() AND facility_id = get_user_facility_id());

-- ============================================
-- EQUIPMENT
-- ============================================
CREATE POLICY equipment_select ON equipment
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY equipment_insert ON equipment
  FOR INSERT WITH CHECK (is_admin_role() AND facility_id = get_user_facility_id());

CREATE POLICY equipment_update ON equipment
  FOR UPDATE USING (is_admin_role() AND facility_id = get_user_facility_id());

CREATE POLICY equipment_delete ON equipment
  FOR DELETE USING (is_admin_role() AND facility_id = get_user_facility_id());

-- ============================================
-- EQUIPMENT READING TYPES
-- ============================================
CREATE POLICY equipment_reading_types_select ON equipment_reading_types
  FOR SELECT USING (
    equipment_id IN (SELECT id FROM equipment WHERE facility_id = get_user_facility_id())
  );

CREATE POLICY equipment_reading_types_insert ON equipment_reading_types
  FOR INSERT WITH CHECK (
    is_admin_role() AND equipment_id IN (SELECT id FROM equipment WHERE facility_id = get_user_facility_id())
  );

CREATE POLICY equipment_reading_types_update ON equipment_reading_types
  FOR UPDATE USING (
    is_admin_role() AND equipment_id IN (SELECT id FROM equipment WHERE facility_id = get_user_facility_id())
  );

CREATE POLICY equipment_reading_types_delete ON equipment_reading_types
  FOR DELETE USING (
    is_admin_role() AND equipment_id IN (SELECT id FROM equipment WHERE facility_id = get_user_facility_id())
  );

-- ============================================
-- MODULE SETTINGS (admin config)
-- ============================================
CREATE POLICY module_settings_select ON module_settings
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY module_settings_insert ON module_settings
  FOR INSERT WITH CHECK (is_admin_role() AND facility_id = get_user_facility_id());

CREATE POLICY module_settings_update ON module_settings
  FOR UPDATE USING (is_admin_role() AND facility_id = get_user_facility_id());

CREATE POLICY module_settings_delete ON module_settings
  FOR DELETE USING (is_admin_role() AND facility_id = get_user_facility_id());

-- ============================================
-- DAILY REPORT TABS (admin config)
-- ============================================
CREATE POLICY daily_report_tabs_select ON daily_report_tabs
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY daily_report_tabs_insert ON daily_report_tabs
  FOR INSERT WITH CHECK (is_admin_role() AND facility_id = get_user_facility_id());

CREATE POLICY daily_report_tabs_update ON daily_report_tabs
  FOR UPDATE USING (is_admin_role() AND facility_id = get_user_facility_id());

CREATE POLICY daily_report_tabs_delete ON daily_report_tabs
  FOR DELETE USING (is_admin_role() AND facility_id = get_user_facility_id());

-- ============================================
-- CHECKLIST ITEMS (admin config)
-- ============================================
CREATE POLICY checklist_items_select ON checklist_items
  FOR SELECT USING (
    tab_id IN (SELECT id FROM daily_report_tabs WHERE facility_id = get_user_facility_id())
  );

CREATE POLICY checklist_items_insert ON checklist_items
  FOR INSERT WITH CHECK (
    is_admin_role() AND tab_id IN (SELECT id FROM daily_report_tabs WHERE facility_id = get_user_facility_id())
  );

CREATE POLICY checklist_items_update ON checklist_items
  FOR UPDATE USING (
    is_admin_role() AND tab_id IN (SELECT id FROM daily_report_tabs WHERE facility_id = get_user_facility_id())
  );

CREATE POLICY checklist_items_delete ON checklist_items
  FOR DELETE USING (
    is_admin_role() AND tab_id IN (SELECT id FROM daily_report_tabs WHERE facility_id = get_user_facility_id())
  );

-- ============================================
-- CIRCLE CHECK ITEMS (admin config)
-- ============================================
CREATE POLICY circle_check_items_select ON circle_check_items
  FOR SELECT USING (
    machine_id IN (SELECT id FROM machines WHERE facility_id = get_user_facility_id())
  );

CREATE POLICY circle_check_items_insert ON circle_check_items
  FOR INSERT WITH CHECK (
    is_admin_role() AND machine_id IN (SELECT id FROM machines WHERE facility_id = get_user_facility_id())
  );

CREATE POLICY circle_check_items_update ON circle_check_items
  FOR UPDATE USING (
    is_admin_role() AND machine_id IN (SELECT id FROM machines WHERE facility_id = get_user_facility_id())
  );

CREATE POLICY circle_check_items_delete ON circle_check_items
  FOR DELETE USING (
    is_admin_role() AND machine_id IN (SELECT id FROM machines WHERE facility_id = get_user_facility_id())
  );

-- ============================================
-- SHIFT TYPES (admin config)
-- ============================================
CREATE POLICY shift_types_select ON shift_types
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY shift_types_insert ON shift_types
  FOR INSERT WITH CHECK (is_admin_role() AND facility_id = get_user_facility_id());

CREATE POLICY shift_types_update ON shift_types
  FOR UPDATE USING (is_admin_role() AND facility_id = get_user_facility_id());

CREATE POLICY shift_types_delete ON shift_types
  FOR DELETE USING (is_admin_role() AND facility_id = get_user_facility_id());

-- ============================================
-- INCIDENT LOCATIONS (admin config)
-- ============================================
CREATE POLICY incident_locations_select ON incident_locations
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY incident_locations_insert ON incident_locations
  FOR INSERT WITH CHECK (is_admin_role() AND facility_id = get_user_facility_id());

CREATE POLICY incident_locations_update ON incident_locations
  FOR UPDATE USING (is_admin_role() AND facility_id = get_user_facility_id());

CREATE POLICY incident_locations_delete ON incident_locations
  FOR DELETE USING (is_admin_role() AND facility_id = get_user_facility_id());

-- ============================================
-- AIR QUALITY METRICS (admin config)
-- ============================================
CREATE POLICY air_quality_metrics_select ON air_quality_metrics
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY air_quality_metrics_insert ON air_quality_metrics
  FOR INSERT WITH CHECK (is_admin_role() AND facility_id = get_user_facility_id());

CREATE POLICY air_quality_metrics_update ON air_quality_metrics
  FOR UPDATE USING (is_admin_role() AND facility_id = get_user_facility_id());

CREATE POLICY air_quality_metrics_delete ON air_quality_metrics
  FOR DELETE USING (is_admin_role() AND facility_id = get_user_facility_id());

-- ============================================
-- AIR QUALITY LOCATIONS (admin config)
-- ============================================
CREATE POLICY air_quality_locations_select ON air_quality_locations
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY air_quality_locations_insert ON air_quality_locations
  FOR INSERT WITH CHECK (is_admin_role() AND facility_id = get_user_facility_id());

CREATE POLICY air_quality_locations_update ON air_quality_locations
  FOR UPDATE USING (is_admin_role() AND facility_id = get_user_facility_id());

CREATE POLICY air_quality_locations_delete ON air_quality_locations
  FOR DELETE USING (is_admin_role() AND facility_id = get_user_facility_id());

-- ============================================
-- CHECKLIST COMPLETIONS (operational)
-- ============================================
CREATE POLICY checklist_completions_select ON checklist_completions
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY checklist_completions_insert ON checklist_completions
  FOR INSERT WITH CHECK (
    facility_id = get_user_facility_id() AND can_write()
  );

CREATE POLICY checklist_completions_update ON checklist_completions
  FOR UPDATE USING (
    facility_id = get_user_facility_id() AND can_write()
  );

CREATE POLICY checklist_completions_delete ON checklist_completions
  FOR DELETE USING (
    is_admin_role() AND facility_id = get_user_facility_id()
  );

-- ============================================
-- DAILY REPORT NOTES (operational)
-- ============================================
CREATE POLICY daily_report_notes_select ON daily_report_notes
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY daily_report_notes_insert ON daily_report_notes
  FOR INSERT WITH CHECK (
    facility_id = get_user_facility_id() AND can_write()
  );

CREATE POLICY daily_report_notes_update ON daily_report_notes
  FOR UPDATE USING (
    facility_id = get_user_facility_id() AND can_write()
  );

CREATE POLICY daily_report_notes_delete ON daily_report_notes
  FOR DELETE USING (
    is_admin_role() AND facility_id = get_user_facility_id()
  );

-- ============================================
-- ICE DEPTH READINGS (operational)
-- ============================================
CREATE POLICY ice_depth_readings_select ON ice_depth_readings
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY ice_depth_readings_insert ON ice_depth_readings
  FOR INSERT WITH CHECK (
    facility_id = get_user_facility_id() AND can_write()
  );

CREATE POLICY ice_depth_readings_delete ON ice_depth_readings
  FOR DELETE USING (
    is_admin_role() AND facility_id = get_user_facility_id()
  );

-- ============================================
-- ICE MAKES (operational)
-- ============================================
CREATE POLICY ice_makes_select ON ice_makes
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY ice_makes_insert ON ice_makes
  FOR INSERT WITH CHECK (
    facility_id = get_user_facility_id() AND can_write()
  );

CREATE POLICY ice_makes_delete ON ice_makes
  FOR DELETE USING (
    is_admin_role() AND facility_id = get_user_facility_id()
  );

-- ============================================
-- BLADE CHANGES (operational)
-- ============================================
CREATE POLICY blade_changes_select ON blade_changes
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY blade_changes_insert ON blade_changes
  FOR INSERT WITH CHECK (
    facility_id = get_user_facility_id() AND can_write()
  );

CREATE POLICY blade_changes_delete ON blade_changes
  FOR DELETE USING (
    is_admin_role() AND facility_id = get_user_facility_id()
  );

-- ============================================
-- EDGING LOGS (operational)
-- ============================================
CREATE POLICY edging_logs_select ON edging_logs
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY edging_logs_insert ON edging_logs
  FOR INSERT WITH CHECK (
    facility_id = get_user_facility_id() AND can_write()
  );

CREATE POLICY edging_logs_delete ON edging_logs
  FOR DELETE USING (
    is_admin_role() AND facility_id = get_user_facility_id()
  );

-- ============================================
-- CIRCLE CHECKS (operational)
-- ============================================
CREATE POLICY circle_checks_select ON circle_checks
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY circle_checks_insert ON circle_checks
  FOR INSERT WITH CHECK (
    facility_id = get_user_facility_id() AND can_write()
  );

CREATE POLICY circle_checks_delete ON circle_checks
  FOR DELETE USING (
    is_admin_role() AND facility_id = get_user_facility_id()
  );

-- ============================================
-- CIRCLE CHECK RESULTS (operational — via parent)
-- ============================================
CREATE POLICY circle_check_results_select ON circle_check_results
  FOR SELECT USING (
    circle_check_id IN (
      SELECT id FROM circle_checks WHERE facility_id = get_user_facility_id()
    )
  );

CREATE POLICY circle_check_results_insert ON circle_check_results
  FOR INSERT WITH CHECK (
    can_write() AND circle_check_id IN (
      SELECT id FROM circle_checks WHERE facility_id = get_user_facility_id()
    )
  );

CREATE POLICY circle_check_results_delete ON circle_check_results
  FOR DELETE USING (
    is_admin_role() AND circle_check_id IN (
      SELECT id FROM circle_checks WHERE facility_id = get_user_facility_id()
    )
  );

-- ============================================
-- INCIDENT REPORTS (operational)
-- ============================================
CREATE POLICY incident_reports_select ON incident_reports
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY incident_reports_insert ON incident_reports
  FOR INSERT WITH CHECK (
    facility_id = get_user_facility_id() AND can_write()
  );

CREATE POLICY incident_reports_update ON incident_reports
  FOR UPDATE USING (
    facility_id = get_user_facility_id() AND is_supervisor_or_above()
  );

CREATE POLICY incident_reports_delete ON incident_reports
  FOR DELETE USING (
    is_admin_role() AND facility_id = get_user_facility_id()
  );

-- ============================================
-- REFRIGERATION READINGS (operational)
-- ============================================
CREATE POLICY refrigeration_readings_select ON refrigeration_readings
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY refrigeration_readings_insert ON refrigeration_readings
  FOR INSERT WITH CHECK (
    facility_id = get_user_facility_id() AND can_write()
  );

CREATE POLICY refrigeration_readings_delete ON refrigeration_readings
  FOR DELETE USING (
    is_admin_role() AND facility_id = get_user_facility_id()
  );

-- ============================================
-- REFRIGERATION READING VALUES (via parent)
-- ============================================
CREATE POLICY refrigeration_reading_values_select ON refrigeration_reading_values
  FOR SELECT USING (
    reading_id IN (
      SELECT id FROM refrigeration_readings WHERE facility_id = get_user_facility_id()
    )
  );

CREATE POLICY refrigeration_reading_values_insert ON refrigeration_reading_values
  FOR INSERT WITH CHECK (
    can_write() AND reading_id IN (
      SELECT id FROM refrigeration_readings WHERE facility_id = get_user_facility_id()
    )
  );

CREATE POLICY refrigeration_reading_values_delete ON refrigeration_reading_values
  FOR DELETE USING (
    is_admin_role() AND reading_id IN (
      SELECT id FROM refrigeration_readings WHERE facility_id = get_user_facility_id()
    )
  );

-- ============================================
-- AIR QUALITY READINGS (operational)
-- ============================================
CREATE POLICY air_quality_readings_select ON air_quality_readings
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY air_quality_readings_insert ON air_quality_readings
  FOR INSERT WITH CHECK (
    facility_id = get_user_facility_id() AND can_write()
  );

CREATE POLICY air_quality_readings_delete ON air_quality_readings
  FOR DELETE USING (
    is_admin_role() AND facility_id = get_user_facility_id()
  );

-- ============================================
-- AIR QUALITY READING VALUES (via parent)
-- ============================================
CREATE POLICY air_quality_reading_values_select ON air_quality_reading_values
  FOR SELECT USING (
    reading_id IN (
      SELECT id FROM air_quality_readings WHERE facility_id = get_user_facility_id()
    )
  );

CREATE POLICY air_quality_reading_values_insert ON air_quality_reading_values
  FOR INSERT WITH CHECK (
    can_write() AND reading_id IN (
      SELECT id FROM air_quality_readings WHERE facility_id = get_user_facility_id()
    )
  );

CREATE POLICY air_quality_reading_values_delete ON air_quality_reading_values
  FOR DELETE USING (
    is_admin_role() AND reading_id IN (
      SELECT id FROM air_quality_readings WHERE facility_id = get_user_facility_id()
    )
  );

-- ============================================
-- SHIFTS (scheduling)
-- ============================================
CREATE POLICY shifts_select ON shifts
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY shifts_insert ON shifts
  FOR INSERT WITH CHECK (
    facility_id = get_user_facility_id() AND is_manager_or_above()
  );

CREATE POLICY shifts_update ON shifts
  FOR UPDATE USING (
    facility_id = get_user_facility_id() AND is_manager_or_above()
  );

CREATE POLICY shifts_delete ON shifts
  FOR DELETE USING (
    facility_id = get_user_facility_id() AND is_manager_or_above()
  );

-- ============================================
-- EMPLOYEE AVAILABILITY
-- ============================================
CREATE POLICY employee_availability_select ON employee_availability
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY employee_availability_insert ON employee_availability
  FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY employee_availability_update ON employee_availability
  FOR UPDATE USING (employee_id = auth.uid());

CREATE POLICY employee_availability_delete ON employee_availability
  FOR DELETE USING (employee_id = auth.uid() OR is_manager_or_above());

-- ============================================
-- SHIFT SWAP REQUESTS
-- ============================================
CREATE POLICY shift_swap_requests_select ON shift_swap_requests
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY shift_swap_requests_insert ON shift_swap_requests
  FOR INSERT WITH CHECK (
    facility_id = get_user_facility_id() AND can_write()
  );

CREATE POLICY shift_swap_requests_update ON shift_swap_requests
  FOR UPDATE USING (
    facility_id = get_user_facility_id()
    AND (requester_id = auth.uid() OR target_id = auth.uid() OR is_manager_or_above())
  );

-- ============================================
-- NOTIFICATIONS (user-specific)
-- ============================================
CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (recipient_id = auth.uid());

CREATE POLICY notifications_insert ON notifications
  FOR INSERT WITH CHECK (facility_id = get_user_facility_id());

-- ============================================
-- NOTIFICATION PREFERENCES (user-specific)
-- ============================================
CREATE POLICY notification_preferences_select ON notification_preferences
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY notification_preferences_insert ON notification_preferences
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY notification_preferences_update ON notification_preferences
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY notification_preferences_delete ON notification_preferences
  FOR DELETE USING (profile_id = auth.uid());

-- ============================================
-- ACTIVE ALERTS
-- ============================================
CREATE POLICY active_alerts_select ON active_alerts
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY active_alerts_update ON active_alerts
  FOR UPDATE USING (
    facility_id = get_user_facility_id() AND is_supervisor_or_above()
  );

CREATE POLICY active_alerts_insert ON active_alerts
  FOR INSERT WITH CHECK (facility_id = get_user_facility_id());

-- ============================================
-- SCHEDULED REPORT SETTINGS
-- ============================================
CREATE POLICY scheduled_report_settings_select ON scheduled_report_settings
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY scheduled_report_settings_insert ON scheduled_report_settings
  FOR INSERT WITH CHECK (
    is_manager_or_above() AND facility_id = get_user_facility_id()
  );

CREATE POLICY scheduled_report_settings_update ON scheduled_report_settings
  FOR UPDATE USING (
    is_manager_or_above() AND facility_id = get_user_facility_id()
  );

CREATE POLICY scheduled_report_settings_delete ON scheduled_report_settings
  FOR DELETE USING (
    is_admin_role() AND facility_id = get_user_facility_id()
  );

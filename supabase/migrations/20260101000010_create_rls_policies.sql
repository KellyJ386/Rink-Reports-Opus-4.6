-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Returns the facility_id for the currently authenticated user
CREATE OR REPLACE FUNCTION get_user_facility_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT facility_id FROM profiles WHERE id = auth.uid();
$$;

-- Returns the role for the currently authenticated user
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Returns TRUE if the current user is facility_admin or super_admin
CREATE OR REPLACE FUNCTION is_admin_role()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('facility_admin', 'super_admin')
  );
$$;

-- Returns TRUE if the current user is manager, facility_admin, or super_admin
CREATE OR REPLACE FUNCTION is_manager_or_above()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('facility_admin', 'super_admin', 'manager')
  );
$$;

-- Returns TRUE if the current user is supervisor, manager, facility_admin, or super_admin
CREATE OR REPLACE FUNCTION is_supervisor_or_above()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('facility_admin', 'super_admin', 'manager', 'supervisor')
  );
$$;


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


-- ============================================
-- FACILITIES
-- ============================================

CREATE POLICY facilities_select ON facilities
  FOR SELECT TO authenticated
  USING (id = get_user_facility_id());

CREATE POLICY facilities_insert ON facilities
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_role());

CREATE POLICY facilities_update ON facilities
  FOR UPDATE TO authenticated
  USING (id = get_user_facility_id() AND is_admin_role())
  WITH CHECK (id = get_user_facility_id() AND is_admin_role());

CREATE POLICY facilities_delete ON facilities
  FOR DELETE TO authenticated
  USING (id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- OPERATING HOURS
-- ============================================

CREATE POLICY operating_hours_select ON operating_hours
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY operating_hours_insert ON operating_hours
  FOR INSERT TO authenticated
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY operating_hours_update ON operating_hours
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role())
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY operating_hours_delete ON operating_hours
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- PROFILES
-- Users can view same-facility members.
-- Users can update their own profile.
-- Admins can update any profile in their facility.
-- Admins can delete profiles in their facility.
-- ============================================

CREATE POLICY profiles_select ON profiles
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY profiles_insert ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    facility_id = get_user_facility_id() AND is_admin_role()
  );

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_admin ON profiles
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role())
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY profiles_delete ON profiles
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- RINKS
-- ============================================

CREATE POLICY rinks_select ON rinks
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY rinks_insert ON rinks
  FOR INSERT TO authenticated
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY rinks_update ON rinks
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role())
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY rinks_delete ON rinks
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- ICE DEPTH POINTS (joined via rinks -> facilities)
-- ============================================

CREATE POLICY ice_depth_points_select ON ice_depth_points
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rinks
      WHERE rinks.id = ice_depth_points.rink_id
        AND rinks.facility_id = get_user_facility_id()
    )
  );

CREATE POLICY ice_depth_points_insert ON ice_depth_points
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_role() AND
    EXISTS (
      SELECT 1 FROM rinks
      WHERE rinks.id = ice_depth_points.rink_id
        AND rinks.facility_id = get_user_facility_id()
    )
  );

CREATE POLICY ice_depth_points_update ON ice_depth_points
  FOR UPDATE TO authenticated
  USING (
    is_admin_role() AND
    EXISTS (
      SELECT 1 FROM rinks
      WHERE rinks.id = ice_depth_points.rink_id
        AND rinks.facility_id = get_user_facility_id()
    )
  )
  WITH CHECK (
    is_admin_role() AND
    EXISTS (
      SELECT 1 FROM rinks
      WHERE rinks.id = ice_depth_points.rink_id
        AND rinks.facility_id = get_user_facility_id()
    )
  );

CREATE POLICY ice_depth_points_delete ON ice_depth_points
  FOR DELETE TO authenticated
  USING (
    is_admin_role() AND
    EXISTS (
      SELECT 1 FROM rinks
      WHERE rinks.id = ice_depth_points.rink_id
        AND rinks.facility_id = get_user_facility_id()
    )
  );


-- ============================================
-- ICE DEPTH THRESHOLDS
-- ============================================

CREATE POLICY ice_depth_thresholds_select ON ice_depth_thresholds
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY ice_depth_thresholds_insert ON ice_depth_thresholds
  FOR INSERT TO authenticated
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY ice_depth_thresholds_update ON ice_depth_thresholds
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role())
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY ice_depth_thresholds_delete ON ice_depth_thresholds
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- MACHINES
-- ============================================

CREATE POLICY machines_select ON machines
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY machines_insert ON machines
  FOR INSERT TO authenticated
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY machines_update ON machines
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role())
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY machines_delete ON machines
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- EQUIPMENT
-- ============================================

CREATE POLICY equipment_select ON equipment
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY equipment_insert ON equipment
  FOR INSERT TO authenticated
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY equipment_update ON equipment
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role())
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY equipment_delete ON equipment
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- EQUIPMENT READING TYPES (joined via equipment -> facilities)
-- ============================================

CREATE POLICY equipment_reading_types_select ON equipment_reading_types
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM equipment
      WHERE equipment.id = equipment_reading_types.equipment_id
        AND equipment.facility_id = get_user_facility_id()
    )
  );

CREATE POLICY equipment_reading_types_insert ON equipment_reading_types
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_role() AND
    EXISTS (
      SELECT 1 FROM equipment
      WHERE equipment.id = equipment_reading_types.equipment_id
        AND equipment.facility_id = get_user_facility_id()
    )
  );

CREATE POLICY equipment_reading_types_update ON equipment_reading_types
  FOR UPDATE TO authenticated
  USING (
    is_admin_role() AND
    EXISTS (
      SELECT 1 FROM equipment
      WHERE equipment.id = equipment_reading_types.equipment_id
        AND equipment.facility_id = get_user_facility_id()
    )
  )
  WITH CHECK (
    is_admin_role() AND
    EXISTS (
      SELECT 1 FROM equipment
      WHERE equipment.id = equipment_reading_types.equipment_id
        AND equipment.facility_id = get_user_facility_id()
    )
  );

CREATE POLICY equipment_reading_types_delete ON equipment_reading_types
  FOR DELETE TO authenticated
  USING (
    is_admin_role() AND
    EXISTS (
      SELECT 1 FROM equipment
      WHERE equipment.id = equipment_reading_types.equipment_id
        AND equipment.facility_id = get_user_facility_id()
    )
  );


-- ============================================
-- MODULE SETTINGS
-- ============================================

CREATE POLICY module_settings_select ON module_settings
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY module_settings_insert ON module_settings
  FOR INSERT TO authenticated
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY module_settings_update ON module_settings
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role())
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY module_settings_delete ON module_settings
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- DAILY REPORT TABS
-- ============================================

CREATE POLICY daily_report_tabs_select ON daily_report_tabs
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY daily_report_tabs_insert ON daily_report_tabs
  FOR INSERT TO authenticated
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY daily_report_tabs_update ON daily_report_tabs
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role())
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY daily_report_tabs_delete ON daily_report_tabs
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- CHECKLIST ITEMS (joined via daily_report_tabs -> facilities)
-- ============================================

CREATE POLICY checklist_items_select ON checklist_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_report_tabs
      WHERE daily_report_tabs.id = checklist_items.tab_id
        AND daily_report_tabs.facility_id = get_user_facility_id()
    )
  );

CREATE POLICY checklist_items_insert ON checklist_items
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_role() AND
    EXISTS (
      SELECT 1 FROM daily_report_tabs
      WHERE daily_report_tabs.id = checklist_items.tab_id
        AND daily_report_tabs.facility_id = get_user_facility_id()
    )
  );

CREATE POLICY checklist_items_update ON checklist_items
  FOR UPDATE TO authenticated
  USING (
    is_admin_role() AND
    EXISTS (
      SELECT 1 FROM daily_report_tabs
      WHERE daily_report_tabs.id = checklist_items.tab_id
        AND daily_report_tabs.facility_id = get_user_facility_id()
    )
  )
  WITH CHECK (
    is_admin_role() AND
    EXISTS (
      SELECT 1 FROM daily_report_tabs
      WHERE daily_report_tabs.id = checklist_items.tab_id
        AND daily_report_tabs.facility_id = get_user_facility_id()
    )
  );

CREATE POLICY checklist_items_delete ON checklist_items
  FOR DELETE TO authenticated
  USING (
    is_admin_role() AND
    EXISTS (
      SELECT 1 FROM daily_report_tabs
      WHERE daily_report_tabs.id = checklist_items.tab_id
        AND daily_report_tabs.facility_id = get_user_facility_id()
    )
  );


-- ============================================
-- CIRCLE CHECK ITEMS (joined via machines -> facilities)
-- ============================================

CREATE POLICY circle_check_items_select ON circle_check_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM machines
      WHERE machines.id = circle_check_items.machine_id
        AND machines.facility_id = get_user_facility_id()
    )
  );

CREATE POLICY circle_check_items_insert ON circle_check_items
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_role() AND
    EXISTS (
      SELECT 1 FROM machines
      WHERE machines.id = circle_check_items.machine_id
        AND machines.facility_id = get_user_facility_id()
    )
  );

CREATE POLICY circle_check_items_update ON circle_check_items
  FOR UPDATE TO authenticated
  USING (
    is_admin_role() AND
    EXISTS (
      SELECT 1 FROM machines
      WHERE machines.id = circle_check_items.machine_id
        AND machines.facility_id = get_user_facility_id()
    )
  )
  WITH CHECK (
    is_admin_role() AND
    EXISTS (
      SELECT 1 FROM machines
      WHERE machines.id = circle_check_items.machine_id
        AND machines.facility_id = get_user_facility_id()
    )
  );

CREATE POLICY circle_check_items_delete ON circle_check_items
  FOR DELETE TO authenticated
  USING (
    is_admin_role() AND
    EXISTS (
      SELECT 1 FROM machines
      WHERE machines.id = circle_check_items.machine_id
        AND machines.facility_id = get_user_facility_id()
    )
  );


-- ============================================
-- SHIFT TYPES
-- ============================================

CREATE POLICY shift_types_select ON shift_types
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY shift_types_insert ON shift_types
  FOR INSERT TO authenticated
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY shift_types_update ON shift_types
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role())
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY shift_types_delete ON shift_types
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- INCIDENT LOCATIONS
-- ============================================

CREATE POLICY incident_locations_select ON incident_locations
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY incident_locations_insert ON incident_locations
  FOR INSERT TO authenticated
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY incident_locations_update ON incident_locations
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role())
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY incident_locations_delete ON incident_locations
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- AIR QUALITY METRICS
-- ============================================

CREATE POLICY air_quality_metrics_select ON air_quality_metrics
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY air_quality_metrics_insert ON air_quality_metrics
  FOR INSERT TO authenticated
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY air_quality_metrics_update ON air_quality_metrics
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role())
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY air_quality_metrics_delete ON air_quality_metrics
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- AIR QUALITY LOCATIONS
-- ============================================

CREATE POLICY air_quality_locations_select ON air_quality_locations
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY air_quality_locations_insert ON air_quality_locations
  FOR INSERT TO authenticated
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY air_quality_locations_update ON air_quality_locations
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role())
  WITH CHECK (facility_id = get_user_facility_id() AND is_admin_role());

CREATE POLICY air_quality_locations_delete ON air_quality_locations
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- CHECKLIST COMPLETIONS (operational data)
-- ============================================

CREATE POLICY checklist_completions_select ON checklist_completions
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY checklist_completions_insert ON checklist_completions
  FOR INSERT TO authenticated
  WITH CHECK (facility_id = get_user_facility_id());

CREATE POLICY checklist_completions_update ON checklist_completions
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_supervisor_or_above())
  WITH CHECK (facility_id = get_user_facility_id() AND is_supervisor_or_above());

CREATE POLICY checklist_completions_delete ON checklist_completions
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- ICE DEPTH READINGS (operational data)
-- ============================================

CREATE POLICY ice_depth_readings_select ON ice_depth_readings
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY ice_depth_readings_insert ON ice_depth_readings
  FOR INSERT TO authenticated
  WITH CHECK (facility_id = get_user_facility_id());

CREATE POLICY ice_depth_readings_update ON ice_depth_readings
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_supervisor_or_above())
  WITH CHECK (facility_id = get_user_facility_id() AND is_supervisor_or_above());

CREATE POLICY ice_depth_readings_delete ON ice_depth_readings
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- ICE MAKES (operational data)
-- ============================================

CREATE POLICY ice_makes_select ON ice_makes
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY ice_makes_insert ON ice_makes
  FOR INSERT TO authenticated
  WITH CHECK (facility_id = get_user_facility_id());

CREATE POLICY ice_makes_update ON ice_makes
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_supervisor_or_above())
  WITH CHECK (facility_id = get_user_facility_id() AND is_supervisor_or_above());

CREATE POLICY ice_makes_delete ON ice_makes
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- BLADE CHANGES (operational data)
-- ============================================

CREATE POLICY blade_changes_select ON blade_changes
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY blade_changes_insert ON blade_changes
  FOR INSERT TO authenticated
  WITH CHECK (facility_id = get_user_facility_id());

CREATE POLICY blade_changes_update ON blade_changes
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_supervisor_or_above())
  WITH CHECK (facility_id = get_user_facility_id() AND is_supervisor_or_above());

CREATE POLICY blade_changes_delete ON blade_changes
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- EDGING LOGS (operational data)
-- ============================================

CREATE POLICY edging_logs_select ON edging_logs
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY edging_logs_insert ON edging_logs
  FOR INSERT TO authenticated
  WITH CHECK (facility_id = get_user_facility_id());

CREATE POLICY edging_logs_update ON edging_logs
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_supervisor_or_above())
  WITH CHECK (facility_id = get_user_facility_id() AND is_supervisor_or_above());

CREATE POLICY edging_logs_delete ON edging_logs
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- CIRCLE CHECKS (operational data)
-- ============================================

CREATE POLICY circle_checks_select ON circle_checks
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY circle_checks_insert ON circle_checks
  FOR INSERT TO authenticated
  WITH CHECK (facility_id = get_user_facility_id());

CREATE POLICY circle_checks_update ON circle_checks
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_supervisor_or_above())
  WITH CHECK (facility_id = get_user_facility_id() AND is_supervisor_or_above());

CREATE POLICY circle_checks_delete ON circle_checks
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- CIRCLE CHECK RESULTS (joined via circle_checks -> facilities)
-- ============================================

CREATE POLICY circle_check_results_select ON circle_check_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM circle_checks
      WHERE circle_checks.id = circle_check_results.circle_check_id
        AND circle_checks.facility_id = get_user_facility_id()
    )
  );

CREATE POLICY circle_check_results_insert ON circle_check_results
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM circle_checks
      WHERE circle_checks.id = circle_check_results.circle_check_id
        AND circle_checks.facility_id = get_user_facility_id()
    )
  );

CREATE POLICY circle_check_results_update ON circle_check_results
  FOR UPDATE TO authenticated
  USING (
    is_supervisor_or_above() AND
    EXISTS (
      SELECT 1 FROM circle_checks
      WHERE circle_checks.id = circle_check_results.circle_check_id
        AND circle_checks.facility_id = get_user_facility_id()
    )
  )
  WITH CHECK (
    is_supervisor_or_above() AND
    EXISTS (
      SELECT 1 FROM circle_checks
      WHERE circle_checks.id = circle_check_results.circle_check_id
        AND circle_checks.facility_id = get_user_facility_id()
    )
  );

CREATE POLICY circle_check_results_delete ON circle_check_results
  FOR DELETE TO authenticated
  USING (
    is_admin_role() AND
    EXISTS (
      SELECT 1 FROM circle_checks
      WHERE circle_checks.id = circle_check_results.circle_check_id
        AND circle_checks.facility_id = get_user_facility_id()
    )
  );


-- ============================================
-- INCIDENT REPORTS (operational data)
-- ============================================

CREATE POLICY incident_reports_select ON incident_reports
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY incident_reports_insert ON incident_reports
  FOR INSERT TO authenticated
  WITH CHECK (facility_id = get_user_facility_id());

CREATE POLICY incident_reports_update ON incident_reports
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_supervisor_or_above())
  WITH CHECK (facility_id = get_user_facility_id() AND is_supervisor_or_above());

CREATE POLICY incident_reports_delete ON incident_reports
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- REFRIGERATION READINGS (operational data)
-- ============================================

CREATE POLICY refrigeration_readings_select ON refrigeration_readings
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY refrigeration_readings_insert ON refrigeration_readings
  FOR INSERT TO authenticated
  WITH CHECK (facility_id = get_user_facility_id());

CREATE POLICY refrigeration_readings_update ON refrigeration_readings
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_supervisor_or_above())
  WITH CHECK (facility_id = get_user_facility_id() AND is_supervisor_or_above());

CREATE POLICY refrigeration_readings_delete ON refrigeration_readings
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- REFRIGERATION READING VALUES (joined via refrigeration_readings -> facilities)
-- ============================================

CREATE POLICY refrigeration_reading_values_select ON refrigeration_reading_values
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM refrigeration_readings
      WHERE refrigeration_readings.id = refrigeration_reading_values.reading_id
        AND refrigeration_readings.facility_id = get_user_facility_id()
    )
  );

CREATE POLICY refrigeration_reading_values_insert ON refrigeration_reading_values
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM refrigeration_readings
      WHERE refrigeration_readings.id = refrigeration_reading_values.reading_id
        AND refrigeration_readings.facility_id = get_user_facility_id()
    )
  );

CREATE POLICY refrigeration_reading_values_update ON refrigeration_reading_values
  FOR UPDATE TO authenticated
  USING (
    is_supervisor_or_above() AND
    EXISTS (
      SELECT 1 FROM refrigeration_readings
      WHERE refrigeration_readings.id = refrigeration_reading_values.reading_id
        AND refrigeration_readings.facility_id = get_user_facility_id()
    )
  )
  WITH CHECK (
    is_supervisor_or_above() AND
    EXISTS (
      SELECT 1 FROM refrigeration_readings
      WHERE refrigeration_readings.id = refrigeration_reading_values.reading_id
        AND refrigeration_readings.facility_id = get_user_facility_id()
    )
  );

CREATE POLICY refrigeration_reading_values_delete ON refrigeration_reading_values
  FOR DELETE TO authenticated
  USING (
    is_admin_role() AND
    EXISTS (
      SELECT 1 FROM refrigeration_readings
      WHERE refrigeration_readings.id = refrigeration_reading_values.reading_id
        AND refrigeration_readings.facility_id = get_user_facility_id()
    )
  );


-- ============================================
-- AIR QUALITY READINGS (operational data)
-- ============================================

CREATE POLICY air_quality_readings_select ON air_quality_readings
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY air_quality_readings_insert ON air_quality_readings
  FOR INSERT TO authenticated
  WITH CHECK (facility_id = get_user_facility_id());

CREATE POLICY air_quality_readings_update ON air_quality_readings
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_supervisor_or_above())
  WITH CHECK (facility_id = get_user_facility_id() AND is_supervisor_or_above());

CREATE POLICY air_quality_readings_delete ON air_quality_readings
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- AIR QUALITY READING VALUES (joined via air_quality_readings -> facilities)
-- ============================================

CREATE POLICY air_quality_reading_values_select ON air_quality_reading_values
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM air_quality_readings
      WHERE air_quality_readings.id = air_quality_reading_values.reading_id
        AND air_quality_readings.facility_id = get_user_facility_id()
    )
  );

CREATE POLICY air_quality_reading_values_insert ON air_quality_reading_values
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM air_quality_readings
      WHERE air_quality_readings.id = air_quality_reading_values.reading_id
        AND air_quality_readings.facility_id = get_user_facility_id()
    )
  );

CREATE POLICY air_quality_reading_values_update ON air_quality_reading_values
  FOR UPDATE TO authenticated
  USING (
    is_supervisor_or_above() AND
    EXISTS (
      SELECT 1 FROM air_quality_readings
      WHERE air_quality_readings.id = air_quality_reading_values.reading_id
        AND air_quality_readings.facility_id = get_user_facility_id()
    )
  )
  WITH CHECK (
    is_supervisor_or_above() AND
    EXISTS (
      SELECT 1 FROM air_quality_readings
      WHERE air_quality_readings.id = air_quality_reading_values.reading_id
        AND air_quality_readings.facility_id = get_user_facility_id()
    )
  );

CREATE POLICY air_quality_reading_values_delete ON air_quality_reading_values
  FOR DELETE TO authenticated
  USING (
    is_admin_role() AND
    EXISTS (
      SELECT 1 FROM air_quality_readings
      WHERE air_quality_readings.id = air_quality_reading_values.reading_id
        AND air_quality_readings.facility_id = get_user_facility_id()
    )
  );


-- ============================================
-- SHIFTS (scheduling)
-- ============================================

CREATE POLICY shifts_select ON shifts
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY shifts_insert ON shifts
  FOR INSERT TO authenticated
  WITH CHECK (facility_id = get_user_facility_id() AND is_manager_or_above());

CREATE POLICY shifts_update ON shifts
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_manager_or_above())
  WITH CHECK (facility_id = get_user_facility_id() AND is_manager_or_above());

CREATE POLICY shifts_delete ON shifts
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- EMPLOYEE AVAILABILITY
-- Employees can manage their own availability.
-- Managers and above can also manage availability.
-- ============================================

CREATE POLICY employee_availability_select ON employee_availability
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY employee_availability_insert_own ON employee_availability
  FOR INSERT TO authenticated
  WITH CHECK (
    facility_id = get_user_facility_id()
    AND employee_id = auth.uid()
  );

CREATE POLICY employee_availability_insert_manager ON employee_availability
  FOR INSERT TO authenticated
  WITH CHECK (
    facility_id = get_user_facility_id()
    AND is_manager_or_above()
  );

CREATE POLICY employee_availability_update_own ON employee_availability
  FOR UPDATE TO authenticated
  USING (employee_id = auth.uid() AND facility_id = get_user_facility_id())
  WITH CHECK (employee_id = auth.uid() AND facility_id = get_user_facility_id());

CREATE POLICY employee_availability_update_manager ON employee_availability
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_manager_or_above())
  WITH CHECK (facility_id = get_user_facility_id() AND is_manager_or_above());

CREATE POLICY employee_availability_delete_own ON employee_availability
  FOR DELETE TO authenticated
  USING (employee_id = auth.uid() AND facility_id = get_user_facility_id());

CREATE POLICY employee_availability_delete_admin ON employee_availability
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- SHIFT SWAP REQUESTS
-- Users can create swap requests (as requester).
-- Managers and above can update (approve/deny).
-- Admins can delete.
-- ============================================

CREATE POLICY shift_swap_requests_select ON shift_swap_requests
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY shift_swap_requests_insert ON shift_swap_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    facility_id = get_user_facility_id()
    AND requester_id = auth.uid()
  );

CREATE POLICY shift_swap_requests_update ON shift_swap_requests
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_manager_or_above())
  WITH CHECK (facility_id = get_user_facility_id() AND is_manager_or_above());

CREATE POLICY shift_swap_requests_delete ON shift_swap_requests
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- NOTIFICATIONS
-- Users can only see their own notifications.
-- Supervisors and above can create notifications.
-- Users can update their own (mark as read).
-- Admins can delete.
-- ============================================

CREATE POLICY notifications_select ON notifications
  FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY notifications_insert ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    facility_id = get_user_facility_id()
    AND is_supervisor_or_above()
  );

CREATE POLICY notifications_update ON notifications
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE POLICY notifications_delete ON notifications
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());


-- ============================================
-- NOTIFICATION PREFERENCES
-- Users manage only their own preferences.
-- ============================================

CREATE POLICY notification_preferences_select ON notification_preferences
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY notification_preferences_insert ON notification_preferences
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY notification_preferences_update ON notification_preferences
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY notification_preferences_delete ON notification_preferences
  FOR DELETE TO authenticated
  USING (profile_id = auth.uid());


-- ============================================
-- ACTIVE ALERTS
-- ============================================

CREATE POLICY active_alerts_select ON active_alerts
  FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id());

CREATE POLICY active_alerts_insert ON active_alerts
  FOR INSERT TO authenticated
  WITH CHECK (facility_id = get_user_facility_id() AND is_supervisor_or_above());

CREATE POLICY active_alerts_update ON active_alerts
  FOR UPDATE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_supervisor_or_above())
  WITH CHECK (facility_id = get_user_facility_id() AND is_supervisor_or_above());

CREATE POLICY active_alerts_delete ON active_alerts
  FOR DELETE TO authenticated
  USING (facility_id = get_user_facility_id() AND is_admin_role());

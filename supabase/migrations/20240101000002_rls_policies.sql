-- Migration: 20240101000002_rls_policies.sql
-- Phase 2: Row-Level Security policies for all MFO tables
--
-- Role hierarchy (highest to lowest):
--   super_admin > facility_admin > manager > supervisor > staff > read_only
--
-- Super admins bypass RLS on the server side via service role client.
-- No special super_admin policies are created here.
--
-- All data is isolated by facility_id. Users can only access data
-- for their assigned facility.

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get the current user's facility_id from their profile
CREATE OR REPLACE FUNCTION auth.facility_id() RETURNS UUID AS $$
  SELECT facility_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get the current user's role from their profile
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- FACILITIES
-- ============================================================
-- Authenticated users can read their own facility.
-- Only super_admin (via service role) can create/update/delete facilities.

ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY facilities_select_authenticated
  ON facilities FOR SELECT
  TO authenticated
  USING (id = auth.facility_id());

-- ============================================================
-- PROFILES
-- ============================================================
-- Users can read all profiles within their facility (for scheduling,
-- assignment dropdowns, etc.).
-- Users can update their own profile (name, phone, avatar).
-- Profile creation and deletion handled via service role (admin invites).

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_authenticated
  ON profiles FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY profiles_update_self
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Facility admins can update profiles in their facility (role changes, deactivation)
CREATE POLICY profiles_update_facility_admin
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

-- ============================================================
-- MODULE SETTINGS (Admin Config)
-- ============================================================
-- All authenticated users can read (to know which modules are enabled).
-- Only facility_admin can manage.

ALTER TABLE module_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY module_settings_select_authenticated
  ON module_settings FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY module_settings_insert_facility_admin
  ON module_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

CREATE POLICY module_settings_update_facility_admin
  ON module_settings FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY module_settings_delete_facility_admin
  ON module_settings FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- TAB CONFIGURATIONS (Admin Config)
-- ============================================================

ALTER TABLE tab_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tab_configurations_select_authenticated
  ON tab_configurations FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY tab_configurations_insert_facility_admin
  ON tab_configurations FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

CREATE POLICY tab_configurations_update_facility_admin
  ON tab_configurations FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY tab_configurations_delete_facility_admin
  ON tab_configurations FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- CHECKLIST ITEMS (Admin Config)
-- ============================================================

ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY checklist_items_select_authenticated
  ON checklist_items FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY checklist_items_insert_facility_admin
  ON checklist_items FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

CREATE POLICY checklist_items_update_facility_admin
  ON checklist_items FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY checklist_items_delete_facility_admin
  ON checklist_items FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- EQUIPMENT (Admin Config)
-- ============================================================

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY equipment_select_authenticated
  ON equipment FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY equipment_insert_facility_admin
  ON equipment FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

CREATE POLICY equipment_update_facility_admin
  ON equipment FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY equipment_delete_facility_admin
  ON equipment FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- THRESHOLDS (Admin Config)
-- ============================================================

ALTER TABLE thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY thresholds_select_authenticated
  ON thresholds FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY thresholds_insert_facility_admin
  ON thresholds FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

CREATE POLICY thresholds_update_facility_admin
  ON thresholds FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY thresholds_delete_facility_admin
  ON thresholds FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- SHIFT TYPES (Admin Config)
-- ============================================================

ALTER TABLE shift_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY shift_types_select_authenticated
  ON shift_types FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY shift_types_insert_facility_admin
  ON shift_types FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

CREATE POLICY shift_types_update_facility_admin
  ON shift_types FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY shift_types_delete_facility_admin
  ON shift_types FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- RINKS (Admin Config)
-- ============================================================

ALTER TABLE rinks ENABLE ROW LEVEL SECURITY;

CREATE POLICY rinks_select_authenticated
  ON rinks FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY rinks_insert_facility_admin
  ON rinks FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

CREATE POLICY rinks_update_facility_admin
  ON rinks FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY rinks_delete_facility_admin
  ON rinks FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- RINK ZONES (Admin Config)
-- ============================================================

ALTER TABLE rink_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY rink_zones_select_authenticated
  ON rink_zones FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY rink_zones_insert_facility_admin
  ON rink_zones FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

CREATE POLICY rink_zones_update_facility_admin
  ON rink_zones FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY rink_zones_delete_facility_admin
  ON rink_zones FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- DAILY REPORTS
-- ============================================================
-- All authenticated users in the facility can read reports.
-- Staff and above can create reports.
-- Supervisors and above can update reports (edit fields).
-- Managers and above can update report status (approve/reject).
-- Facility admins can delete reports.

ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY daily_reports_select_authenticated
  ON daily_reports FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY daily_reports_insert_staff
  ON daily_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor', 'staff')
  );

CREATE POLICY daily_reports_update_supervisor
  ON daily_reports FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY daily_reports_delete_facility_admin
  ON daily_reports FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- CHECKLIST RESPONSES
-- ============================================================
-- Staff and above can submit checklist responses.
-- Supervisors and above can update (correct entries).
-- Facility admins can delete.

ALTER TABLE checklist_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY checklist_responses_select_authenticated
  ON checklist_responses FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY checklist_responses_insert_staff
  ON checklist_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor', 'staff')
  );

CREATE POLICY checklist_responses_update_supervisor
  ON checklist_responses FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY checklist_responses_delete_facility_admin
  ON checklist_responses FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- ICE DEPTH MEASUREMENTS
-- ============================================================

ALTER TABLE ice_depth_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY ice_depth_measurements_select_authenticated
  ON ice_depth_measurements FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY ice_depth_measurements_insert_staff
  ON ice_depth_measurements FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor', 'staff')
  );

CREATE POLICY ice_depth_measurements_update_supervisor
  ON ice_depth_measurements FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY ice_depth_measurements_delete_facility_admin
  ON ice_depth_measurements FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- ICE EVENTS
-- ============================================================

ALTER TABLE ice_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY ice_events_select_authenticated
  ON ice_events FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY ice_events_insert_staff
  ON ice_events FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor', 'staff')
  );

CREATE POLICY ice_events_update_supervisor
  ON ice_events FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY ice_events_delete_facility_admin
  ON ice_events FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- ICE MAKES
-- ============================================================

ALTER TABLE ice_makes ENABLE ROW LEVEL SECURITY;

CREATE POLICY ice_makes_select_authenticated
  ON ice_makes FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY ice_makes_insert_staff
  ON ice_makes FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor', 'staff')
  );

CREATE POLICY ice_makes_update_supervisor
  ON ice_makes FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY ice_makes_delete_facility_admin
  ON ice_makes FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- ICE MAINTENANCE LOGS
-- ============================================================

ALTER TABLE ice_maintenance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY ice_maintenance_logs_select_authenticated
  ON ice_maintenance_logs FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY ice_maintenance_logs_insert_staff
  ON ice_maintenance_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor', 'staff')
  );

CREATE POLICY ice_maintenance_logs_update_supervisor
  ON ice_maintenance_logs FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY ice_maintenance_logs_delete_facility_admin
  ON ice_maintenance_logs FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- SCHEDULES
-- ============================================================
-- All can read (to see the schedule).
-- Supervisors and above can create/update schedules.
-- Facility admins can delete.

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY schedules_select_authenticated
  ON schedules FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY schedules_insert_supervisor
  ON schedules FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor')
  );

CREATE POLICY schedules_update_supervisor
  ON schedules FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY schedules_delete_facility_admin
  ON schedules FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- SCHEDULE ENTRIES
-- ============================================================
-- All can read (to see their shifts).
-- Supervisors and above can create/update entries.
-- Facility admins can delete.

ALTER TABLE schedule_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY schedule_entries_select_authenticated
  ON schedule_entries FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY schedule_entries_insert_supervisor
  ON schedule_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor')
  );

CREATE POLICY schedule_entries_update_supervisor
  ON schedule_entries FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY schedule_entries_delete_facility_admin
  ON schedule_entries FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- EMPLOYEE AVAILABILITY
-- ============================================================
-- All can read availability in their facility.
-- Staff can insert/update/delete their own availability.
-- Supervisors and above can manage anyone's availability.

ALTER TABLE employee_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY employee_availability_select_authenticated
  ON employee_availability FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

-- Staff can insert their own availability
CREATE POLICY employee_availability_insert_staff_self
  ON employee_availability FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND employee_id = auth.uid()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor', 'staff')
  );

-- Supervisors+ can insert availability for anyone in the facility
CREATE POLICY employee_availability_insert_supervisor
  ON employee_availability FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor')
  );

-- Staff can update their own availability
CREATE POLICY employee_availability_update_staff_self
  ON employee_availability FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND employee_id = auth.uid()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor', 'staff')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
    AND employee_id = auth.uid()
  );

-- Supervisors+ can update anyone's availability
CREATE POLICY employee_availability_update_supervisor
  ON employee_availability FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

-- Staff can delete their own availability
CREATE POLICY employee_availability_delete_staff_self
  ON employee_availability FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND employee_id = auth.uid()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor', 'staff')
  );

-- Supervisors+ can delete anyone's availability
CREATE POLICY employee_availability_delete_supervisor
  ON employee_availability FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor')
  );

-- ============================================================
-- SHIFT SWAP REQUESTS
-- ============================================================
-- All can read swap requests in their facility.
-- Staff can create swap requests (for their own shifts).
-- Supervisors+ can update (approve/deny).
-- Facility admins can delete.

ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY shift_swap_requests_select_authenticated
  ON shift_swap_requests FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY shift_swap_requests_insert_staff
  ON shift_swap_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor', 'staff')
  );

CREATE POLICY shift_swap_requests_update_supervisor
  ON shift_swap_requests FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY shift_swap_requests_delete_facility_admin
  ON shift_swap_requests FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- TIME OFF REQUESTS
-- ============================================================
-- All can read time off requests in their facility.
-- Staff can create time off requests (for themselves).
-- Supervisors+ can update (approve/deny).
-- Facility admins can delete.

ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY time_off_requests_select_authenticated
  ON time_off_requests FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY time_off_requests_insert_staff
  ON time_off_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor', 'staff')
  );

CREATE POLICY time_off_requests_update_supervisor
  ON time_off_requests FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY time_off_requests_delete_facility_admin
  ON time_off_requests FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- INCIDENT REPORTS
-- ============================================================
-- All can read incidents in their facility.
-- Staff+ can create incident reports.
-- Supervisors+ can update (investigate, assign, resolve).
-- Facility admins can delete.

ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY incident_reports_select_authenticated
  ON incident_reports FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY incident_reports_insert_staff
  ON incident_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor', 'staff')
  );

CREATE POLICY incident_reports_update_supervisor
  ON incident_reports FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY incident_reports_delete_facility_admin
  ON incident_reports FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- INCIDENT FOLLOW-UPS
-- ============================================================
-- All can read follow-ups in their facility.
-- Staff+ can add follow-ups.
-- Supervisors+ can update.
-- Facility admins can delete.

ALTER TABLE incident_follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY incident_follow_ups_select_authenticated
  ON incident_follow_ups FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY incident_follow_ups_insert_staff
  ON incident_follow_ups FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor', 'staff')
  );

CREATE POLICY incident_follow_ups_update_supervisor
  ON incident_follow_ups FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY incident_follow_ups_delete_facility_admin
  ON incident_follow_ups FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- REFRIGERATION READINGS
-- ============================================================

ALTER TABLE refrigeration_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY refrigeration_readings_select_authenticated
  ON refrigeration_readings FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY refrigeration_readings_insert_staff
  ON refrigeration_readings FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor', 'staff')
  );

CREATE POLICY refrigeration_readings_update_supervisor
  ON refrigeration_readings FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY refrigeration_readings_delete_facility_admin
  ON refrigeration_readings FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- REFRIGERATION MAINTENANCE
-- ============================================================

ALTER TABLE refrigeration_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY refrigeration_maintenance_select_authenticated
  ON refrigeration_maintenance FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY refrigeration_maintenance_insert_staff
  ON refrigeration_maintenance FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor', 'staff')
  );

CREATE POLICY refrigeration_maintenance_update_supervisor
  ON refrigeration_maintenance FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY refrigeration_maintenance_delete_facility_admin
  ON refrigeration_maintenance FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- AIR QUALITY READINGS
-- ============================================================

ALTER TABLE air_quality_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY air_quality_readings_select_authenticated
  ON air_quality_readings FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY air_quality_readings_insert_staff
  ON air_quality_readings FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor', 'staff')
  );

CREATE POLICY air_quality_readings_update_supervisor
  ON air_quality_readings FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY air_quality_readings_delete_facility_admin
  ON air_quality_readings FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
-- Users can only read their own notifications.
-- Users can update their own notifications (mark as read).
-- Users can delete their own notifications.
-- Notifications are created by server-side functions (service role),
-- but we also allow facility_admin+ to insert for in-app messaging.

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_own
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow facility_admin+ to create notifications for users in their facility
CREATE POLICY notifications_insert_facility_admin
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor')
  );

CREATE POLICY notifications_update_own
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY notifications_delete_own
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
-- Users can only manage their own notification preferences.

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_preferences_select_own
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY notification_preferences_insert_own
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND facility_id = auth.facility_id()
  );

CREATE POLICY notification_preferences_update_own
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY notification_preferences_delete_own
  ON notification_preferences FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- REPORT ARCHIVES
-- ============================================================
-- All can read report archives in their facility.
-- Staff+ can generate (insert) report archives.
-- Facility admins can update and delete.

ALTER TABLE report_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY report_archives_select_authenticated
  ON report_archives FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY report_archives_insert_staff
  ON report_archives FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager', 'supervisor', 'staff')
  );

CREATE POLICY report_archives_update_facility_admin
  ON report_archives FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY report_archives_delete_facility_admin
  ON report_archives FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

-- ============================================================
-- SCHEDULED REPORTS
-- ============================================================
-- All can read scheduled reports in their facility.
-- Managers+ can create and update scheduled reports.
-- Facility admins can delete.

ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY scheduled_reports_select_authenticated
  ON scheduled_reports FOR SELECT
  TO authenticated
  USING (facility_id = auth.facility_id());

CREATE POLICY scheduled_reports_insert_manager
  ON scheduled_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager')
  );

CREATE POLICY scheduled_reports_update_manager
  ON scheduled_reports FOR UPDATE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin', 'manager')
  )
  WITH CHECK (
    facility_id = auth.facility_id()
  );

CREATE POLICY scheduled_reports_delete_facility_admin
  ON scheduled_reports FOR DELETE
  TO authenticated
  USING (
    facility_id = auth.facility_id()
    AND auth.user_role() IN ('facility_admin')
  );

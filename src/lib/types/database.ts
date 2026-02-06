// Auto-generated TypeScript types matching the Supabase schema
// Update this file when schema changes

// ============================================================
// ENUMS
// ============================================================

export type UserRole =
  | "super_admin"
  | "facility_admin"
  | "manager"
  | "supervisor"
  | "staff"
  | "read_only";

export type ModuleType =
  | "daily_reports"
  | "ice_depth"
  | "ice_operations"
  | "scheduling"
  | "incidents"
  | "refrigeration"
  | "air_quality";

export type ReportStatus =
  | "draft"
  | "submitted"
  | "reviewed"
  | "approved"
  | "rejected";

export type IncidentType =
  | "injury"
  | "equipment_failure"
  | "safety_hazard"
  | "property_damage"
  | "near_miss"
  | "other";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type IncidentStatus =
  | "open"
  | "investigating"
  | "resolved"
  | "closed";

export type ShiftStatus = "draft" | "published" | "cancelled";

export type SwapStatus = "pending" | "approved" | "denied" | "cancelled";

export type TimeOffStatus = "pending" | "approved" | "denied" | "cancelled";

export type NotificationChannel = "in_app" | "email" | "sms";

export type NotificationType =
  | "alert"
  | "threshold_warning"
  | "report_submitted"
  | "report_approved"
  | "report_rejected"
  | "shift_assigned"
  | "shift_swap_request"
  | "incident_created"
  | "maintenance_due"
  | "general";

export type ChecklistFieldType =
  | "checkbox"
  | "number"
  | "text"
  | "select"
  | "temperature"
  | "pressure"
  | "time";

export type EquipmentType =
  | "zamboni"
  | "edger"
  | "compressor"
  | "pump"
  | "dehumidifier"
  | "sensor"
  | "other";

export type EquipmentStatus = "active" | "maintenance" | "retired";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

// ============================================================
// TABLE TYPES
// ============================================================

export interface Facility {
  id: string;
  name: string;
  short_name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string;
  timezone: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  session_duration_hours: number;
  number_of_rinks: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  facility_id: string | null;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModuleSetting {
  id: string;
  facility_id: string;
  module: ModuleType;
  is_enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TabConfiguration {
  id: string;
  facility_id: string;
  module: ModuleType;
  name: string;
  label: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  facility_id: string;
  tab_id: string;
  label: string;
  description: string | null;
  field_type: ChecklistFieldType;
  options: string[] | null;
  default_value: string | null;
  unit: string | null;
  min_value: number | null;
  max_value: number | null;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  facility_id: string;
  name: string;
  type: EquipmentType;
  make: string | null;
  model: string | null;
  serial_number: string | null;
  year: number | null;
  status: EquipmentStatus;
  notes: string | null;
  maintenance_interval_days: number | null;
  last_maintenance_at: string | null;
  next_maintenance_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Threshold {
  id: string;
  facility_id: string;
  module: ModuleType;
  metric_name: string;
  metric_label: string;
  unit: string | null;
  warning_low: number | null;
  warning_high: number | null;
  critical_low: number | null;
  critical_high: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShiftType {
  id: string;
  facility_id: string;
  name: string;
  color: string;
  start_time: string | null;
  end_time: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Rink {
  id: string;
  facility_id: string;
  name: string;
  dimensions_length: number | null;
  dimensions_width: number | null;
  surface_type: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RinkZone {
  id: string;
  rink_id: string;
  facility_id: string;
  name: string;
  label: string;
  x_position: number | null;
  y_position: number | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Daily Reports
export interface DailyReport {
  id: string;
  facility_id: string;
  report_date: string;
  status: ReportStatus;
  submitted_by: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistResponse {
  id: string;
  facility_id: string;
  daily_report_id: string;
  checklist_item_id: string;
  tab_id: string;
  value: string | null;
  numeric_value: number | null;
  is_flagged: boolean;
  notes: string | null;
  recorded_by: string;
  event_time: string;
  created_at: string;
  updated_at: string;
}

// Ice Depth
export interface IceDepthMeasurement {
  id: string;
  facility_id: string;
  rink_id: string;
  zone_id: string;
  depth_inches: number;
  measurement_method: string;
  is_flagged: boolean;
  notes: string | null;
  measured_by: string;
  event_time: string;
  created_at: string;
  updated_at: string;
}

export interface IceEvent {
  id: string;
  facility_id: string;
  rink_id: string;
  event_type: "cut" | "flood" | "full_resurface" | "patch";
  depth_removed_inches: number | null;
  depth_added_inches: number | null;
  water_temperature_f: number | null;
  notes: string | null;
  performed_by: string;
  event_time: string;
  created_at: string;
  updated_at: string;
}

// Ice Operations
export interface IceMake {
  id: string;
  facility_id: string;
  rink_id: string;
  equipment_id: string | null;
  resurface_type: "full" | "half" | "spot" | "dry_cut";
  water_temperature_f: number | null;
  ice_temperature_f: number | null;
  water_usage_gallons: number | null;
  duration_minutes: number | null;
  blade_condition: "new" | "good" | "fair" | "poor" | null;
  notes: string | null;
  operator_id: string;
  event_time: string;
  created_at: string;
  updated_at: string;
}

export interface IceMaintenanceLog {
  id: string;
  facility_id: string;
  equipment_id: string;
  maintenance_type: string;
  description: string | null;
  parts_used: string | null;
  cost: number | null;
  performed_by: string;
  event_time: string;
  next_due_at: string | null;
  created_at: string;
  updated_at: string;
}

// Scheduling
export interface Schedule {
  id: string;
  facility_id: string;
  week_start: string;
  status: ShiftStatus;
  published_by: string | null;
  published_at: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleEntry {
  id: string;
  facility_id: string;
  schedule_id: string;
  employee_id: string;
  shift_type_id: string | null;
  shift_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeAvailability {
  id: string;
  facility_id: string;
  employee_id: string;
  day_of_week: DayOfWeek;
  start_time: string | null;
  end_time: string | null;
  is_available: boolean;
  effective_from: string | null;
  effective_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShiftSwapRequest {
  id: string;
  facility_id: string;
  requester_entry_id: string;
  target_entry_id: string | null;
  target_employee_id: string | null;
  status: SwapStatus;
  reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeOffRequest {
  id: string;
  facility_id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: TimeOffStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Incident Reporting
export interface IncidentReport {
  id: string;
  facility_id: string;
  rink_id: string | null;
  incident_number: number;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  location: string | null;
  injured_party_name: string | null;
  injured_party_contact: string | null;
  witnesses: string | null;
  immediate_action: string | null;
  root_cause: string | null;
  reported_by: string;
  assigned_to: string | null;
  event_time: string;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentFollowUp {
  id: string;
  facility_id: string;
  incident_id: string;
  action_taken: string;
  notes: string | null;
  follow_up_by: string;
  follow_up_date: string;
  created_at: string;
  updated_at: string;
}

// Refrigeration
export interface RefrigerationReading {
  id: string;
  facility_id: string;
  equipment_id: string | null;
  suction_pressure_psi: number | null;
  discharge_pressure_psi: number | null;
  suction_temperature_f: number | null;
  discharge_temperature_f: number | null;
  oil_pressure_psi: number | null;
  oil_temperature_f: number | null;
  condenser_pressure_psi: number | null;
  condenser_temperature_f: number | null;
  brine_supply_temperature_f: number | null;
  brine_return_temperature_f: number | null;
  slab_temperature_f: number | null;
  room_temperature_f: number | null;
  room_humidity_percent: number | null;
  is_flagged: boolean;
  notes: string | null;
  recorded_by: string;
  event_time: string;
  created_at: string;
  updated_at: string;
}

export interface RefrigerationMaintenance {
  id: string;
  facility_id: string;
  equipment_id: string;
  maintenance_type: string;
  description: string | null;
  parts_replaced: string | null;
  coolant_added_lbs: number | null;
  cost: number | null;
  performed_by: string;
  vendor: string | null;
  event_time: string;
  next_due_at: string | null;
  created_at: string;
  updated_at: string;
}

// Air Quality
export interface AirQualityReading {
  id: string;
  facility_id: string;
  rink_id: string | null;
  co_ppm: number | null;
  no2_ppm: number | null;
  humidity_percent: number | null;
  temperature_f: number | null;
  location: string | null;
  is_flagged: boolean;
  notes: string | null;
  recorded_by: string;
  event_time: string;
  created_at: string;
  updated_at: string;
}

// Notifications
export interface Notification {
  id: string;
  facility_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  channels: NotificationChannel[];
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  facility_id: string;
  notification_type: NotificationType;
  in_app: boolean;
  email: boolean;
  sms: boolean;
  created_at: string;
  updated_at: string;
}

// Reporting
export interface ReportArchive {
  id: string;
  facility_id: string;
  report_type: string;
  title: string;
  file_format: "pdf" | "csv" | "xlsx";
  file_url: string | null;
  file_size_bytes: number | null;
  date_range_start: string | null;
  date_range_end: string | null;
  generated_by: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ScheduledReport {
  id: string;
  facility_id: string;
  report_type: string;
  title: string;
  frequency: "daily" | "weekly" | "monthly";
  file_format: "pdf" | "csv" | "xlsx";
  recipients: string[];
  email_recipients: string[];
  config: Record<string, unknown>;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

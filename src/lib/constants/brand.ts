export const BRAND = {
  name: "Max Facility Rink Reports",
  shortName: "Max Facility",
  colors: {
    navy: "#002244",
    navyDark: "#001122",
    navyLight: "#003366",
    actionGreen: "#69BE28",
    actionGreenHover: "#5AA822",
    wolfGrey: "#A5ACAF",
    wolfGreyLight: "#D1D5D8",
    wolfGreyDark: "#6B7280",
    alertYellow: "#FFB800",
    alertRed: "#D32F2F",
  },
} as const;

export const MODULE_NAMES = {
  DAILY_REPORTS: "Daily Reports",
  ICE_DEPTH: "Ice Depth Management",
  ICE_OPERATIONS: "Ice Operations",
  SCHEDULING: "Employee Scheduling",
  INCIDENTS: "Incident Reporting",
  REFRIGERATION: "Refrigeration Plant Logs",
  AIR_QUALITY: "Air Quality Monitoring",
  ADMIN: "Admin Control Center",
} as const;

export const USER_ROLES = {
  SUPER_ADMIN: "super_admin",
  FACILITY_ADMIN: "facility_admin",
  MANAGER: "manager",
  SUPERVISOR: "supervisor",
  STAFF: "staff",
  READ_ONLY: "read_only",
} as const;

// User roles ordered by privilege level (highest to lowest)
export const USER_ROLES_ORDERED = [
  "super_admin",
  "facility_admin",
  "manager",
  "supervisor",
  "staff",
  "read_only",
] as const;

// Role display names
export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  facility_admin: "Facility Admin",
  manager: "Manager",
  supervisor: "Supervisor",
  staff: "Staff",
  read_only: "Read Only",
};

// Application modules
export const APP_MODULES = [
  "dashboard",
  "daily-reports",
  "ice-depth",
  "ice-operations",
  "scheduling",
  "incidents",
  "refrigeration",
  "air-quality",
] as const;

export type AppModule = (typeof APP_MODULES)[number];

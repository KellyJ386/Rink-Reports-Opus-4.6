export const BRAND = {
  name: 'Max Facility Rink Reports',
  shortName: 'Max Facility',
  colors: {
    navy: '#002244',
    navyDark: '#001122',
    navyLight: '#003366',
    actionGreen: '#69BE28',
    actionGreenHover: '#5AA822',
    wolfGrey: '#A5ACAF',
    wolfGreyLight: '#D1D5D8',
    wolfGreyDark: '#6B7280',
    alertYellow: '#FFB800',
    alertRed: '#D32F2F',
  },
} as const;

export const MODULE_NAMES = {
  DAILY_REPORTS: 'Daily Reports',
  ICE_DEPTH: 'Ice Depth Management',
  ICE_OPERATIONS: 'Ice Operations',
  SCHEDULING: 'Employee Scheduling',
  INCIDENTS: 'Incident Reporting',
  REFRIGERATION: 'Refrigeration Plant Logs',
  AIR_QUALITY: 'Air Quality Monitoring',
  ADMIN: 'Admin Control Center',
} as const;

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  FACILITY_ADMIN: 'facility_admin',
  MANAGER: 'manager',
  SUPERVISOR: 'supervisor',
  STAFF: 'staff',
  READ_ONLY: 'read_only',
} as const;

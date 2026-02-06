import {
  ClipboardList,
  Ruler,
  Snowflake,
  Calendar,
  AlertTriangle,
  Thermometer,
  Wind,
  Settings,
  FileBarChart,
} from 'lucide-react'

export const MODULE_ICONS = {
  daily_reports: ClipboardList,
  ice_depth: Ruler,
  ice_operations: Snowflake,
  scheduling: Calendar,
  incidents: AlertTriangle,
  refrigeration: Thermometer,
  air_quality: Wind,
  admin: Settings,
  reports: FileBarChart,
} as const

export const MODULE_ROUTES = {
  daily_reports: '/daily-reports',
  ice_depth: '/ice-depth',
  ice_operations: '/ice-operations',
  scheduling: '/scheduling',
  incidents: '/incidents',
  refrigeration: '/refrigeration',
  air_quality: '/air-quality',
  admin: '/admin',
  reports: '/reports',
} as const

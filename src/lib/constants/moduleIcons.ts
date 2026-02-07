import {
  ClipboardList,
  Ruler,
  Snowflake,
  Calendar,
  AlertTriangle,
  Thermometer,
  Wind,
  Settings,
} from 'lucide-react'

export const MODULE_CONFIG = {
  daily_reports: { icon: ClipboardList, label: 'Daily Reports', href: '/daily-reports' },
  ice_depth: { icon: Ruler, label: 'Ice Depth', href: '/ice-depth' },
  ice_operations: { icon: Snowflake, label: 'Ice Operations', href: '/ice-operations' },
  scheduling: { icon: Calendar, label: 'Scheduling', href: '/scheduling' },
  incidents: { icon: AlertTriangle, label: 'Incidents', href: '/incidents' },
  refrigeration: { icon: Thermometer, label: 'Refrigeration', href: '/refrigeration' },
  air_quality: { icon: Wind, label: 'Air Quality', href: '/air-quality' },
  admin: { icon: Settings, label: 'Admin', href: '/admin' },
} as const

export type ModuleId = keyof typeof MODULE_CONFIG

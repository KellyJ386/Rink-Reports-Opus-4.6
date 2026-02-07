import { describe, it, expect } from 'vitest'
import { BRAND, MODULE_NAMES, USER_ROLES } from './brand'

describe('BRAND constants', () => {
  it('has correct brand name', () => {
    expect(BRAND.name).toBe('Max Facility Rink Reports')
    expect(BRAND.shortName).toBe('Max Facility')
  })

  it('has all required color hex values', () => {
    expect(BRAND.colors.navy).toBe('#002244')
    expect(BRAND.colors.navyDark).toBe('#001122')
    expect(BRAND.colors.navyLight).toBe('#003366')
    expect(BRAND.colors.actionGreen).toBe('#69BE28')
    expect(BRAND.colors.actionGreenHover).toBe('#5AA822')
    expect(BRAND.colors.wolfGrey).toBe('#A5ACAF')
    expect(BRAND.colors.wolfGreyLight).toBe('#D1D5D8')
    expect(BRAND.colors.wolfGreyDark).toBe('#6B7280')
    expect(BRAND.colors.alertYellow).toBe('#FFB800')
    expect(BRAND.colors.alertRed).toBe('#D32F2F')
  })

  it('all color values are valid hex codes', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/
    for (const [, value] of Object.entries(BRAND.colors)) {
      expect(value).toMatch(hexRegex)
    }
  })
})

describe('MODULE_NAMES', () => {
  it('has all 8 module names', () => {
    expect(Object.keys(MODULE_NAMES)).toHaveLength(8)
  })

  it('includes all core modules', () => {
    expect(MODULE_NAMES.DAILY_REPORTS).toBe('Daily Reports')
    expect(MODULE_NAMES.ICE_DEPTH).toBe('Ice Depth Management')
    expect(MODULE_NAMES.ICE_OPERATIONS).toBe('Ice Operations')
    expect(MODULE_NAMES.SCHEDULING).toBe('Employee Scheduling')
    expect(MODULE_NAMES.INCIDENTS).toBe('Incident Reporting')
    expect(MODULE_NAMES.REFRIGERATION).toBe('Refrigeration Plant Logs')
    expect(MODULE_NAMES.AIR_QUALITY).toBe('Air Quality Monitoring')
    expect(MODULE_NAMES.ADMIN).toBe('Admin Control Center')
  })
})

describe('USER_ROLES', () => {
  it('has all 6 roles', () => {
    expect(Object.keys(USER_ROLES)).toHaveLength(6)
  })

  it('defines the correct role hierarchy values', () => {
    expect(USER_ROLES.SUPER_ADMIN).toBe('super_admin')
    expect(USER_ROLES.FACILITY_ADMIN).toBe('facility_admin')
    expect(USER_ROLES.MANAGER).toBe('manager')
    expect(USER_ROLES.SUPERVISOR).toBe('supervisor')
    expect(USER_ROLES.STAFF).toBe('staff')
    expect(USER_ROLES.READ_ONLY).toBe('read_only')
  })
})

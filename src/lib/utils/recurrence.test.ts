import { describe, it, expect } from 'vitest'
import { shouldShowItem } from './recurrence'

describe('shouldShowItem', () => {
  describe('daily recurrence', () => {
    it('returns true for any date', () => {
      expect(shouldShowItem('daily', new Date('2026-01-01'))).toBe(true)
      expect(shouldShowItem('daily', new Date('2026-06-15'))).toBe(true)
      expect(shouldShowItem('daily', new Date('2026-12-31'))).toBe(true)
    })
  })

  describe('weekly recurrence', () => {
    it('returns true on Mondays', () => {
      // 2026-01-05 is a Monday
      expect(shouldShowItem('weekly', new Date('2026-01-05'))).toBe(true)
    })

    it('returns false on non-Mondays', () => {
      // 2026-01-06 is a Tuesday
      expect(shouldShowItem('weekly', new Date('2026-01-06'))).toBe(false)
      // 2026-01-04 is a Sunday
      expect(shouldShowItem('weekly', new Date('2026-01-04'))).toBe(false)
      // 2026-01-07 is a Wednesday
      expect(shouldShowItem('weekly', new Date('2026-01-07'))).toBe(false)
    })
  })

  describe('monthly recurrence', () => {
    it('returns true on the 1st of the month', () => {
      expect(shouldShowItem('monthly', new Date('2026-01-01'))).toBe(true)
      expect(shouldShowItem('monthly', new Date('2026-06-01'))).toBe(true)
      expect(shouldShowItem('monthly', new Date('2026-12-01'))).toBe(true)
    })

    it('returns false on other days', () => {
      expect(shouldShowItem('monthly', new Date('2026-01-02'))).toBe(false)
      expect(shouldShowItem('monthly', new Date('2026-06-15'))).toBe(false)
      expect(shouldShowItem('monthly', new Date('2026-12-31'))).toBe(false)
    })
  })

  describe('seasonal recurrence', () => {
    const iceSeasonMonths = [9, 10, 11, 12, 1, 2, 3]

    it('returns true when month is in openMonths', () => {
      // January = month 1
      expect(shouldShowItem('seasonal', new Date('2026-01-15'), iceSeasonMonths)).toBe(true)
      // September = month 9
      expect(shouldShowItem('seasonal', new Date('2026-09-01'), iceSeasonMonths)).toBe(true)
      // December = month 12
      expect(shouldShowItem('seasonal', new Date('2026-12-25'), iceSeasonMonths)).toBe(true)
    })

    it('returns false when month is not in openMonths', () => {
      // June = month 6
      expect(shouldShowItem('seasonal', new Date('2026-06-15'), iceSeasonMonths)).toBe(false)
      // July = month 7
      expect(shouldShowItem('seasonal', new Date('2026-07-01'), iceSeasonMonths)).toBe(false)
      // August = month 8
      expect(shouldShowItem('seasonal', new Date('2026-08-31'), iceSeasonMonths)).toBe(false)
    })

    it('returns true when openMonths is empty', () => {
      expect(shouldShowItem('seasonal', new Date('2026-06-15'), [])).toBe(true)
    })

    it('returns true when openMonths is undefined', () => {
      expect(shouldShowItem('seasonal', new Date('2026-06-15'))).toBe(true)
    })
  })

  describe('unknown recurrence', () => {
    it('returns true for unknown types', () => {
      expect(shouldShowItem('unknown', new Date('2026-01-01'))).toBe(true)
      expect(shouldShowItem('biweekly', new Date('2026-01-01'))).toBe(true)
      expect(shouldShowItem('', new Date('2026-01-01'))).toBe(true)
    })
  })
})

import { describe, it, expect } from 'vitest'
import { BODY_REGIONS } from './bodyRegions'

describe('BODY_REGIONS', () => {
  it('contains 32 body regions', () => {
    expect(BODY_REGIONS).toHaveLength(32)
  })

  it('has unique IDs', () => {
    const ids = BODY_REGIONS.map((r) => r.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(BODY_REGIONS.length)
  })

  it('every region has a non-empty label', () => {
    for (const region of BODY_REGIONS) {
      expect(region.label.length).toBeGreaterThan(0)
    }
  })

  it('every region has a valid view type', () => {
    const validViews = ['front', 'back', 'both']
    for (const region of BODY_REGIONS) {
      expect(validViews).toContain(region.view)
    }
  })

  it('has both front and back views', () => {
    const views = new Set(BODY_REGIONS.map((r) => r.view))
    expect(views).toContain('front')
    expect(views).toContain('back')
    expect(views).toContain('both')
  })

  it('includes critical body parts', () => {
    const ids = BODY_REGIONS.map((r) => r.id)
    expect(ids).toContain('head_front')
    expect(ids).toContain('chest')
    expect(ids).toContain('left_knee')
    expect(ids).toContain('right_knee')
    expect(ids).toContain('lower_back')
  })
})

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

/**
 * These tests validate the Zod schemas used across server actions.
 * The schemas are mirrored here because server action files use 'use server'
 * and cannot be imported directly into Vitest.
 */

// === Incident Report Schema (from incidents/actions.ts) ===
const IncidentReportSchema = z.object({
  incident_type: z.enum(['incident', 'accident']),
  event_time: z.string().min(1, 'Event time is required'),
  location_id: z.string().nullable().optional(),
  location_text: z.string().optional().default(''),
  description: z.string().min(1, 'Description is required'),
  injured_party_name: z.string().optional().default(''),
  injured_party_type: z.enum(['patron', 'staff']).nullable().optional(),
  body_diagram_regions: z.array(z.string()).optional().default([]),
  witnesses: z.string().optional().default(''),
})

describe('IncidentReportSchema', () => {
  const validIncident = {
    incident_type: 'incident',
    event_time: '2026-01-15T10:30:00',
    description: 'Slip and fall near the rink entrance',
  }

  const validAccident = {
    incident_type: 'accident',
    event_time: '2026-01-15T14:00:00',
    description: 'Player collision resulting in arm injury',
    injured_party_name: 'John Doe',
    injured_party_type: 'patron',
    body_diagram_regions: ['left_upper_arm', 'left_elbow'],
  }

  it('accepts a valid incident', () => {
    const result = IncidentReportSchema.safeParse(validIncident)
    expect(result.success).toBe(true)
  })

  it('accepts a valid accident with body regions', () => {
    const result = IncidentReportSchema.safeParse(validAccident)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.body_diagram_regions).toEqual([
        'left_upper_arm',
        'left_elbow',
      ])
    }
  })

  it('rejects invalid incident_type', () => {
    const result = IncidentReportSchema.safeParse({
      ...validIncident,
      incident_type: 'near_miss',
    })
    expect(result.success).toBe(false)
  })

  it('requires event_time', () => {
    const result = IncidentReportSchema.safeParse({
      ...validIncident,
      event_time: '',
    })
    expect(result.success).toBe(false)
  })

  it('requires description', () => {
    const result = IncidentReportSchema.safeParse({
      ...validIncident,
      description: '',
    })
    expect(result.success).toBe(false)
  })

  it('defaults body_diagram_regions to empty array', () => {
    const result = IncidentReportSchema.safeParse(validIncident)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.body_diagram_regions).toEqual([])
    }
  })

  it('allows null location_id', () => {
    const result = IncidentReportSchema.safeParse({
      ...validIncident,
      location_id: null,
    })
    expect(result.success).toBe(true)
  })

  it('only allows patron or staff injured_party_type', () => {
    const result = IncidentReportSchema.safeParse({
      ...validAccident,
      injured_party_type: 'visitor',
    })
    expect(result.success).toBe(false)
  })
})

// === Create Shift Schema (from scheduling/actions.ts) ===
const CreateShiftSchema = z.object({
  shift_type_id: z.string().uuid(),
  assigned_to: z.string().uuid().nullable().optional(),
  shift_date: z.string().min(1, 'Date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  is_open: z.boolean().optional().default(false),
  is_broadcast: z.boolean().optional().default(false),
  notes: z.string().optional().default(''),
})

describe('CreateShiftSchema', () => {
  const validShift = {
    shift_type_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    assigned_to: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    shift_date: '2026-01-20',
    start_time: '08:00',
    end_time: '16:00',
  }

  it('accepts a valid shift', () => {
    const result = CreateShiftSchema.safeParse(validShift)
    expect(result.success).toBe(true)
  })

  it('accepts open shift with null assigned_to', () => {
    const result = CreateShiftSchema.safeParse({
      ...validShift,
      assigned_to: null,
      is_open: true,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.is_open).toBe(true)
    }
  })

  it('requires valid UUID for shift_type_id', () => {
    const result = CreateShiftSchema.safeParse({
      ...validShift,
      shift_type_id: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('requires shift_date', () => {
    const result = CreateShiftSchema.safeParse({
      ...validShift,
      shift_date: '',
    })
    expect(result.success).toBe(false)
  })

  it('defaults is_open to false', () => {
    const result = CreateShiftSchema.safeParse(validShift)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.is_open).toBe(false)
    }
  })
})

// === Air Quality Reading Schema (from air-quality/actions.ts) ===
const airQualityReadingSchema = z.object({
  location_id: z.string().uuid().nullable(),
  recorded_at: z.string(),
  notes: z.string().optional(),
  values: z
    .array(
      z.object({
        metric_id: z.string().uuid(),
        value: z.number(),
      })
    )
    .min(1),
})

describe('airQualityReadingSchema', () => {
  const validReading = {
    location_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    recorded_at: '2026-01-15T10:30:00',
    values: [
      { metric_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', value: 45.5 },
    ],
  }

  it('accepts a valid reading', () => {
    const result = airQualityReadingSchema.safeParse(validReading)
    expect(result.success).toBe(true)
  })

  it('requires at least one value', () => {
    const result = airQualityReadingSchema.safeParse({
      ...validReading,
      values: [],
    })
    expect(result.success).toBe(false)
  })

  it('allows null location_id', () => {
    const result = airQualityReadingSchema.safeParse({
      ...validReading,
      location_id: null,
    })
    expect(result.success).toBe(true)
  })

  it('requires numeric value', () => {
    const result = airQualityReadingSchema.safeParse({
      ...validReading,
      values: [
        { metric_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', value: 'high' },
      ],
    })
    expect(result.success).toBe(false)
  })

  it('accepts multiple metric values', () => {
    const result = airQualityReadingSchema.safeParse({
      ...validReading,
      values: [
        { metric_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', value: 45.5 },
        { metric_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', value: 12.0 },
        { metric_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', value: 0 },
      ],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.values).toHaveLength(3)
    }
  })
})

// === Refrigeration Reading Schema (from refrigeration/actions.ts) ===
const refrigerationReadingSchema = z.object({
  equipment_id: z.string().uuid(),
  recorded_at: z.string(),
  notes: z.string().optional(),
  values: z
    .array(
      z.object({
        reading_type_id: z.string().uuid(),
        numeric_value: z.number().nullable().optional(),
        oil_level_value: z.enum(['ok', 'low', 'add']).nullable().optional(),
      })
    )
    .min(1),
})

describe('refrigerationReadingSchema', () => {
  const validReading = {
    equipment_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    recorded_at: '2026-01-15T08:00:00',
    values: [
      {
        reading_type_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        numeric_value: 150,
      },
    ],
  }

  it('accepts a valid numeric reading', () => {
    const result = refrigerationReadingSchema.safeParse(validReading)
    expect(result.success).toBe(true)
  })

  it('accepts oil level reading', () => {
    const result = refrigerationReadingSchema.safeParse({
      ...validReading,
      values: [
        {
          reading_type_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
          oil_level_value: 'ok',
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid oil level value', () => {
    const result = refrigerationReadingSchema.safeParse({
      ...validReading,
      values: [
        {
          reading_type_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
          oil_level_value: 'full',
        },
      ],
    })
    expect(result.success).toBe(false)
  })

  it('requires at least one value', () => {
    const result = refrigerationReadingSchema.safeParse({
      ...validReading,
      values: [],
    })
    expect(result.success).toBe(false)
  })

  it('requires valid UUID for equipment_id', () => {
    const result = refrigerationReadingSchema.safeParse({
      ...validReading,
      equipment_id: 'not-valid',
    })
    expect(result.success).toBe(false)
  })
})

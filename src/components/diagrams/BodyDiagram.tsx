'use client'

import { useCallback } from 'react'
import { cn } from '@/lib/utils'
import { BODY_REGIONS } from '@/lib/constants/bodyRegions'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

// ============================================
// Types
// ============================================

export interface BodyDiagramProps {
  selectedRegions: string[]
  onRegionToggle: (id: string) => void
  readOnly?: boolean
}

// ============================================
// Region coordinates for SVG hit areas
// Each region maps to { x, y, w, h } in a 200x440 viewBox (front/back each)
// ============================================

interface RegionShape {
  type: 'ellipse' | 'rect'
  cx: number
  cy: number
  rx?: number
  ry?: number
  w?: number
  h?: number
}

const FRONT_REGIONS: Record<string, RegionShape> = {
  head_front:      { type: 'ellipse', cx: 100, cy: 30,  rx: 22, ry: 26 },
  face:            { type: 'ellipse', cx: 100, cy: 52,  rx: 18, ry: 12 },
  neck_front:      { type: 'rect',    cx: 100, cy: 74,  w: 20,  h: 16 },
  left_shoulder:   { type: 'ellipse', cx: 62,  cy: 100, rx: 18, ry: 12 },
  right_shoulder:  { type: 'ellipse', cx: 138, cy: 100, rx: 18, ry: 12 },
  chest:           { type: 'rect',    cx: 100, cy: 120, w: 56,  h: 36 },
  left_upper_arm:  { type: 'rect',    cx: 42,  cy: 130, w: 16,  h: 40 },
  right_upper_arm: { type: 'rect',    cx: 158, cy: 130, w: 16,  h: 40 },
  left_elbow:      { type: 'ellipse', cx: 38,  cy: 168, rx: 10, ry: 10 },
  right_elbow:     { type: 'ellipse', cx: 162, cy: 168, rx: 10, ry: 10 },
  abdomen:         { type: 'rect',    cx: 100, cy: 165, w: 50,  h: 32 },
  left_forearm:    { type: 'rect',    cx: 34,  cy: 198, w: 14,  h: 36 },
  right_forearm:   { type: 'rect',    cx: 166, cy: 198, w: 14,  h: 36 },
  left_wrist:      { type: 'ellipse', cx: 30,  cy: 228, rx: 8,  ry: 8 },
  right_wrist:     { type: 'ellipse', cx: 170, cy: 228, rx: 8,  ry: 8 },
  left_hand:       { type: 'ellipse', cx: 26,  cy: 248, rx: 10, ry: 12 },
  right_hand:      { type: 'ellipse', cx: 174, cy: 248, rx: 10, ry: 12 },
  hip_pelvis:      { type: 'rect',    cx: 100, cy: 200, w: 54,  h: 24 },
  left_upper_leg:  { type: 'rect',    cx: 82,  cy: 248, w: 20,  h: 50 },
  right_upper_leg: { type: 'rect',    cx: 118, cy: 248, w: 20,  h: 50 },
  left_knee:       { type: 'ellipse', cx: 82,  cy: 300, rx: 12, ry: 14 },
  right_knee:      { type: 'ellipse', cx: 118, cy: 300, rx: 12, ry: 14 },
  left_lower_leg:  { type: 'rect',    cx: 82,  cy: 340, w: 16,  h: 44 },
  right_lower_leg: { type: 'rect',    cx: 118, cy: 340, w: 16,  h: 44 },
  left_ankle:      { type: 'ellipse', cx: 82,  cy: 382, rx: 10, ry: 10 },
  right_ankle:     { type: 'ellipse', cx: 118, cy: 382, rx: 10, ry: 10 },
  left_foot:       { type: 'ellipse', cx: 80,  cy: 406, rx: 14, ry: 12 },
  right_foot:      { type: 'ellipse', cx: 120, cy: 406, rx: 14, ry: 12 },
}

const BACK_REGIONS: Record<string, RegionShape> = {
  head_back:       { type: 'ellipse', cx: 100, cy: 30,  rx: 22, ry: 26 },
  neck_back:       { type: 'rect',    cx: 100, cy: 68,  w: 22,  h: 18 },
  left_shoulder:   { type: 'ellipse', cx: 62,  cy: 100, rx: 18, ry: 12 },
  right_shoulder:  { type: 'ellipse', cx: 138, cy: 100, rx: 18, ry: 12 },
  upper_back:      { type: 'rect',    cx: 100, cy: 122, w: 56,  h: 36 },
  left_upper_arm:  { type: 'rect',    cx: 42,  cy: 130, w: 16,  h: 40 },
  right_upper_arm: { type: 'rect',    cx: 158, cy: 130, w: 16,  h: 40 },
  left_elbow:      { type: 'ellipse', cx: 38,  cy: 168, rx: 10, ry: 10 },
  right_elbow:     { type: 'ellipse', cx: 162, cy: 168, rx: 10, ry: 10 },
  lower_back:      { type: 'rect',    cx: 100, cy: 168, w: 50,  h: 30 },
  left_forearm:    { type: 'rect',    cx: 34,  cy: 198, w: 14,  h: 36 },
  right_forearm:   { type: 'rect',    cx: 166, cy: 198, w: 14,  h: 36 },
  left_wrist:      { type: 'ellipse', cx: 30,  cy: 228, rx: 8,  ry: 8 },
  right_wrist:     { type: 'ellipse', cx: 170, cy: 228, rx: 8,  ry: 8 },
  left_hand:       { type: 'ellipse', cx: 26,  cy: 248, rx: 10, ry: 12 },
  right_hand:      { type: 'ellipse', cx: 174, cy: 248, rx: 10, ry: 12 },
  hip_pelvis:      { type: 'rect',    cx: 100, cy: 200, w: 54,  h: 24 },
  left_upper_leg:  { type: 'rect',    cx: 82,  cy: 248, w: 20,  h: 50 },
  right_upper_leg: { type: 'rect',    cx: 118, cy: 248, w: 20,  h: 50 },
  left_knee:       { type: 'ellipse', cx: 82,  cy: 300, rx: 12, ry: 14 },
  right_knee:      { type: 'ellipse', cx: 118, cy: 300, rx: 12, ry: 14 },
  left_lower_leg:  { type: 'rect',    cx: 82,  cy: 340, w: 16,  h: 44 },
  right_lower_leg: { type: 'rect',    cx: 118, cy: 340, w: 16,  h: 44 },
  left_ankle:      { type: 'ellipse', cx: 82,  cy: 382, rx: 10, ry: 10 },
  right_ankle:     { type: 'ellipse', cx: 118, cy: 382, rx: 10, ry: 10 },
  left_foot:       { type: 'ellipse', cx: 80,  cy: 406, rx: 14, ry: 12 },
  right_foot:      { type: 'ellipse', cx: 120, cy: 406, rx: 14, ry: 12 },
}

// ============================================
// Sub-components
// ============================================

function BodyOutline({ className }: { className?: string }) {
  return (
    <g className={className}>
      {/* Head */}
      <ellipse cx={100} cy={30} rx={22} ry={26} />
      {/* Neck */}
      <rect x={90} y={56} width={20} height={20} rx={4} />
      {/* Torso */}
      <path d="M 72 76 Q 60 82 58 96 L 42 96 Q 34 98 34 110 L 34 160 Q 34 172 42 176 L 58 176 Q 58 190 62 198 L 68 214 L 72 220 Q 76 224 82 224 L 118 224 Q 124 224 128 220 L 132 214 L 138 198 Q 142 190 142 176 L 158 176 Q 166 172 166 160 L 166 110 Q 166 98 158 96 L 142 96 Q 140 82 128 76 Z" />
      {/* Left arm */}
      <path d="M 42 96 Q 30 100 28 114 L 22 180 Q 20 196 18 214 L 14 240 Q 12 260 16 268 L 14 268" />
      <ellipse cx={26} cy={248} rx={12} ry={14} />
      {/* Right arm */}
      <path d="M 158 96 Q 170 100 172 114 L 178 180 Q 180 196 182 214 L 186 240 Q 188 260 184 268 L 186 268" />
      <ellipse cx={174} cy={248} rx={12} ry={14} />
      {/* Left leg */}
      <path d="M 82 224 L 78 260 Q 76 280 74 300 L 72 340 Q 72 370 74 386 L 68 414 Q 66 420 72 424 L 92 424 Q 96 420 94 414 L 90 386 Q 92 370 92 340 L 92 300" />
      {/* Right leg */}
      <path d="M 118 224 L 122 260 Q 124 280 126 300 L 128 340 Q 128 370 126 386 L 132 414 Q 134 420 128 424 L 108 424 Q 104 420 106 414 L 110 386 Q 108 370 108 340 L 108 300" />
    </g>
  )
}

interface RegionHitAreaProps {
  regionId: string
  shape: RegionShape
  isSelected: boolean
  onClick?: () => void
  readOnly: boolean
}

function RegionHitArea({ regionId, shape, isSelected, onClick, readOnly }: RegionHitAreaProps) {
  const fill = isSelected ? 'rgba(211, 47, 47, 0.5)' : 'transparent'
  const hoverClass = readOnly ? '' : 'cursor-pointer hover:fill-alert-red/20'

  const handleClick = () => {
    if (!readOnly && onClick) {
      onClick()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!readOnly && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick()
    }
  }

  const region = BODY_REGIONS.find((r) => r.id === regionId)
  const label = region?.label ?? regionId

  if (shape.type === 'ellipse') {
    return (
      <ellipse
        cx={shape.cx}
        cy={shape.cy}
        rx={shape.rx}
        ry={shape.ry}
        fill={fill}
        stroke={isSelected ? '#D32F2F' : 'transparent'}
        strokeWidth={isSelected ? 1.5 : 0}
        className={cn('transition-all duration-150', hoverClass)}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={readOnly ? undefined : 'button'}
        tabIndex={readOnly ? undefined : 0}
        aria-label={`${label}${isSelected ? ' (selected)' : ''}`}
      />
    )
  }

  return (
    <rect
      x={shape.cx - (shape.w ?? 0) / 2}
      y={shape.cy - (shape.h ?? 0) / 2}
      width={shape.w}
      height={shape.h}
      rx={4}
      fill={fill}
      stroke={isSelected ? '#D32F2F' : 'transparent'}
      strokeWidth={isSelected ? 1.5 : 0}
      className={cn('transition-all duration-150', hoverClass)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={readOnly ? undefined : 'button'}
      tabIndex={readOnly ? undefined : 0}
      aria-label={`${label}${isSelected ? ' (selected)' : ''}`}
    />
  )
}

// ============================================
// Main Component
// ============================================

export default function BodyDiagram({
  selectedRegions,
  onRegionToggle,
  readOnly = false,
}: BodyDiagramProps) {
  const handleToggle = useCallback(
    (id: string) => {
      onRegionToggle(id)
    },
    [onRegionToggle]
  )

  const selectedCount = selectedRegions.length

  return (
    <div className="w-full">
      {/* Diagram header */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">
          Body Diagram {selectedCount > 0 && `(${selectedCount} selected)`}
        </p>
        {!readOnly && selectedCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              selectedRegions.forEach((id) => onRegionToggle(id))
            }}
            className="h-8 text-xs text-wolf-grey-dark hover:text-alert-red"
          >
            <X className="mr-1 h-3 w-3" />
            Clear All
          </Button>
        )}
      </div>

      {/* SVG Diagrams - side by side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Front View */}
        <div>
          <p className="mb-1 text-center text-xs font-medium text-muted-foreground">Front</p>
          <svg
            viewBox="0 0 200 440"
            className="w-full rounded-lg border border-wolf-grey-light bg-white dark:border-wolf-grey-dark dark:bg-navy-dark"
            role="img"
            aria-label="Body diagram front view"
          >
            {/* Body outline */}
            <BodyOutline className="fill-none stroke-wolf-grey dark:stroke-wolf-grey-light [&>*]:stroke-[1.5]" />

            {/* Clickable/selectable regions */}
            {Object.entries(FRONT_REGIONS).map(([id, shape]) => (
              <RegionHitArea
                key={id}
                regionId={id}
                shape={shape}
                isSelected={selectedRegions.includes(id)}
                onClick={() => handleToggle(id)}
                readOnly={readOnly}
              />
            ))}
          </svg>
        </div>

        {/* Back View */}
        <div>
          <p className="mb-1 text-center text-xs font-medium text-muted-foreground">Back</p>
          <svg
            viewBox="0 0 200 440"
            className="w-full rounded-lg border border-wolf-grey-light bg-white dark:border-wolf-grey-dark dark:bg-navy-dark"
            role="img"
            aria-label="Body diagram back view"
          >
            {/* Body outline */}
            <BodyOutline className="fill-none stroke-wolf-grey dark:stroke-wolf-grey-light [&>*]:stroke-[1.5]" />

            {/* Clickable/selectable regions */}
            {Object.entries(BACK_REGIONS).map(([id, shape]) => (
              <RegionHitArea
                key={id}
                regionId={id}
                shape={shape}
                isSelected={selectedRegions.includes(id)}
                onClick={() => handleToggle(id)}
                readOnly={readOnly}
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Selected regions summary */}
      {selectedCount > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {selectedRegions.map((id) => {
            const region = BODY_REGIONS.find((r) => r.id === id)
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full bg-alert-red/10 px-2.5 py-0.5 text-xs font-medium text-alert-red dark:bg-alert-red/20"
              >
                {region?.label ?? id}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleToggle(id)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-alert-red/20"
                    aria-label={`Remove ${region?.label ?? id}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

'use client'

import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────────
export interface MeasurementPoint {
  id: string
  number: number
  x_percent: number
  y_percent: number
  lastReading?: number
}

export interface DepthThresholds {
  green_min: number
  green_max: number
  yellow_min: number
  yellow_max: number
  red_min: number
  red_max: number
}

interface IceRinkDiagramProps {
  points: MeasurementPoint[]
  thresholds: DepthThresholds
  onPointClick: (pointId: string) => void
  className?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const COLORS = {
  noReading: '#A5ACAF',   // wolf-grey
  green: '#69BE28',       // action-green
  yellow: '#FFB800',      // alert-yellow
  red: '#D32F2F',         // alert-red
} as const

function getPointColor(reading: number | undefined, t: DepthThresholds): string {
  if (reading === undefined || reading === null) return COLORS.noReading
  if (reading >= t.red_min && reading <= t.red_max) return COLORS.red
  if (reading >= t.green_min && reading <= t.green_max) return COLORS.green
  if (reading >= t.yellow_min && reading <= t.yellow_max) return COLORS.yellow
  return COLORS.noReading
}

// ── SVG dimensions (logical) ───────────────────────────────────────────────────
// Standard NHL rink ratio ≈ 200:85
const W = 200
const H = 85
const R = 14           // corner radius
const CX = W / 2       // center x
const CY = H / 2       // center y

// ── Component ──────────────────────────────────────────────────────────────────
export default function IceRinkDiagram({
  points,
  thresholds,
  onPointClick,
  className,
}: IceRinkDiagramProps) {
  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-auto"
        role="img"
        aria-label="Ice rink diagram with measurement points"
      >
        {/* ── Definitions ─────────────────────────────────────────── */}
        <defs>
          <clipPath id="rinkClip">
            <rect x={0} y={0} width={W} height={H} rx={R} ry={R} />
          </clipPath>
        </defs>

        {/* ── Rink outline ────────────────────────────────────────── */}
        <rect
          x={0}
          y={0}
          width={W}
          height={H}
          rx={R}
          ry={R}
          fill="white"
          stroke="#002244"
          strokeWidth={0.8}
        />

        <g clipPath="url(#rinkClip)">
          {/* ── Red center line ──────────────────────────────────── */}
          <line
            x1={CX}
            y1={0}
            x2={CX}
            y2={H}
            stroke="#D32F2F"
            strokeWidth={0.8}
          />

          {/* ── Blue lines ───────────────────────────────────────── */}
          <line
            x1={64}
            y1={0}
            x2={64}
            y2={H}
            stroke="#1565C0"
            strokeWidth={0.8}
          />
          <line
            x1={136}
            y1={0}
            x2={136}
            y2={H}
            stroke="#1565C0"
            strokeWidth={0.8}
          />

          {/* ── Center circle ────────────────────────────────────── */}
          <circle
            cx={CX}
            cy={CY}
            r={10}
            fill="none"
            stroke="#1565C0"
            strokeWidth={0.5}
          />
          {/* Center dot */}
          <circle cx={CX} cy={CY} r={1} fill="#1565C0" />

          {/* ── Face-off circles (4 in the zones) ────────────────── */}
          {/* Left zone - top & bottom */}
          <circle cx={31} cy={CY - 14} r={10} fill="none" stroke="#D32F2F" strokeWidth={0.4} />
          <circle cx={31} cy={CY - 14} r={0.8} fill="#D32F2F" />
          <circle cx={31} cy={CY + 14} r={10} fill="none" stroke="#D32F2F" strokeWidth={0.4} />
          <circle cx={31} cy={CY + 14} r={0.8} fill="#D32F2F" />
          {/* Right zone - top & bottom */}
          <circle cx={169} cy={CY - 14} r={10} fill="none" stroke="#D32F2F" strokeWidth={0.4} />
          <circle cx={169} cy={CY - 14} r={0.8} fill="#D32F2F" />
          <circle cx={169} cy={CY + 14} r={10} fill="none" stroke="#D32F2F" strokeWidth={0.4} />
          <circle cx={169} cy={CY + 14} r={0.8} fill="#D32F2F" />

          {/* ── Neutral-zone face-off dots ────────────────────────── */}
          <circle cx={80} cy={CY - 14} r={0.8} fill="#D32F2F" />
          <circle cx={80} cy={CY + 14} r={0.8} fill="#D32F2F" />
          <circle cx={120} cy={CY - 14} r={0.8} fill="#D32F2F" />
          <circle cx={120} cy={CY + 14} r={0.8} fill="#D32F2F" />

          {/* ── Goal creases (2) ──────────────────────────────────── */}
          {/* Left crease */}
          <rect x={2} y={CY - 4} width={1} height={8} fill="#D32F2F" rx={0.2} />
          <path
            d={`M 3,${CY - 4} A 6,6 0 0,1 3,${CY + 4}`}
            fill="rgba(173,216,230,0.3)"
            stroke="#1565C0"
            strokeWidth={0.3}
          />
          {/* Right crease */}
          <rect x={W - 3} y={CY - 4} width={1} height={8} fill="#D32F2F" rx={0.2} />
          <path
            d={`M ${W - 3},${CY - 4} A 6,6 0 0,0 ${W - 3},${CY + 4}`}
            fill="rgba(173,216,230,0.3)"
            stroke="#1565C0"
            strokeWidth={0.3}
          />

          {/* ── Goal lines ───────────────────────────────────────── */}
          <line x1={11} y1={0} x2={11} y2={H} stroke="#D32F2F" strokeWidth={0.3} />
          <line x1={W - 11} y1={0} x2={W - 11} y2={H} stroke="#D32F2F" strokeWidth={0.3} />

          {/* ── Measurement points overlay ────────────────────────── */}
          {points.map((pt) => {
            const px = (pt.x_percent / 100) * W
            const py = (pt.y_percent / 100) * H
            const color = getPointColor(pt.lastReading, thresholds)
            return (
              <g
                key={pt.id}
                onClick={() => onPointClick(pt.id)}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`Point ${pt.number}${pt.lastReading !== undefined ? `, reading: ${pt.lastReading}"` : ', no reading'}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onPointClick(pt.id)
                  }
                }}
              >
                {/* Outer ring for visibility */}
                <circle
                  cx={px}
                  cy={py}
                  r={3.5}
                  fill={color}
                  stroke="white"
                  strokeWidth={0.5}
                  opacity={0.9}
                />
                {/* Point number */}
                <text
                  x={px}
                  y={py + 1}
                  textAnchor="middle"
                  fontSize={3}
                  fontWeight="bold"
                  fill="white"
                  pointerEvents="none"
                >
                  {pt.number}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

// ── Default 15-point grid (5 columns x 3 rows) ────────────────────────────────
export const DEFAULT_MEASUREMENT_POINTS: MeasurementPoint[] = Array.from(
  { length: 15 },
  (_, i) => {
    const col = i % 5
    const row = Math.floor(i / 5)
    return {
      id: `pt-${i + 1}`,
      number: i + 1,
      x_percent: 12 + col * 19,   // 12, 31, 50, 69, 88
      y_percent: 20 + row * 30,   // 20, 50, 80
    }
  },
)

export const DEFAULT_THRESHOLDS: DepthThresholds = {
  green_min: 1.0,
  green_max: 1.74,
  yellow_min: 1.75,
  yellow_max: 3.5,
  red_min: 0.0,
  red_max: 0.99,
}

'use client'

import { useCallback, useMemo } from 'react'

// ============================================
// Types
// ============================================

interface PointData {
  id: string
  point_number: number
  x_percent: number
  y_percent: number
}

interface ReadingData {
  reading_inches: number
  measured_at: string
  measured_by_name: string
}

interface Thresholds {
  green_min: number
  green_max: number
  yellow_min: number
  yellow_max: number
  red_min: number
  red_max: number
}

export interface IceRinkDiagramProps {
  rinkName: string
  points: PointData[]
  readings: Record<string, ReadingData>
  thresholds: Thresholds | null
  onPointClick: (pointId: string, pointNumber: number) => void
  logoUrl?: string | null
}

// ============================================
// Constants
// ============================================

// SVG viewBox dimensions (200ft x 85ft aspect ratio scaled up for precision)
const RINK_WIDTH = 1000
const RINK_HEIGHT = 425
const PADDING = 40
const VIEW_WIDTH = RINK_WIDTH + PADDING * 2
const VIEW_HEIGHT = RINK_HEIGHT + PADDING * 2
const CORNER_RADIUS = 120
const POINT_RADIUS = 16

// Rink line positions (as fraction of rink width)
const CENTER_X = RINK_WIDTH / 2
const CENTER_Y = RINK_HEIGHT / 2
const BLUE_LINE_OFFSET = RINK_WIDTH * 0.25 // Blue lines at 25% and 75%
const CENTER_CIRCLE_R = 75
const FACEOFF_CIRCLE_R = 75
const FACEOFF_DOT_R = 6
const CREASE_WIDTH = 36
const CREASE_HEIGHT = 48

// ============================================
// Helper Functions
// ============================================

function getPointColor(
  pointId: string,
  readings: Record<string, ReadingData>,
  thresholds: Thresholds | null
): { bg: string; text: string; label: string } {
  const reading = readings[pointId]
  if (!reading || !thresholds) {
    return { bg: '#A5ACAF', text: '#FFFFFF', label: 'no-reading' }
  }

  const val = reading.reading_inches

  if (val >= thresholds.green_min && val <= thresholds.green_max) {
    return { bg: '#69BE28', text: '#FFFFFF', label: 'green' }
  }
  if (val >= thresholds.yellow_min && val <= thresholds.yellow_max) {
    return { bg: '#FFB800', text: '#000000', label: 'yellow' }
  }
  if (val >= thresholds.red_min && val <= thresholds.red_max) {
    return { bg: '#D32F2F', text: '#FFFFFF', label: 'red' }
  }

  // Out of all defined ranges: treat as red (out of range)
  return { bg: '#D32F2F', text: '#FFFFFF', label: 'out-of-range' }
}

// ============================================
// Component
// ============================================

export default function IceRinkDiagram({
  rinkName,
  points,
  readings,
  thresholds,
  onPointClick,
  logoUrl,
}: IceRinkDiagramProps) {
  const handlePointClick = useCallback(
    (pointId: string, pointNumber: number) => {
      onPointClick(pointId, pointNumber)
    },
    [onPointClick]
  )

  const sortedPoints = useMemo(
    () => [...points].sort((a, b) => a.point_number - b.point_number),
    [points]
  )

  // Offsets for drawing inside the padded viewBox
  const ox = PADDING
  const oy = PADDING

  return (
    <div className="w-full">
      {/* Rink name header */}
      <div className="mb-2 flex items-center gap-3">
        {logoUrl && (
          <img
            src={logoUrl}
            alt="Facility logo"
            className="h-8 w-8 rounded object-contain"
          />
        )}
        <h3 className="text-lg font-semibold text-navy dark:text-white">
          {rinkName}
        </h3>
      </div>

      {/* SVG Rink */}
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="w-full rounded-lg border border-wolf-grey-light bg-white dark:border-wolf-grey-dark dark:bg-navy-dark"
        role="img"
        aria-label={`Ice rink diagram for ${rinkName} with ${points.length} measurement points`}
      >
        {/* Ice surface background */}
        <rect
          x={ox}
          y={oy}
          width={RINK_WIDTH}
          height={RINK_HEIGHT}
          rx={CORNER_RADIUS}
          ry={CORNER_RADIUS}
          fill="#E8F4FD"
          className="dark:fill-navy/20"
        />

        {/* Rink border (boards) */}
        <rect
          x={ox}
          y={oy}
          width={RINK_WIDTH}
          height={RINK_HEIGHT}
          rx={CORNER_RADIUS}
          ry={CORNER_RADIUS}
          fill="none"
          stroke="#002244"
          strokeWidth="3"
          className="dark:stroke-wolf-grey"
        />

        {/* Center red line */}
        <line
          x1={ox + CENTER_X}
          y1={oy}
          x2={ox + CENTER_X}
          y2={oy + RINK_HEIGHT}
          stroke="#D32F2F"
          strokeWidth="3"
          opacity="0.7"
        />

        {/* Left blue line */}
        <line
          x1={ox + BLUE_LINE_OFFSET}
          y1={oy}
          x2={ox + BLUE_LINE_OFFSET}
          y2={oy + RINK_HEIGHT}
          stroke="#1565C0"
          strokeWidth="3"
          opacity="0.7"
        />

        {/* Right blue line */}
        <line
          x1={ox + RINK_WIDTH - BLUE_LINE_OFFSET}
          y1={oy}
          x2={ox + RINK_WIDTH - BLUE_LINE_OFFSET}
          y2={oy + RINK_HEIGHT}
          stroke="#1565C0"
          strokeWidth="3"
          opacity="0.7"
        />

        {/* Center circle */}
        <circle
          cx={ox + CENTER_X}
          cy={oy + CENTER_Y}
          r={CENTER_CIRCLE_R}
          fill="none"
          stroke="#1565C0"
          strokeWidth="2"
          opacity="0.5"
        />

        {/* Center dot */}
        <circle
          cx={ox + CENTER_X}
          cy={oy + CENTER_Y}
          r={FACEOFF_DOT_R}
          fill="#1565C0"
          opacity="0.6"
        />

        {/* Neutral zone faceoff dots (2) */}
        <circle
          cx={ox + BLUE_LINE_OFFSET + 20}
          cy={oy + CENTER_Y - 90}
          r={FACEOFF_DOT_R}
          fill="#D32F2F"
          opacity="0.6"
        />
        <circle
          cx={ox + BLUE_LINE_OFFSET + 20}
          cy={oy + CENTER_Y + 90}
          r={FACEOFF_DOT_R}
          fill="#D32F2F"
          opacity="0.6"
        />
        <circle
          cx={ox + RINK_WIDTH - BLUE_LINE_OFFSET - 20}
          cy={oy + CENTER_Y - 90}
          r={FACEOFF_DOT_R}
          fill="#D32F2F"
          opacity="0.6"
        />
        <circle
          cx={ox + RINK_WIDTH - BLUE_LINE_OFFSET - 20}
          cy={oy + CENTER_Y + 90}
          r={FACEOFF_DOT_R}
          fill="#D32F2F"
          opacity="0.6"
        />

        {/* End-zone faceoff dots with circles (4) */}
        {/* Left end zone - top */}
        <circle
          cx={ox + RINK_WIDTH * 0.12}
          cy={oy + CENTER_Y - 90}
          r={FACEOFF_CIRCLE_R}
          fill="none"
          stroke="#D32F2F"
          strokeWidth="1.5"
          opacity="0.3"
        />
        <circle
          cx={ox + RINK_WIDTH * 0.12}
          cy={oy + CENTER_Y - 90}
          r={FACEOFF_DOT_R}
          fill="#D32F2F"
          opacity="0.6"
        />
        {/* Left end zone - bottom */}
        <circle
          cx={ox + RINK_WIDTH * 0.12}
          cy={oy + CENTER_Y + 90}
          r={FACEOFF_CIRCLE_R}
          fill="none"
          stroke="#D32F2F"
          strokeWidth="1.5"
          opacity="0.3"
        />
        <circle
          cx={ox + RINK_WIDTH * 0.12}
          cy={oy + CENTER_Y + 90}
          r={FACEOFF_DOT_R}
          fill="#D32F2F"
          opacity="0.6"
        />
        {/* Right end zone - top */}
        <circle
          cx={ox + RINK_WIDTH * 0.88}
          cy={oy + CENTER_Y - 90}
          r={FACEOFF_CIRCLE_R}
          fill="none"
          stroke="#D32F2F"
          strokeWidth="1.5"
          opacity="0.3"
        />
        <circle
          cx={ox + RINK_WIDTH * 0.88}
          cy={oy + CENTER_Y - 90}
          r={FACEOFF_DOT_R}
          fill="#D32F2F"
          opacity="0.6"
        />
        {/* Right end zone - bottom */}
        <circle
          cx={ox + RINK_WIDTH * 0.88}
          cy={oy + CENTER_Y + 90}
          r={FACEOFF_CIRCLE_R}
          fill="none"
          stroke="#D32F2F"
          strokeWidth="1.5"
          opacity="0.3"
        />
        <circle
          cx={ox + RINK_WIDTH * 0.88}
          cy={oy + CENTER_Y + 90}
          r={FACEOFF_DOT_R}
          fill="#D32F2F"
          opacity="0.6"
        />

        {/* Goal creases */}
        {/* Left crease */}
        <rect
          x={ox + 8}
          y={oy + CENTER_Y - CREASE_HEIGHT / 2}
          width={CREASE_WIDTH}
          height={CREASE_HEIGHT}
          rx={4}
          fill="#1565C0"
          opacity="0.15"
          stroke="#1565C0"
          strokeWidth="1.5"
        />
        {/* Right crease */}
        <rect
          x={ox + RINK_WIDTH - 8 - CREASE_WIDTH}
          y={oy + CENTER_Y - CREASE_HEIGHT / 2}
          width={CREASE_WIDTH}
          height={CREASE_HEIGHT}
          rx={4}
          fill="#1565C0"
          opacity="0.15"
          stroke="#1565C0"
          strokeWidth="1.5"
        />

        {/* Goal lines */}
        <line
          x1={ox + 55}
          y1={oy + 30}
          x2={ox + 55}
          y2={oy + RINK_HEIGHT - 30}
          stroke="#D32F2F"
          strokeWidth="2"
          opacity="0.4"
        />
        <line
          x1={ox + RINK_WIDTH - 55}
          y1={oy + 30}
          x2={ox + RINK_WIDTH - 55}
          y2={oy + RINK_HEIGHT - 30}
          stroke="#D32F2F"
          strokeWidth="2"
          opacity="0.4"
        />

        {/* Measurement Points */}
        {sortedPoints.map((point) => {
          const cx = ox + (point.x_percent / 100) * RINK_WIDTH
          const cy = oy + (point.y_percent / 100) * RINK_HEIGHT
          const color = getPointColor(point.id, readings, thresholds)
          const reading = readings[point.id]

          return (
            <g
              key={point.id}
              onClick={() => handlePointClick(point.id, point.point_number)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`Point ${point.point_number}${reading ? `, reading: ${reading.reading_inches} inches` : ', no reading'}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handlePointClick(point.id, point.point_number)
                }
              }}
            >
              {/* Drop shadow for better visibility */}
              <circle
                cx={cx}
                cy={cy}
                r={POINT_RADIUS + 2}
                fill="rgba(0,0,0,0.15)"
              />
              {/* Point circle */}
              <circle
                cx={cx}
                cy={cy}
                r={POINT_RADIUS}
                fill={color.bg}
                stroke="#FFFFFF"
                strokeWidth="2"
                className="transition-transform duration-150 hover:scale-110"
              />
              {/* Point number */}
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fill={color.text}
                fontSize="12"
                fontWeight="bold"
                className="pointer-events-none select-none"
              >
                {point.point_number}
              </text>
              {/* Reading value below point (if exists) */}
              {reading && (
                <text
                  x={cx}
                  y={cy + POINT_RADIUS + 12}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={color.bg}
                  fontSize="10"
                  fontWeight="600"
                  className="pointer-events-none select-none"
                >
                  {reading.reading_inches.toFixed(2)}&quot;
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-wolf-grey-dark dark:text-wolf-grey">
        {thresholds && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-action-green" />
              <span>
                Green ({thresholds.green_min}&quot;&ndash;{thresholds.green_max}&quot;)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-alert-yellow" />
              <span>
                Yellow ({thresholds.yellow_min}&quot;&ndash;{thresholds.yellow_max}&quot;)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-alert-red" />
              <span>
                Red ({thresholds.red_min}&quot;&ndash;{thresholds.red_max}&quot;)
              </span>
            </div>
          </>
        )}
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-wolf-grey" />
          <span>No reading</span>
        </div>
      </div>
    </div>
  )
}

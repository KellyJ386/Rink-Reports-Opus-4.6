'use client'

import { cn } from '@/lib/utils'
import { Clock, Radio } from 'lucide-react'

export interface ShiftBlockProps {
  shiftTypeName: string
  shiftTypeColor: string
  startTime: string
  endTime: string
  employeeName?: string
  isOpen: boolean
  isBroadcast: boolean
  onClick: () => void
}

/**
 * Determines whether white or black text has better contrast against a hex background.
 */
function getContrastColor(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  // Relative luminance (simplified)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

export default function ShiftBlock({
  shiftTypeName,
  shiftTypeColor,
  startTime,
  endTime,
  employeeName,
  isOpen,
  isBroadcast,
  onClick,
}: ShiftBlockProps) {
  const textColor = getContrastColor(shiftTypeColor)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-md p-2.5 text-left transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 min-h-[48px]',
        isOpen && 'border-2 border-dashed border-wolf-grey dark:border-wolf-grey-dark'
      )}
      style={{
        backgroundColor: isOpen ? 'transparent' : shiftTypeColor,
        color: isOpen ? undefined : textColor,
      }}
    >
      {/* Shift type name */}
      <div className={cn(
        'text-xs font-semibold truncate',
        isOpen && 'text-foreground'
      )}>
        {shiftTypeName}
      </div>

      {/* Time range */}
      <div className={cn(
        'flex items-center gap-1 mt-0.5',
        isOpen ? 'text-muted-foreground' : ''
      )}>
        <Clock className="h-3 w-3 shrink-0" style={{ color: isOpen ? undefined : textColor }} />
        <span className="text-xs">
          {startTime} - {endTime}
        </span>
      </div>

      {/* Employee name or OPEN */}
      <div className={cn(
        'mt-1 text-xs font-medium truncate',
        isOpen && 'text-alert-yellow dark:text-alert-yellow'
      )}>
        {isOpen ? 'OPEN' : employeeName ?? 'Unassigned'}
      </div>

      {/* Broadcast indicator */}
      {isBroadcast && (
        <div className={cn(
          'flex items-center gap-1 mt-1 text-xs',
          isOpen ? 'text-action-green' : ''
        )}
        style={{ color: isOpen ? undefined : textColor }}
        >
          <Radio className="h-3 w-3" />
          <span>Broadcast</span>
        </div>
      )}
    </button>
  )
}

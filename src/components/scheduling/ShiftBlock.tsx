'use client';

import { cn } from '@/lib/utils';

export type ShiftType = 'zamboni' | 'front_desk' | 'skate_rental' | 'maintenance';

export interface ShiftBlockData {
  id: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  position: ShiftType;
  positionLabel: string;
  employeeName: string | null; // null = OPEN shift
  date: string; // YYYY-MM-DD
  notes?: string;
}

const SHIFT_COLORS: Record<ShiftType, { bg: string; text: string; border: string }> = {
  zamboni: {
    bg: 'bg-[#69BE28]/15',
    text: 'text-[#3d7118]',
    border: 'border-[#69BE28]',
  },
  front_desk: {
    bg: 'bg-[#002244]/10',
    text: 'text-[#002244]',
    border: 'border-[#002244]',
  },
  skate_rental: {
    bg: 'bg-[#A5ACAF]/20',
    text: 'text-[#4a5154]',
    border: 'border-[#A5ACAF]',
  },
  maintenance: {
    bg: 'bg-[#FFB800]/15',
    text: 'text-[#8a6400]',
    border: 'border-[#FFB800]',
  },
};

interface ShiftBlockProps {
  shift: ShiftBlockData;
  compact?: boolean;
  onClick?: (shift: ShiftBlockData) => void;
}

export function ShiftBlock({ shift, compact = false, onClick }: ShiftBlockProps) {
  const colors = SHIFT_COLORS[shift.position];
  const isOpen = !shift.employeeName;

  return (
    <button
      type="button"
      onClick={() => onClick?.(shift)}
      className={cn(
        'w-full rounded-md border-l-4 px-2.5 py-1.5 text-left transition-all hover:shadow-md',
        colors.bg,
        colors.border,
        isOpen && 'border-dashed border-l-4 border-t border-r border-b',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
      )}
    >
      <div className={cn('text-xs font-semibold', colors.text)}>
        {shift.startTime} - {shift.endTime}
      </div>
      {!compact && (
        <div className={cn('text-xs mt-0.5', colors.text)}>
          {shift.positionLabel}
        </div>
      )}
      <div
        className={cn(
          'text-xs font-medium mt-0.5',
          isOpen ? 'text-amber-600 italic' : colors.text
        )}
      >
        {isOpen ? 'OPEN' : shift.employeeName}
      </div>
    </button>
  );
}

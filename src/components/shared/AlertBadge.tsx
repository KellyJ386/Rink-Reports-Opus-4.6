'use client'

import { cn } from '@/lib/utils'

interface AlertBadgeProps {
  count: number
}

export function AlertBadge({ count }: AlertBadgeProps) {
  if (count <= 0) return null

  return (
    <span
      className={cn(
        'absolute -top-1 -right-1 flex items-center justify-center',
        'min-w-5 h-5 px-1 rounded-full',
        'bg-alert-red text-white text-xs font-bold',
        'animate-in zoom-in-50 duration-200'
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

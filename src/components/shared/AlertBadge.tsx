"use client"

interface AlertBadgeProps {
  count: number
}

export function AlertBadge({ count }: AlertBadgeProps) {
  if (count <= 0) return null

  return (
    <span
      className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center
        rounded-full bg-red-600 px-1 text-[11px] font-bold text-white
        animate-in zoom-in-50 duration-200"
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

/**
 * Determines whether a checklist item should be shown on a given date
 * based on its recurrence frequency.
 *
 * @param recurrence - The recurrence type: 'daily', 'weekly', 'monthly', or 'seasonal'
 * @param date - The date to check against
 * @param openMonths - Optional array of month numbers (1-12) for seasonal items
 * @returns Whether the item should appear on the given date
 */
export function shouldShowItem(
  recurrence: string,
  date: Date,
  openMonths?: number[]
): boolean {
  switch (recurrence) {
    case 'daily':
      return true
    case 'weekly':
      // Show on Mondays (getDay() === 1)
      return date.getDay() === 1
    case 'monthly':
      // Show on the 1st of each month
      return date.getDate() === 1
    case 'seasonal':
      // Show only during specified open months
      return openMonths ? openMonths.includes(date.getMonth() + 1) : true
    default:
      return true
  }
}

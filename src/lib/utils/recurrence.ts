/**
 * Recurrence helper for daily report checklist items.
 *
 * Determines whether a checklist item should be displayed on a given date
 * based on its recurrence pattern.
 */

/**
 * Checks if a checklist item should be shown on the given date.
 *
 * @param recurrence - The recurrence type: 'daily', 'weekly', 'monthly', or 'seasonal'
 * @param date - The date to check against
 * @param openMonths - For 'seasonal' recurrence, an array of 1-based month numbers
 *                     (e.g., [9, 10, 11, 12, 1, 2, 3] for Sep-Mar ice season).
 *                     If not provided, seasonal items default to showing.
 * @returns true if the item should be shown on the given date
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
      // Show on Mondays (getDay() returns 0 for Sunday, 1 for Monday)
      return date.getDay() === 1

    case 'monthly':
      // Show on the 1st of the month
      return date.getDate() === 1

    case 'seasonal':
      // Show if the current month (1-based) is in the openMonths array
      if (!openMonths || openMonths.length === 0) {
        return true
      }
      return openMonths.includes(date.getMonth() + 1)

    default:
      // Unknown recurrence type — show by default to avoid hiding items
      return true
  }
}

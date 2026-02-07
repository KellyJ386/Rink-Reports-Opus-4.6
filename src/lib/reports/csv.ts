/**
 * Generate a CSV string from column headers and row data.
 *
 * Each value is properly escaped (double-quotes around every field,
 * internal double-quotes doubled per RFC 4180).
 *
 * @param columns - Column header labels
 * @param data    - 2D array of string cell values
 * @returns CSV string ready to be downloaded
 */
export function generateCsvReport(
  columns: string[],
  data: string[][]
): string {
  const escape = (v: string) =>
    `"${String(v ?? "").replace(/"/g, '""')}"`

  const header = columns.map(escape).join(",")
  const rows = data.map((row) => row.map(escape).join(","))

  return [header, ...rows].join("\n")
}

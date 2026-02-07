export interface CsvColumn {
  key: string
  label: string
}

export interface CsvReportConfig {
  columns: CsvColumn[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>[]
}

/**
 * Escape a CSV cell value.
 * Wraps the value in double quotes if it contains commas, double quotes,
 * or newlines. Internal double quotes are escaped by doubling them.
 */
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Generate a CSV string from the provided config.
 * Returns a UTF-8 encoded CSV string with header row and data rows.
 */
export function generateCsvReport(config: CsvReportConfig): string {
  const { columns, data } = config

  // Header row from column labels
  const headerRow = columns.map((col) => escapeCsvValue(col.label)).join(',')

  // Data rows
  const dataRows = data.map((row) =>
    columns.map((col) => escapeCsvValue(row[col.key])).join(',')
  )

  return [headerRow, ...dataRows].join('\r\n')
}

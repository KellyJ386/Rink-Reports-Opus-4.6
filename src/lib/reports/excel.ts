import * as XLSX from 'xlsx'

export interface ExcelColumn {
  key: string
  label: string
  width?: number
}

export interface ExcelReportConfig {
  title: string
  sheetName?: string
  columns: ExcelColumn[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>[]
}

/**
 * Generate an Excel workbook as a Uint8Array buffer.
 * Creates a single sheet with the column headers as the first row,
 * followed by data rows. Column widths are set from the config.
 */
export function generateExcelReport(config: ExcelReportConfig): Uint8Array {
  const { title, sheetName, columns, data } = config

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new()
  workbook.Props = {
    Title: title,
    CreatedDate: new Date(),
  }

  // Build the data array: first row is headers, then data rows
  const headerRow = columns.map((col) => col.label)
  const dataRows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key]
      if (value === null || value === undefined) return ''
      return value
    })
  )

  const worksheetData = [headerRow, ...dataRows]

  // Create the worksheet from the array of arrays
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  // Set column widths (wch = width in characters)
  worksheet['!cols'] = columns.map((col) => ({
    wch: col.width ?? Math.max(col.label.length + 2, 12),
  }))

  // Add worksheet to workbook
  const name = sheetName ?? title.substring(0, 31) // Excel sheet name max 31 chars
  XLSX.utils.book_append_sheet(workbook, worksheet, name)

  // Write workbook to buffer
  const buffer = XLSX.write(workbook, {
    type: 'array',
    bookType: 'xlsx',
  }) as ArrayBuffer

  return new Uint8Array(buffer)
}

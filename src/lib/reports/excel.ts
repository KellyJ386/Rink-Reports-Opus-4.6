import * as XLSX from "xlsx"

/**
 * Generate an Excel (.xlsx) workbook from column headers and row data.
 *
 * @param sheetName - Name for the worksheet tab
 * @param columns   - Column header labels
 * @param data      - Array of objects representing rows (keys match column order)
 * @returns Uint8Array containing the .xlsx bytes
 */
export function generateExcelReport(
  sheetName: string,
  columns: string[],
  data: Record<string, unknown>[]
): Uint8Array {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)

  // Override header row with our column labels
  columns.forEach((col, idx) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: idx })
    if (ws[cellRef]) {
      ws[cellRef].v = col
    }
  })

  // Set column widths for readability
  ws["!cols"] = columns.map(() => ({ wch: 18 }))

  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array
}

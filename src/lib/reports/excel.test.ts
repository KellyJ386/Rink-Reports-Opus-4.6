import { describe, it, expect } from 'vitest'
import { generateExcelReport } from './excel'
import * as XLSX from 'xlsx'

describe('generateExcelReport', () => {
  const basicConfig = {
    title: 'Test Report',
    columns: [
      { key: 'name', label: 'Name', width: 20 },
      { key: 'value', label: 'Value', width: 15 },
    ],
    data: [
      { name: 'Item 1', value: 100 },
      { name: 'Item 2', value: 200 },
    ],
  }

  it('returns a Uint8Array', () => {
    const result = generateExcelReport(basicConfig)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })

  it('generates a valid XLSX file that can be parsed', () => {
    const result = generateExcelReport(basicConfig)
    const workbook = XLSX.read(result, { type: 'array' })

    expect(workbook.SheetNames).toHaveLength(1)
    expect(workbook.SheetNames[0]).toBe('Test Report')
  })

  it('contains correct header row', () => {
    const result = generateExcelReport(basicConfig)
    const workbook = XLSX.read(result, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })

    expect(data[0]).toEqual(['Name', 'Value'])
  })

  it('contains correct data rows', () => {
    const result = generateExcelReport(basicConfig)
    const workbook = XLSX.read(result, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })

    expect(data[1]).toEqual(['Item 1', 100])
    expect(data[2]).toEqual(['Item 2', 200])
  })

  it('uses custom sheet name when provided', () => {
    const result = generateExcelReport({
      ...basicConfig,
      sheetName: 'Custom Sheet',
    })
    const workbook = XLSX.read(result, { type: 'array' })
    expect(workbook.SheetNames[0]).toBe('Custom Sheet')
  })

  it('handles null values in data', () => {
    const result = generateExcelReport({
      ...basicConfig,
      data: [{ name: null, value: undefined }],
    })
    const workbook = XLSX.read(result, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })

    // Null/undefined become empty strings
    expect(data[1]).toEqual(['', ''])
  })

  it('handles empty data array', () => {
    const result = generateExcelReport({
      ...basicConfig,
      data: [],
    })
    const workbook = XLSX.read(result, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })

    // Only header row
    expect(data).toHaveLength(1)
    expect(data[0]).toEqual(['Name', 'Value'])
  })
})

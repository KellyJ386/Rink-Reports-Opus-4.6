import { describe, it, expect } from 'vitest'
import { generateCsvReport } from './csv'

describe('generateCsvReport', () => {
  it('generates header row from column labels', () => {
    const result = generateCsvReport({
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'value', label: 'Value' },
      ],
      data: [],
    })

    expect(result).toBe('Name,Value')
  })

  it('generates data rows from data array', () => {
    const result = generateCsvReport({
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
      ],
      data: [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ],
    })

    const lines = result.split('\r\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe('Name,Age')
    expect(lines[1]).toBe('Alice,30')
    expect(lines[2]).toBe('Bob,25')
  })

  it('escapes values containing commas', () => {
    const result = generateCsvReport({
      columns: [{ key: 'desc', label: 'Description' }],
      data: [{ desc: 'Hello, World' }],
    })

    const lines = result.split('\r\n')
    expect(lines[1]).toBe('"Hello, World"')
  })

  it('escapes values containing double quotes', () => {
    const result = generateCsvReport({
      columns: [{ key: 'desc', label: 'Description' }],
      data: [{ desc: 'She said "hello"' }],
    })

    const lines = result.split('\r\n')
    expect(lines[1]).toBe('"She said ""hello"""')
  })

  it('escapes values containing newlines', () => {
    const result = generateCsvReport({
      columns: [{ key: 'desc', label: 'Description' }],
      data: [{ desc: 'Line 1\nLine 2' }],
    })

    const lines = result.split('\r\n')
    // The escaped value includes the inner newline within quotes
    expect(lines[1]).toBe('"Line 1\nLine 2"')
  })

  it('handles null and undefined values', () => {
    const result = generateCsvReport({
      columns: [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'B' },
        { key: 'c', label: 'C' },
      ],
      data: [{ a: null, b: undefined, c: 'ok' }],
    })

    const lines = result.split('\r\n')
    expect(lines[1]).toBe(',,ok')
  })

  it('handles empty data array', () => {
    const result = generateCsvReport({
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'value', label: 'Value' },
      ],
      data: [],
    })

    expect(result).toBe('Name,Value')
  })

  it('handles missing keys in data rows', () => {
    const result = generateCsvReport({
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'missing', label: 'Missing' },
      ],
      data: [{ name: 'Alice' }],
    })

    const lines = result.split('\r\n')
    expect(lines[1]).toBe('Alice,')
  })
})

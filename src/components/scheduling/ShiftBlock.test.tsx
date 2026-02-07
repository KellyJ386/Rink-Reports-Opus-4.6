import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ShiftBlock from './ShiftBlock'

const defaultProps = {
  shiftTypeName: 'Morning Shift',
  shiftTypeColor: '#002244',
  startTime: '08:00',
  endTime: '16:00',
  employeeName: 'John Doe',
  isOpen: false,
  isBroadcast: false,
  onClick: vi.fn(),
}

describe('ShiftBlock', () => {
  it('renders shift type name', () => {
    render(<ShiftBlock {...defaultProps} />)
    expect(screen.getByText('Morning Shift')).toBeInTheDocument()
  })

  it('renders time range', () => {
    render(<ShiftBlock {...defaultProps} />)
    expect(screen.getByText('08:00 - 16:00')).toBeInTheDocument()
  })

  it('renders employee name', () => {
    render(<ShiftBlock {...defaultProps} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('renders "Unassigned" when no employee name', () => {
    render(<ShiftBlock {...defaultProps} employeeName={undefined} />)
    expect(screen.getByText('Unassigned')).toBeInTheDocument()
  })

  it('renders "OPEN" when isOpen is true', () => {
    render(<ShiftBlock {...defaultProps} isOpen={true} />)
    expect(screen.getByText('OPEN')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<ShiftBlock {...defaultProps} onClick={onClick} />)

    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders Broadcast indicator when isBroadcast is true', () => {
    render(<ShiftBlock {...defaultProps} isBroadcast={true} />)
    expect(screen.getByText('Broadcast')).toBeInTheDocument()
  })

  it('does not render Broadcast indicator when isBroadcast is false', () => {
    render(<ShiftBlock {...defaultProps} isBroadcast={false} />)
    expect(screen.queryByText('Broadcast')).not.toBeInTheDocument()
  })

  it('applies background color as inline style when not open', () => {
    render(<ShiftBlock {...defaultProps} />)
    const button = screen.getByRole('button')
    expect(button.style.backgroundColor).toBe('rgb(0, 34, 68)') // #002244
  })

  it('has transparent background when open', () => {
    render(<ShiftBlock {...defaultProps} isOpen={true} />)
    const button = screen.getByRole('button')
    expect(button.style.backgroundColor).toBe('transparent')
  })

  it('uses white text on dark background', () => {
    render(<ShiftBlock {...defaultProps} shiftTypeColor="#002244" />)
    const button = screen.getByRole('button')
    expect(button.style.color).toBe('rgb(255, 255, 255)') // White text on dark navy
  })

  it('uses black text on light background', () => {
    render(<ShiftBlock {...defaultProps} shiftTypeColor="#FFFFFF" />)
    const button = screen.getByRole('button')
    expect(button.style.color).toBe('rgb(0, 0, 0)') // Black text on white
  })

  it('has minimum height of 48px for touch targets', () => {
    render(<ShiftBlock {...defaultProps} />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('min-h-[48px]')
  })
})

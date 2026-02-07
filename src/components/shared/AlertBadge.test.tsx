import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AlertBadge } from './AlertBadge'

describe('AlertBadge', () => {
  it('renders nothing when count is 0', () => {
    const { container } = render(<AlertBadge count={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when count is negative', () => {
    const { container } = render(<AlertBadge count={-1} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the count when between 1 and 99', () => {
    render(<AlertBadge count={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders count of 1', () => {
    render(<AlertBadge count={1} />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders count of 99', () => {
    render(<AlertBadge count={99} />)
    expect(screen.getByText('99')).toBeInTheDocument()
  })

  it('renders "99+" when count exceeds 99', () => {
    render(<AlertBadge count={100} />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('renders "99+" for very large counts', () => {
    render(<AlertBadge count={9999} />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('renders a span element', () => {
    const { container } = render(<AlertBadge count={3} />)
    expect(container.firstChild?.nodeName).toBe('SPAN')
  })
})

import { describe, expect, it } from 'vitest'
import { renderWithTheme, screen } from '@/test/renderWithTheme'
import StatCard from '../StatCard'

describe('StatCard', () => {
  it('renders its label and value', () => {
    renderWithTheme(<StatCard label="keep" value="17" />)

    expect(screen.getByText('keep')).toBeInTheDocument()
    expect(screen.getByText('17')).toBeInTheDocument()
  })

  it('renders the caption when given one', () => {
    renderWithTheme(<StatCard label="keep" value="17" caption="37% of batch" />)

    expect(screen.getByText('37% of batch')).toBeInTheDocument()
  })

  it('omits the caption when not given one', () => {
    renderWithTheme(<StatCard label="keep" value="17" />)

    expect(screen.queryByText(/of batch/)).not.toBeInTheDocument()
  })

  it('shows the accent as a left border when given one', () => {
    const { container } = renderWithTheme(<StatCard label="keep" value="17" accent="#4ade80" />)

    expect(container.firstElementChild).toHaveStyle({ borderLeft: '3px solid #4ade80' })
  })

  it('renders a zero count rather than hiding it', () => {
    renderWithTheme(<StatCard label="discard" value="0" />)

    expect(screen.getByText('0')).toBeInTheDocument()
  })
})

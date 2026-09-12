import { describe, expect, it } from 'vitest'
import { renderWithTheme, screen } from '@/test/renderWithTheme'
import FillCard from '../FillCard'

describe('FillCard', () => {
  it('renders its children', () => {
    renderWithTheme(<FillCard>panel body</FillCard>)

    expect(screen.getByText('panel body')).toBeInTheDocument()
  })

  it('does not stretch by default', () => {
    const { container } = renderWithTheme(<FillCard>body</FillCard>)

    expect(container.firstElementChild).not.toHaveStyle({ height: '100%' })
  })

  it('stretches and clips its own overflow when filling', () => {
    const { container } = renderWithTheme(<FillCard isFilled>body</FillCard>)

    expect(container.firstElementChild).toHaveStyle({ height: '100%', overflow: 'hidden' })
  })

  it('merges layout overrides from sx', () => {
    const { container } = renderWithTheme(<FillCard sx={{ minWidth: 320 }}>body</FillCard>)

    expect(container.firstElementChild).toHaveStyle({ minWidth: '320px' })
  })
})

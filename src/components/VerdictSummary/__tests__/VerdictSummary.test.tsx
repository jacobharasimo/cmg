import { describe, expect, it, vi } from 'vitest'
import { Verdict } from '@/lib'
import { renderWithTheme, screen } from '@/test/renderWithTheme'
import VerdictSummary from '../VerdictSummary'

// Isolation: StatCard has its own test; here we assert what VerdictSummary passes it.
vi.mock('@/components/StatCard', () => ({
  default: ({ label, value, caption }: { label: string; value: string; caption?: string }) => (
    <div data-testid="stat-card">{`${label}|${value}|${caption ?? ''}`}</div>
  ),
}))

describe('VerdictSummary', () => {
  it('renders one card per verdict present in the batch', () => {
    renderWithTheme(
      <VerdictSummary counts={{ [Verdict.Keep]: 17, [Verdict.Discard]: 7 }} total={24} />,
    )

    expect(screen.getAllByTestId('stat-card')).toHaveLength(2)
  })

  it('omits a verdict no device received', () => {
    renderWithTheme(<VerdictSummary counts={{ [Verdict.Keep]: 3 }} total={3} />)

    expect(screen.getByTestId('stat-card')).toHaveTextContent('keep|3|')
  })

  it('orders the thermometer grades before keep, discard and unclassified', () => {
    renderWithTheme(
      <VerdictSummary
        counts={{
          [Verdict.Unclassified]: 6,
          [Verdict.Keep]: 17,
          [Verdict.UltraPrecise]: 11,
          [Verdict.Precise]: 1,
        }}
        total={35}
      />,
    )

    const labels = screen.getAllByTestId('stat-card').map((node) => node.textContent?.split('|')[0])
    expect(labels).toEqual(['ultra precise', 'precise', 'keep', 'unclassified'])
  })

  it('captions each card with its share of the batch', () => {
    renderWithTheme(<VerdictSummary counts={{ [Verdict.Keep]: 17 }} total={46} />)

    expect(screen.getByTestId('stat-card')).toHaveTextContent('keep|17|37% of batch')
  })

  it('omits the percentage when the batch is empty', () => {
    renderWithTheme(<VerdictSummary counts={{}} total={0} />)

    expect(screen.queryAllByTestId('stat-card')).toHaveLength(0)
  })

  it('labels itself as the classification summary region', () => {
    renderWithTheme(<VerdictSummary counts={{ [Verdict.Keep]: 1 }} total={1} />)

    expect(screen.getByRole('region', { name: 'Classification summary' })).toBeInTheDocument()
  })
})

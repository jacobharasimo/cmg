import Highcharts from 'highcharts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithTheme } from '@/test/renderWithTheme'
import Chart from '../Chart'

// Isolation: the chart library itself is not under test — what we hand it is.
const destroy = vi.fn()
vi.mock('highcharts', () => ({
  default: {
    chart: vi.fn(() => ({ destroy: vi.fn() })),
    merge: vi.fn((...sources: object[]) => Object.assign({}, ...sources) as object),
  },
}))
vi.mock('highcharts/modules/accessibility', () => ({}))
vi.mock('../chartTheme', () => ({ chartTheme: () => ({ credits: { enabled: false } }) }))

const mockedChart = vi.mocked(Highcharts.chart)
const mockedMerge = vi.mocked(Highcharts.merge)

describe('Chart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedChart.mockReturnValue({ destroy } as unknown as Highcharts.Chart)
  })

  it('creates a chart in its own container', () => {
    renderWithTheme(<Chart options={{ chart: { type: 'bar' } }} height={200} />)

    expect(mockedChart).toHaveBeenCalledOnce()
    expect(mockedChart.mock.calls[0]?.[0]).toBeInstanceOf(HTMLElement)
  })

  it('merges the theme underneath the options it is given', () => {
    renderWithTheme(<Chart options={{ chart: { type: 'bar' } }} height={200} />)

    expect(mockedMerge).toHaveBeenCalledOnce()
    const [defaults, options] = mockedMerge.mock.calls[0] ?? []
    expect(defaults).toEqual({ credits: { enabled: false } })
    expect(options).toEqual({ chart: { type: 'bar' } })
  })

  it('applies the requested height to the container', () => {
    const { container } = renderWithTheme(<Chart options={{}} height={268} />)

    expect(container.firstElementChild).toHaveStyle({ height: '268px' })
  })

  it('destroys the chart on unmount, so nothing is left holding the DOM', () => {
    const { unmount } = renderWithTheme(<Chart options={{}} height={200} />)

    expect(destroy).not.toHaveBeenCalled()
    unmount()
    expect(destroy).toHaveBeenCalledOnce()
  })

  it('rebuilds when the options change', () => {
    const { rerender } = renderWithTheme(<Chart options={{ chart: { type: 'bar' } }} height={200} />)
    rerender(<Chart options={{ chart: { type: 'line' } }} height={200} />)

    expect(destroy).toHaveBeenCalledOnce()
    expect(mockedChart).toHaveBeenCalledTimes(2)
  })

  it('does not rebuild when nothing relevant changed', () => {
    const options = { chart: { type: 'bar' as const } }
    const { rerender } = renderWithTheme(<Chart options={options} height={200} />)
    rerender(<Chart options={options} height={200} />)

    expect(mockedChart).toHaveBeenCalledOnce()
  })
})

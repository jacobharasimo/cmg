import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FilterScope, SortDirection, SortKey } from '@/hooks'
import { SensorType, Verdict } from '@/lib'
import type { DeviceReport } from '@/lib'
import { renderWithTheme, screen, userEvent } from '@/test/renderWithTheme'
import DeviceTable from '../DeviceTable'

// Isolation: each child has its own test file.
vi.mock('../DeviceRow', () => ({
  default: ({ device, isSelected }: { device: DeviceReport; isSelected: boolean }) => (
    <tr data-selected={isSelected}>
      <td>{device.name}</td>
    </tr>
  ),
}))
vi.mock('@/components/DeviceFilters', () => ({ default: () => <div>filters</div> }))
vi.mock('@/components/ExportCsvButton', () => ({
  default: ({ label }: { label: string }) => <button type="button">{label}</button>,
}))

const devices = [
  { name: 'hum-1', type: SensorType.Humidity, verdict: Verdict.Keep, outOfTolerance: 0, stats: { mean: 45, sd: 0.2, count: 64, meanDeviation: 0.02 } },
  { name: 'temp-1', type: SensorType.Thermometer, verdict: Verdict.Precise, outOfTolerance: 3, stats: { mean: 71, sd: 4, count: 30, meanDeviation: 1 } },
] as unknown as DeviceReport[]

const handlers = { onSelect: vi.fn(), onSort: vi.fn(), onFilter: vi.fn() }

function setup(overrides: Partial<Parameters<typeof DeviceTable>[0]> = {}) {
  return renderWithTheme(
    <DeviceTable
      devices={devices}
      selectedName="hum-1"
      sortKey={SortKey.Name}
      sortDirection={SortDirection.Asc}
      filter={FilterScope.All}
      filterOptions={[]}
      {...handlers}
      {...overrides}
    />,
  )
}

describe('DeviceTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a labelled table', () => {
    setup()

    expect(screen.getByRole('table', { name: 'Device evaluation results' })).toBeInTheDocument()
  })

  it('renders every column header', () => {
    setup()

    expect(screen.getAllByRole('columnheader')).toHaveLength(8)
    expect(screen.getByRole('columnheader', { name: /Device/ })).toBeInTheDocument()
  })

  it('renders one row per device', () => {
    setup()

    expect(screen.getByText('hum-1')).toBeInTheDocument()
    expect(screen.getByText('temp-1')).toBeInTheDocument()
  })

  it('tells the row which device is selected', () => {
    setup()

    expect(screen.getByText('hum-1').closest('tr')).toHaveAttribute('data-selected', 'true')
    expect(screen.getByText('temp-1').closest('tr')).toHaveAttribute('data-selected', 'false')
  })

  it('exposes the current sort on the active column', () => {
    setup({ sortKey: SortKey.Sd, sortDirection: SortDirection.Desc })

    expect(screen.getByRole('columnheader', { name: /Standard deviation/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
  })

  it('reports a sort request for the column clicked', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('button', { name: /Standard deviation/ }))

    expect(handlers.onSort).toHaveBeenCalledExactlyOnceWith(SortKey.Sd)
  })

  it('makes the scrollable area focusable, so keyboard users can reach overflow', () => {
    setup()

    expect(screen.getByRole('region', { name: 'Device evaluation table, scrollable' })).toHaveAttribute(
      'tabindex',
      '0',
    )
  })

  it('gives its CSV export a distinct accessible name', () => {
    setup()

    expect(screen.getByRole('button', { name: 'Export device table as CSV' })).toBeInTheDocument()
  })

  it('renders an empty body without error when nothing matches the filter', () => {
    setup({ devices: [] })

    expect(screen.getByRole('table', { name: 'Device evaluation results' })).toBeInTheDocument()
    expect(screen.queryByText('hum-1')).not.toBeInTheDocument()
  })
})

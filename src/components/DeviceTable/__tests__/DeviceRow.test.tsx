import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SensorType, Verdict } from '@/lib'
import type { DeviceReport } from '@/lib'
import { renderWithTheme, screen, userEvent, within } from '@/test/renderWithTheme'
import DeviceRow from '../DeviceRow'

// Isolation: VerdictChip has its own test.
vi.mock('../VerdictChip', () => ({
  default: ({ verdict }: { verdict: Verdict }) => <span>{verdict}</span>,
}))

const device = (overrides: Partial<DeviceReport> = {}): DeviceReport =>
  ({
    name: 'hum-3',
    type: SensorType.Humidity,
    strategy: { label: 'Humidity' },
    verdict: Verdict.Discard,
    outOfTolerance: 17,
    stats: { mean: 44.85, sd: 0.82, count: 73, meanDeviation: 0.15 },
    ...overrides,
  }) as unknown as DeviceReport

const onSelect = vi.fn()

function renderRow(report: DeviceReport = device(), isSelected = false, rowIndex = 2) {
  return renderWithTheme(
    <table>
      <tbody>
        <DeviceRow
          device={report}
          isSelected={isSelected}
          onSelect={onSelect}
          rowIndex={rowIndex}
        />
      </tbody>
    </table>,
  )
}

describe('DeviceRow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the device name as the row header', () => {
    renderRow()

    expect(screen.getByRole('rowheader', { name: 'hum-3' })).toBeInTheDocument()
  })

  it('exposes selection as a real button, not a focusable row', () => {
    renderRow()

    const button = screen.getByRole('button', { name: 'hum-3' })
    expect(button.tagName).toBe('BUTTON')
    expect(screen.getByRole('row')).not.toHaveAttribute('tabindex')
  })

  it('renders the statistics to two decimal places', () => {
    renderRow()
    const cells = screen.getAllByRole('cell')

    expect(within(cells[2]!).getByText('44.85')).toBeInTheDocument()
    expect(within(cells[3]!).getByText('0.15')).toBeInTheDocument()
    expect(within(cells[4]!).getByText('0.82')).toBeInTheDocument()
  })

  it('renders the out-of-tolerance count over the total', () => {
    renderRow()

    expect(screen.getByText('17/73')).toBeInTheDocument()
  })

  it('renders an em dash where a device has no reference to measure against', () => {
    renderRow(device({ outOfTolerance: null, stats: { mean: 50, sd: 3, count: 20, meanDeviation: null } as DeviceReport['stats'] }))

    expect(screen.getAllByText('—')).toHaveLength(2)
  })

  it('selects when the name button is clicked', async () => {
    const user = userEvent.setup()
    renderRow()

    await user.click(screen.getByRole('button', { name: 'hum-3' }))

    expect(onSelect).toHaveBeenCalled()
  })

  it('is reachable by Tab without any authored tabIndex', async () => {
    const user = userEvent.setup()
    renderRow()

    await user.tab()

    expect(screen.getByRole('button', { name: 'hum-3' })).toHaveFocus()
  })

  it('activates on Enter, because a button does that natively', async () => {
    const user = userEvent.setup()
    renderRow()

    screen.getByRole('button', { name: 'hum-3' }).focus()
    await user.keyboard('{Enter}')

    expect(onSelect).toHaveBeenCalledWith('hum-3')
  })

  it('activates on Space, because a button does that natively', async () => {
    const user = userEvent.setup()
    renderRow()

    screen.getByRole('button', { name: 'hum-3' }).focus()
    await user.keyboard(' ')

    expect(onSelect).toHaveBeenCalledWith('hum-3')
  })

  it('marks the selected device as current', () => {
    renderRow(device(), true)

    expect(screen.getByRole('button', { name: 'hum-3' })).toHaveAttribute('aria-current', 'true')
  })

  it('leaves aria-current off an unselected device', () => {
    renderRow()

    expect(screen.getByRole('button', { name: 'hum-3' })).not.toHaveAttribute('aria-current')
  })

  /*
    The table is windowed, so the DOM holds only the rows on screen. Each row
    has to declare where it sits in the whole batch or a screen reader counts
    only what is rendered.
  */
  it('declares its position in the whole batch, not the rendered window', () => {
    renderRow(device(), false, 37)

    expect(screen.getByRole('row')).toHaveAttribute('aria-rowindex', '37')
  })
})

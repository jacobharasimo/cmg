import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SensorType, Verdict } from '@/lib'
import type { DeviceReport } from '@/lib'
import { renderWithTheme, screen, userEvent } from '@/test/renderWithTheme'
import DeviceDetailPanel from '../DeviceDetailPanel'

// Isolation: charts, their option builders and the CSV button test themselves.
vi.mock('@/components/Chart', () => ({ default: () => <div>chart</div> }))
vi.mock('../readingsOptions', () => ({ readingsOptions: () => ({}) }))
vi.mock('../distributionOptions', () => ({ distributionOptions: () => ({}), bins: () => [] }))
vi.mock('@/components/ExportCsvButton', () => ({
  default: ({ label }: { label: string }) => <button type="button">{label}</button>,
}))
vi.mock('@/components/DeviceTable', () => ({
  VerdictChip: ({ verdict }: { verdict: Verdict }) => <span>{verdict}</span>,
}))

const device = (isRegistered = true): DeviceReport =>
  ({
    name: 'hum-1',
    type: isRegistered ? SensorType.Humidity : 'lux',
    verdict: isRegistered ? Verdict.Keep : Verdict.Unclassified,
    isRegistered,
    reference: 45,
    tolerance: 1,
    outOfTolerance: isRegistered ? 0 : null,
    readings: [{ at: '2007-04-05T22:00', value: 45 }],
    stats: { mean: 45.02, sd: 0.19, min: 44.6, max: 45.5, count: 64, worstDeviation: 0.5 },
    strategy: {
      label: isRegistered ? 'Humidity' : 'Unrecognised',
      unit: '%',
      decimals: 1,
      isPerReading: isRegistered,
      judgedOn: isRegistered ? 'every individual reading' : 'nothing — no rule is registered',
    },
    checks: [
      { text: 'all readings within 1.0% → worst 0.50%', didPass: true },
      { text: '0 of 64 readings out of tolerance', didPass: true },
    ],
  }) as unknown as DeviceReport

const handlers = { onSelect: vi.fn(), onClockChange: vi.fn() }

const setup = (selected: DeviceReport | null = device()) =>
  renderWithTheme(
    <DeviceDetailPanel
      device={selected}
      devices={[device()]}
      is12HourClock={false}
      {...handlers}
    />,
  )

describe('DeviceDetailPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('says so when nothing is selected, rather than rendering empty charts', () => {
    setup(null)

    expect(screen.getByText('No device selected.')).toBeInTheDocument()
    expect(screen.queryByText('chart')).not.toBeInTheDocument()
  })

  it('renders both charts for a selected device', () => {
    setup()

    expect(screen.getAllByText('chart')).toHaveLength(2)
  })

  it('announces the verdict politely, since it changes with selection', () => {
    const { container } = setup()

    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(Verdict.Keep)
  })

  it('explains what the device is judged on', () => {
    setup()

    expect(screen.getByText('Humidity — judged on every individual reading.')).toBeInTheDocument()
  })

  it('explains that an unregistered type is reported rather than judged', () => {
    setup(device(false))

    expect(screen.getByText(/deliberately left unclassified/)).toBeInTheDocument()
  })

  it('titles the trace differently when there is no rule to trace', () => {
    setup(device(false))

    expect(screen.getByRole('heading', { name: 'Unsupported sensor type' })).toBeInTheDocument()
  })

  it('lists every check behind the verdict', () => {
    setup()

    expect(screen.getByText('all readings within 1.0% → worst 0.50%')).toBeInTheDocument()
    expect(screen.getByText('0 of 64 readings out of tolerance')).toBeInTheDocument()
  })

  it('hides the tick and cross from assistive tech, since the text carries the state', () => {
    const { container } = setup()

    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0)
  })

  it('summarises the statistics behind the verdict', () => {
    setup()

    expect(screen.getByText('45.02%')).toBeInTheDocument()
    expect(screen.getByText('0.19')).toBeInTheDocument()
    expect(screen.getByText('0 / 64')).toBeInTheDocument()
  })

  it('says why there is no out-of-tolerance count for a type judged as a series', () => {
    setup(device(false))

    expect(screen.getByText(/n\/a — nothing/)).toBeInTheDocument()
  })

  it('exposes the clock control as a switch, not a checkbox', () => {
    setup()

    expect(screen.getByRole('switch', { name: '12-hour clock' })).toBeInTheDocument()
  })

  it('toggles the clock', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('switch', { name: '12-hour clock' }))

    expect(handlers.onClockChange).toHaveBeenCalledExactlyOnceWith(true)
  })

  it('names each CSV export for the device it exports', () => {
    setup()

    expect(screen.getByRole('button', { name: 'Export hum-1 readings as CSV' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Export hum-1 distribution as CSV' }),
    ).toBeInTheDocument()
  })
})

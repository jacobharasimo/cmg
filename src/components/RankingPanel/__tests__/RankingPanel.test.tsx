import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_THRESHOLDS, SensorType, Verdict } from '@/lib'
import type { DeviceReport } from '@/lib'
import { renderWithTheme, screen, userEvent } from '@/test/renderWithTheme'
import RankingPanel from '../RankingPanel'

// Isolation: each chart variant and the CSV button have their own tests.
vi.mock('../rankingRegistry', () => ({
  RANKING_CHARTS: {
    thermometer: () => <div>sigma chart</div>,
    humidity: () => <div>tolerance chart</div>,
    monoxide: () => <div>tolerance chart</div>,
    noise: () => <div>tolerance chart</div>,
  },
}))
vi.mock('../rankingCharts', () => ({ UnclassifiedRanking: () => <div>unclassified chart</div> }))
vi.mock('@/components/ExportCsvButton', () => ({
  default: ({ label }: { label: string }) => <button type="button">{label}</button>,
}))

const device = (name: string, type: string, label = 'Humidity'): DeviceReport =>
  ({
    name,
    type,
    verdict: Verdict.Keep,
    isRegistered: type !== 'lux',
    strategy: { label, type: type === 'lux' ? null : type },
    stats: { mean: 45, sd: 0.2, count: 10, meanDeviation: 0.1, worstDeviation: 0.3 },
    outOfTolerance: 0,
  }) as unknown as DeviceReport

const devices = [device('hum-1', SensorType.Humidity), device('lux-1', 'lux', 'Unrecognised')]
const options = [
  { value: SensorType.Humidity, label: 'Humidity (1)' },
  { value: 'lux', label: 'lux (unrecognised) (1)' },
]
const handlers = { onSensorTypeChange: vi.fn(), onSelect: vi.fn() }

const setup = (sensorType: string = SensorType.Humidity) =>
  renderWithTheme(
    <RankingPanel
      devices={devices}
      thresholds={DEFAULT_THRESHOLDS}
      sensorType={sensorType}
      sensorTypeOptions={options}
      selectedName="hum-1"
      {...handlers}
    />,
  )

describe('RankingPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('picks the chart for the selected sensor type from the registry', () => {
    setup(SensorType.Humidity)

    expect(screen.getByText('tolerance chart')).toBeInTheDocument()
  })

  it('falls back to the unclassified chart for a type with no rule', () => {
    setup('lux')

    expect(screen.getByText('unclassified chart')).toBeInTheDocument()
  })

  it('titles the panel for the type being ranked', () => {
    setup(SensorType.Humidity)

    expect(screen.getByRole('heading', { name: 'Humidity devices, ranked' })).toBeInTheDocument()
  })

  it('offers every sensor type present in the log', () => {
    setup()

    expect(screen.getByRole('combobox', { name: 'Sensor type' })).toBeInTheDocument()
  })

  it('reports a change of sensor type', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('combobox', { name: 'Sensor type' }))
    await user.click(screen.getByRole('option', { name: 'lux (unrecognised) (1)' }))

    expect(handlers.onSensorTypeChange).toHaveBeenCalledExactlyOnceWith('lux')
  })

  it('names its CSV export for the type being shown', () => {
    setup()

    expect(screen.getByRole('button', { name: 'Export Humidity ranking as CSV' })).toBeInTheDocument()
  })

  it('says so when the log has no devices of the chosen type', () => {
    setup('monoxide')

    expect(screen.getByText(/no devices of the selected sensor type/)).toBeInTheDocument()
    expect(screen.queryByText('tolerance chart')).not.toBeInTheDocument()
  })

  it('renders a legend describing what each colour means', () => {
    setup()

    expect(screen.getByText(/keep — every reading within tolerance/)).toBeInTheDocument()
    expect(screen.getByText(/discard — at least one reading outside/)).toBeInTheDocument()
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FilterScope, SortDirection, SortKey } from '@/hooks'
import type * as HooksModule from '@/hooks'
import { DEFAULT_THRESHOLDS, ReferenceKey, SensorType, Verdict } from '@/lib'
import type { DeviceReport } from '@/lib'
import { renderWithTheme, screen, userEvent } from '@/test/renderWithTheme'
import Dashboard from '../Dashboard'

/**
 * The page's job is to own the hooks and hand plain data down, so every hook
 * and every child is replaced and the assertions are about what it passes.
 */
const device = (name: string, type: string): DeviceReport =>
  ({
    name,
    type,
    verdict: Verdict.Keep,
    isRegistered: type !== 'lux',
    strategy: { label: type === 'lux' ? 'Unrecognised' : 'Humidity', type: type === 'lux' ? null : type },
    stats: { mean: 45, sd: 0.2, count: 10, meanDeviation: 0.1, worstDeviation: 0.3 },
    outOfTolerance: 0,
  }) as unknown as DeviceReport

const devices = [device('hum-1', SensorType.Humidity), device('lux-1', 'lux')]

const set = vi.fn()
const select = vi.fn()
const setMessage = vi.fn()
const clearMessage = vi.fn()
const loadFile = vi.fn<(file: File) => Promise<void>>()
const loadExample = vi.fn()

vi.mock('@/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof HooksModule>()),
  useSensorLog: () => ({
    text: 'log',
    source: { label: 'spec example log', lines: 10, bytes: 100, parseMs: 1 },
    loadExample,
    loadText: vi.fn(),
    loadFile,
  }),
  useSnackbar: () => ({ setMessage, clearMessage }),
  useThresholds: () => ({ thresholds: DEFAULT_THRESHOLDS, isModified: false, set, reset: vi.fn() }),
  useDeviceReport: () => ({
    reference: {
      [ReferenceKey.Temperature]: 70,
      [ReferenceKey.Humidity]: 45,
      [ReferenceKey.Monoxide]: 6,
      [ReferenceKey.Noise]: 35,
    },
    devices,
    counts: { [Verdict.Keep]: 2 },
    lines: 10,
  }),
  useDeviceSelection: () => ({
    devices,
    selected: devices[0],
    sortKey: SortKey.Name,
    sortDirection: SortDirection.Asc,
    filter: FilterScope.All,
    select,
    sortBy: vi.fn(),
    filterBy: vi.fn(),
  }),
}))

vi.mock('@/components/LogSourceBar', () => ({
  default: ({
    deviceCount,
    onLoadFile,
    onLoadExample,
  }: {
    deviceCount: number
    onLoadFile: (f: File) => void
    onLoadExample: () => void
  }) => (
    <div>
      log source: {deviceCount}
      <button type="button" onClick={() => { onLoadFile(new File(['x'], 'batch.log')) }}>
        pick
      </button>
      <button type="button" onClick={onLoadExample}>
        example
      </button>
    </div>
  ),
}))
vi.mock('@/components/VerdictSummary', () => ({
  default: ({ total }: { total: number }) => <div>summary: {total}</div>,
}))
vi.mock('@/components/DeviceTable', () => ({
  default: ({ selectedName }: { selectedName: string }) => <div>table: {selectedName}</div>,
}))
vi.mock('@/components/JsonOutput', () => ({
  default: ({ verdicts }: { verdicts: Record<string, string> }) => (
    <div>json: {JSON.stringify(verdicts)}</div>
  ),
}))
vi.mock('@/components/RankingPanel', () => ({
  default: ({ sensorType, sensorTypeOptions }: { sensorType: string; sensorTypeOptions: { label: string }[] }) => (
    <div>ranking: {sensorType} / {sensorTypeOptions.map((o) => o.label).join(', ')}</div>
  ),
}))
vi.mock('@/components/ThresholdPanel', () => ({ default: () => <div>thresholds</div> }))
vi.mock('@/components/DeviceDetailPanel', () => ({
  default: ({ device: selected }: { device: DeviceReport }) => <div>detail: {selected.name}</div>,
}))

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    loadFile.mockResolvedValue(undefined)
  })

  it('renders all five sections of the console', () => {
    renderWithTheme(<Dashboard />)

    // Anchored, because the header copy contains words like "auditable".
    expect(screen.getByText(/^log source:/)).toBeInTheDocument()
    expect(screen.getByText(/^summary:/)).toBeInTheDocument()
    expect(screen.getByText(/^table:/)).toBeInTheDocument()
    expect(screen.getByText(/^ranking:/)).toBeInTheDocument()
    expect(screen.getByText('thresholds')).toBeInTheDocument()
    expect(screen.getByText(/^detail:/)).toBeInTheDocument()
  })

  it('renders the header with the reference values the batch was judged against', () => {
    renderWithTheme(<Dashboard />)

    expect(screen.getByRole('heading', { level: 1, name: 'Sensor QC Console' })).toBeInTheDocument()
    expect(screen.getByText('70.0°')).toBeInTheDocument()
    expect(screen.getByText('6 ppm')).toBeInTheDocument()
  })

  it('is a banner landmark, since it heads the page', () => {
    renderWithTheme(<Dashboard />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('passes the batch size down rather than each child recomputing it', () => {
    renderWithTheme(<Dashboard />)

    expect(screen.getByText('log source: 2')).toBeInTheDocument()
    expect(screen.getByText('summary: 2')).toBeInTheDocument()
  })

  it('builds the spec-shaped verdict map for the JSON panel', () => {
    renderWithTheme(<Dashboard />)

    expect(screen.getByText(/json: {"hum-1":"keep","lux-1":"keep"}/)).toBeInTheDocument()
  })

  it('offers one ranking option per sensor type in the log, with counts', () => {
    renderWithTheme(<Dashboard />)

    expect(screen.getByText(/Humidity \(1\), lux \(unrecognised\) \(1\)/)).toBeInTheDocument()
  })

  it('ranks the selected device’s type by default', () => {
    renderWithTheme(<Dashboard />)

    expect(screen.getByText(/^ranking: humidity/)).toBeInTheDocument()
  })

  it('hands the selected device to the detail panel', () => {
    renderWithTheme(<Dashboard />)

    expect(screen.getByText('detail: hum-1')).toBeInTheDocument()
  })

  /*
    Uploads report failure by throwing, so turning a rejection into something
    on screen is the page's job — which is what keeps the snackbar generic.
  */
  describe('a failed upload', () => {
    it('raises the thrown message on the snackbar', async () => {
      loadFile.mockRejectedValue(new Error('Log file parsing failed — “x.txt” is not a sensor log.'))
      const user = userEvent.setup()
      renderWithTheme(<Dashboard />)

      await user.click(screen.getByRole('button', { name: 'pick' }))

      expect(setMessage).toHaveBeenCalledWith({
        message: 'Log file parsing failed — “x.txt” is not a sensor log.',
      })
    })

    it('falls back to a message when the rejection is not an Error', async () => {
      loadFile.mockRejectedValue('something odd')
      const user = userEvent.setup()
      renderWithTheme(<Dashboard />)

      await user.click(screen.getByRole('button', { name: 'pick' }))

      expect(setMessage).toHaveBeenCalledWith({ message: 'Log file upload failed.' })
    })

    it('says nothing when the upload succeeds', async () => {
      const user = userEvent.setup()
      renderWithTheme(<Dashboard />)

      await user.click(screen.getByRole('button', { name: 'pick' }))

      expect(setMessage).not.toHaveBeenCalled()
    })
  })

  /*
    A bar left over from a rejected file describes a log that is no longer on
    screen, so any load that works has to take it down.
  */
  describe('a load that works', () => {
    it('clears the bar after an upload', async () => {
      const user = userEvent.setup()
      renderWithTheme(<Dashboard />)

      await user.click(screen.getByRole('button', { name: 'pick' }))

      expect(clearMessage).toHaveBeenCalledOnce()
    })

    it('clears the bar when returning to the example log', async () => {
      const user = userEvent.setup()
      renderWithTheme(<Dashboard />)

      await user.click(screen.getByRole('button', { name: 'example' }))

      expect(loadExample).toHaveBeenCalledOnce()
      expect(clearMessage).toHaveBeenCalledOnce()
    })

    it('leaves the bar alone when the upload fails', async () => {
      loadFile.mockRejectedValue(new Error('nope'))
      const user = userEvent.setup()
      renderWithTheme(<Dashboard />)

      await user.click(screen.getByRole('button', { name: 'pick' }))

      expect(clearMessage).not.toHaveBeenCalled()
    })
  })
})

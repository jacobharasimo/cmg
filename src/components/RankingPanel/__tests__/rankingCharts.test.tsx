import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_THRESHOLDS, SensorType, Verdict } from '@/lib'
import type { DeviceReport } from '@/lib'
import { renderWithTheme } from '@/test/renderWithTheme'
import { barRanking } from '../rankingOptions'
import { SigmaBandsRanking, ToleranceRanking, UnclassifiedRanking } from '../rankingCharts'

// Isolation: the shared bar builder and the Chart wrapper test themselves.
// Capturing the spec is how we assert what each variant configures.
vi.mock('../rankingOptions', () => ({
  barRanking: vi.fn(() => ({})),
  rankingHeight: () => 400,
}))
vi.mock('@/components/Chart', () => ({ default: () => <div>chart</div> }))

const mockedBarRanking = vi.mocked(barRanking)
const specOf = () => mockedBarRanking.mock.calls[0]?.[0]

const device = (name: string, verdict: Verdict, overrides = {}): DeviceReport =>
  ({
    name,
    type: SensorType.Humidity,
    verdict,
    stats: { sd: 2, meanDeviation: 0.3, worstDeviation: 1.4, count: 40 },
    outOfTolerance: 3,
    strategy: { label: 'Humidity', unit: '%', tolerance: () => 1 },
    ...overrides,
  }) as unknown as DeviceReport

const props = {
  devices: [device('hum-1', Verdict.Discard)],
  thresholds: DEFAULT_THRESHOLDS,
  selectedName: null,
  onSelect: vi.fn(),
}

describe('SigmaBandsRanking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('measures bars by σ, because that is what the rule grades', () => {
    renderWithTheme(<SigmaBandsRanking {...props} />)

    expect(specOf()?.valueOf(props.devices[0]!)).toBe(2)
  })

  it('labels each bar with mean deviation and verdict', () => {
    renderWithTheme(<SigmaBandsRanking {...props} />)

    expect(specOf()?.labelOf(props.devices[0]!)).toContain('Δ0.30°')
  })

  it('marks a bar that failed the mean rule, which caps its verdict', () => {
    const failed = device('temp-1', Verdict.Precise, { stats: { sd: 1, meanDeviation: 1.2 } })
    renderWithTheme(<SigmaBandsRanking {...props} devices={[failed]} />)

    expect(specOf()?.labelOf(failed)).toContain('✗')
  })

  it('draws three σ zones and two ceiling lines', () => {
    renderWithTheme(<SigmaBandsRanking {...props} />)

    expect(specOf()?.bands?.plotBands).toHaveLength(3)
    expect(specOf()?.bands?.plotLines).toHaveLength(2)
  })
})

describe('ToleranceRanking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('measures bars by the worst single reading', () => {
    renderWithTheme(<ToleranceRanking {...props} />)

    expect(specOf()?.valueOf(props.devices[0]!)).toBe(1.4)
  })

  it('labels each bar with how many readings missed', () => {
    renderWithTheme(<ToleranceRanking {...props} />)

    expect(specOf()?.labelOf(props.devices[0]!)).toBe('3/40 out')
  })

  it('draws a keep zone, a discard zone and the tolerance line between them', () => {
    renderWithTheme(<ToleranceRanking {...props} />)

    expect(specOf()?.bands?.plotBands).toHaveLength(2)
    expect(specOf()?.bands?.plotLines).toHaveLength(1)
  })

  it('explains that one reading outside tolerance is enough', () => {
    renderWithTheme(<ToleranceRanking {...props} />)

    expect(specOf()?.accessibilityDescription).toContain('one reading outside tolerance is enough')
  })
})

describe('UnclassifiedRanking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('draws no thresholds, because none are registered', () => {
    renderWithTheme(<UnclassifiedRanking {...props} />)

    expect(specOf()?.bands).toBeUndefined()
  })

  it('labels every bar unclassified rather than inventing a verdict', () => {
    renderWithTheme(<UnclassifiedRanking {...props} />)

    expect(specOf()?.labelOf(props.devices[0]!)).toBe('unclassified')
  })

  it('says the readings are reported rather than judged', () => {
    renderWithTheme(<UnclassifiedRanking {...props} />)

    expect(specOf()?.describe(props.devices[0]!)).toContain('reported rather than judged')
  })
})

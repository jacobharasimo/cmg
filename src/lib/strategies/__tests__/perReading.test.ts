import { beforeEach, describe, expect, it, vi } from 'vitest'
import { countOutOfTolerance } from '../../stats'
import { DEFAULT_THRESHOLDS } from '../../thresholds'
import { ReferenceKey, SensorType, Verdict } from '../../types'
import type { DeviceStats, EvaluationInput } from '../../types'
import { perReadingStrategy } from '../perReading'

vi.mock('../../stats', () => ({ countOutOfTolerance: vi.fn(() => 0) }))
const mockedCount = vi.mocked(countOutOfTolerance)

const strategy = perReadingStrategy({
  type: SensorType.Humidity,
  label: 'Humidity',
  shortLabel: 'Humidity',
  unit: '%',
  referenceKey: ReferenceKey.Humidity,
  decimals: 1,
  thresholdKey: 'humidity',
})

const stats = (worstDeviation: number | null): DeviceStats => ({
  count: 5,
  mean: 45,
  sd: 0.4,
  min: 44,
  max: 46,
  meanDeviation: 0.2,
  worstDeviation,
})

const input = (worstDeviation: number | null): EvaluationInput => ({
  stats: stats(worstDeviation),
  readings: [],
  reference: 45,
  thresholds: DEFAULT_THRESHOLDS,
})

describe('perReadingStrategy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedCount.mockReturnValue(0)
  })

  it('builds a strategy that judges every reading', () => {
    expect(strategy.isPerReading).toBe(true)
    expect(strategy.type).toBe(SensorType.Humidity)
    expect(strategy.rankAxisLabel).toBe('worst |reading − reference| (%)')
  })

  it('keeps a device whose worst reading is inside tolerance', () => {
    expect(strategy.evaluate(input(0.3)).verdict).toBe(Verdict.Keep)
  })

  it('discards a device whose worst reading is outside tolerance', () => {
    mockedCount.mockReturnValue(2)

    expect(strategy.evaluate(input(2.9)).verdict).toBe(Verdict.Discard)
  })

  it('treats a reading exactly on the tolerance as inside it', () => {
    expect(strategy.evaluate(input(1)).verdict).toBe(Verdict.Keep)
  })

  it('discards when there is no reference to measure against', () => {
    expect(strategy.evaluate(input(null)).verdict).toBe(Verdict.Discard)
  })

  it('passes the resolved tolerance to the counting helper', () => {
    strategy.evaluate(input(0.3))

    expect(mockedCount).toHaveBeenCalledWith([], 45, DEFAULT_THRESHOLDS.humidity)
  })

  it('surfaces the out-of-tolerance count in the trace', () => {
    mockedCount.mockReturnValue(3)

    expect(strategy.evaluate(input(2)).checks[1]?.text).toBe('3 of 5 readings out of tolerance')
  })

  it('prepends the note when one is configured', () => {
    const withNote = perReadingStrategy({
      type: SensorType.Noise,
      label: 'Noise',
      shortLabel: 'Noise',
      unit: ' dB',
      referenceKey: ReferenceKey.Noise,
      decimals: 1,
      thresholdKey: 'noise',
      note: 'registered post-hoc',
    })

    expect(withNote.evaluate(input(0.1)).checks[0]).toEqual({
      text: 'registered post-hoc',
      didPass: true,
    })
  })

  it('ranks by worst deviation, treating a missing one as zero', () => {
    expect(strategy.rankBy(stats(2.4))).toBe(2.4)
    expect(strategy.rankBy(stats(null))).toBe(0)
  })
})

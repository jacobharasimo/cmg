import { describe, expect, it } from 'vitest'
import { DEFAULT_THRESHOLDS, resolveThresholds } from '../thresholds'

describe('DEFAULT_THRESHOLDS', () => {
  it("matches the assignment's stated criteria (p.3)", () => {
    expect(DEFAULT_THRESHOLDS.thermometerMean).toBe(0.5)
    expect(DEFAULT_THRESHOLDS.thermometerSdUltra).toBe(3)
    expect(DEFAULT_THRESHOLDS.thermometerSdVery).toBe(5)
    expect(DEFAULT_THRESHOLDS.humidity).toBe(1)
    expect(DEFAULT_THRESHOLDS.monoxide).toBe(3)
  })

  it('is frozen, so a caller cannot mutate the spec defaults', () => {
    expect(Object.isFrozen(DEFAULT_THRESHOLDS)).toBe(true)
  })
})

describe('resolveThresholds', () => {
  it('returns the defaults when given nothing', () => {
    expect(resolveThresholds()).toEqual(DEFAULT_THRESHOLDS)
  })

  it('merges partial overrides over the defaults', () => {
    const resolved = resolveThresholds({ humidity: 2.5 })

    expect(resolved.humidity).toBe(2.5)
    expect(resolved.monoxide).toBe(DEFAULT_THRESHOLDS.monoxide)
  })

  it('does not mutate the defaults', () => {
    resolveThresholds({ humidity: 99 })

    expect(DEFAULT_THRESHOLDS.humidity).toBe(1)
  })
})

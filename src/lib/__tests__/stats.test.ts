import { describe, expect, it } from 'vitest'
import { countOutOfTolerance, summarise } from '../stats'
import type { Reading } from '../types'

const readings = (...values: number[]): Reading[] =>
  values.map((value, index) => ({ at: `2007-04-05T22:0${String(index)}`, value }))

describe('summarise', () => {
  it('computes mean, population σ, min and max', () => {
    const stats = summarise(readings(2, 4, 4, 4, 5, 5, 7, 9), null)

    expect(stats.count).toBe(8)
    expect(stats.mean).toBe(5)
    expect(stats.sd).toBe(2)
    expect(stats.min).toBe(2)
    expect(stats.max).toBe(9)
  })

  it('measures deviation from the reference when one exists', () => {
    const stats = summarise(readings(69, 71, 74), 70)

    expect(stats.meanDeviation).toBeCloseTo(1.333, 3)
    expect(stats.worstDeviation).toBe(4)
  })

  it('leaves deviations null without a reference, rather than scoring zero', () => {
    const stats = summarise(readings(10, 20), null)

    expect(stats.meanDeviation).toBeNull()
    expect(stats.worstDeviation).toBeNull()
  })

  it('returns a zeroed summary for no readings', () => {
    expect(summarise([], 70)).toEqual({
      count: 0,
      mean: 0,
      sd: 0,
      min: 0,
      max: 0,
      meanDeviation: null,
      worstDeviation: null,
    })
  })

  it('reports σ of zero for identical readings', () => {
    expect(summarise(readings(5, 5, 5), null).sd).toBe(0)
  })
})

describe('countOutOfTolerance', () => {
  it('counts readings further than the tolerance from the reference', () => {
    expect(countOutOfTolerance(readings(45.2, 43.9, 42.1), 45, 1)).toBe(2)
  })

  it('treats a reading exactly on the tolerance as inside it', () => {
    expect(countOutOfTolerance(readings(9), 6, 3)).toBe(0)
  })

  it('returns null when there is no reference to measure against', () => {
    expect(countOutOfTolerance(readings(1, 2), null, 1)).toBeNull()
  })
})

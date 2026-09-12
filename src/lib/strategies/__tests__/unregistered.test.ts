import { describe, expect, it } from 'vitest'
import { DEFAULT_THRESHOLDS } from '../../thresholds'
import { Verdict } from '../../types'
import type { EvaluationInput } from '../../types'
import { unregistered } from '../unregistered'

const input: EvaluationInput = {
  stats: { count: 6, mean: 50, sd: 3, min: 44, max: 56, meanDeviation: null, worstDeviation: null },
  readings: [],
  reference: null,
  thresholds: DEFAULT_THRESHOLDS,
}

describe('unregistered', () => {
  it('has no type or reference of its own', () => {
    expect(unregistered.type).toBeNull()
    expect(unregistered.referenceKey).toBeNull()
  })

  it('reports unclassified rather than guessing a verdict', () => {
    expect(unregistered.evaluate(input).verdict).toBe(Verdict.Unclassified)
  })

  it('counts nothing out of tolerance, because nothing was judged', () => {
    expect(unregistered.evaluate(input).outOfTolerance).toBeNull()
  })

  it('explains in the trace that the readings were parsed but not judged', () => {
    const { checks } = unregistered.evaluate(input)

    expect(checks[0]?.text).toBe('no strategy registered for this sensor type')
    expect(checks[1]?.text).toBe('readings parsed: 6 — reported, not judged')
  })

  it('has an unbounded tolerance, so no band is ever drawn', () => {
    expect(unregistered.tolerance(DEFAULT_THRESHOLDS)).toBe(Number.POSITIVE_INFINITY)
  })

  it('ranks by σ so the readings can still be compared', () => {
    expect(unregistered.rankBy(input.stats)).toBe(3)
  })
})

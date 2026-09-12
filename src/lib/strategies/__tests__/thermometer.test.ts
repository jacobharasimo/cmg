import { describe, expect, it } from 'vitest'
import { DEFAULT_THRESHOLDS } from '../../thresholds'
import { SensorType, Verdict } from '../../types'
import type { DeviceStats, EvaluationInput } from '../../types'
import { thermometer } from '../thermometer'

const stats = (mean: number, sd: number, meanDeviation: number | null): DeviceStats => ({
  count: 5,
  mean,
  sd,
  min: mean - sd,
  max: mean + sd,
  meanDeviation,
  worstDeviation: meanDeviation,
})

const evaluate = (sd: number, meanDeviation: number | null): EvaluationInput => ({
  stats: stats(70, sd, meanDeviation),
  readings: [],
  reference: 70,
  thresholds: DEFAULT_THRESHOLDS,
})

describe('thermometer', () => {
  it('describes itself as a whole-series thermometer rule', () => {
    expect(thermometer.type).toBe(SensorType.Thermometer)
    expect(thermometer.isPerReading).toBe(false)
    expect(thermometer.referenceKey).toBe('temperature')
  })

  it('is ultra precise when the mean is within tolerance and σ is under the ultra ceiling', () => {
    expect(thermometer.evaluate(evaluate(2.9, 0.4)).verdict).toBe(Verdict.UltraPrecise)
  })

  it('is very precise when σ sits between the ultra and very ceilings', () => {
    expect(thermometer.evaluate(evaluate(4.9, 0.4)).verdict).toBe(Verdict.VeryPrecise)
  })

  it('falls back to precise when σ exceeds both ceilings', () => {
    expect(thermometer.evaluate(evaluate(6, 0.4)).verdict).toBe(Verdict.Precise)
  })

  it('caps at precise when the mean rule fails, however tight σ is', () => {
    expect(thermometer.evaluate(evaluate(0.1, 1.2)).verdict).toBe(Verdict.Precise)
  })

  it('treats a σ exactly on the ceiling as outside it (strictly less than)', () => {
    expect(thermometer.evaluate(evaluate(3, 0.4)).verdict).toBe(Verdict.VeryPrecise)
  })

  it('treats a mean deviation exactly on tolerance as within it', () => {
    expect(thermometer.evaluate(evaluate(1, 0.5)).verdict).toBe(Verdict.UltraPrecise)
  })

  it('fails the mean check when there is no reference to compare against', () => {
    expect(thermometer.evaluate(evaluate(1, null)).verdict).toBe(Verdict.Precise)
  })

  it('returns a trace whose final line names the verdict', () => {
    const { checks } = thermometer.evaluate(evaluate(2, 0.2))

    expect(checks).toHaveLength(4)
    expect(checks.at(-1)?.text).toBe('classified: ultra precise')
  })

  it('reports no out-of-tolerance count, because it judges the series not readings', () => {
    expect(thermometer.evaluate(evaluate(2, 0.2)).outOfTolerance).toBeNull()
  })

  it('ranks by σ', () => {
    expect(thermometer.rankBy(stats(70, 2.5, 0.1))).toBe(2.5)
  })

  it('takes its tolerance from the thresholds it is given', () => {
    expect(thermometer.tolerance({ ...DEFAULT_THRESHOLDS, thermometerMean: 1.75 })).toBe(1.75)
  })
})

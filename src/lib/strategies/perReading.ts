import { countOutOfTolerance } from '../stats'
import { Verdict } from '../types'
import type { EvaluationInput, Evaluation, SensorStrategy } from '../types'
import type { PerReadingConfig } from './types'

/**
 * Builds a keep/discard strategy: every reading must sit inside the tolerance
 * band, and one bad reading discards the device (assignment p.3, rules 2 and 3).
 *
 * Humidity, CO and noise differ only in label, unit and threshold, so they
 * share this factory rather than repeating the rule three times.
 */
export function perReadingStrategy(config: PerReadingConfig): SensorStrategy {
  const { type, label, shortLabel, unit, referenceKey, decimals, thresholdKey, note } = config
  const format = (value: number): string => value.toFixed(decimals)

  return {
    type,
    label,
    shortLabel,
    unit,
    referenceKey,
    decimals,
    isPerReading: true,
    judgedOn: 'every individual reading',
    rankAxisLabel: `worst |reading − reference| (${unit.trim() || 'units'})`,

    tolerance: (thresholds) => thresholds[thresholdKey],
    rankBy: (stats) => stats.worstDeviation ?? 0,

    evaluate({ stats, reference, thresholds, readings }: EvaluationInput): Evaluation {
      const limit = thresholds[thresholdKey]
      const worst = stats.worstDeviation ?? Number.POSITIVE_INFINITY
      const didPass = worst <= limit
      const outOfTolerance = countOutOfTolerance(readings, reference, limit)
      const verdict = didPass ? Verdict.Keep : Verdict.Discard

      const checks = [
        {
          text: `all readings within ${format(limit)}${unit} → worst ${format(worst)}${unit}`,
          didPass,
        },
        {
          text: `${String(outOfTolerance ?? 0)} of ${String(stats.count)} readings out of tolerance`,
          didPass: outOfTolerance === 0,
        },
        { text: `classified: ${verdict}`, didPass },
      ]

      return {
        verdict,
        outOfTolerance,
        checks: note ? [{ text: note, didPass: true }, ...checks] : checks,
      }
    },
  }
}

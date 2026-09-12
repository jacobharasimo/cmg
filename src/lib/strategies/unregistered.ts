import { Verdict } from '../types'
import type { EvaluationInput, Evaluation, SensorStrategy } from '../types'

/**
 * The fallback for a sensor type nobody registered.
 *
 * It reports, it does not judge. Borrowing another type's thresholds would
 * invent a verdict the log gives no basis for, so the readings are parsed and
 * summarised and the device comes back `unclassified` — an absence of criteria,
 * not a failed check.
 */
export const unregistered: SensorStrategy = {
  type: null,
  label: 'Unrecognised',
  shortLabel: 'Unknown',
  unit: '',
  referenceKey: null,
  decimals: 2,
  isPerReading: false,
  judgedOn: 'nothing — no rule is registered',
  rankAxisLabel: 'σ — standard deviation of readings',

  tolerance: () => Number.POSITIVE_INFINITY,
  rankBy: (stats) => stats.sd,

  evaluate({ stats }: EvaluationInput): Evaluation {
    return {
      verdict: Verdict.Unclassified,
      outOfTolerance: null,
      checks: [
        { text: 'no strategy registered for this sensor type', didPass: false },
        { text: `readings parsed: ${String(stats.count)} — reported, not judged`, didPass: true },
        { text: 'register a strategy to classify it', didPass: false },
      ],
    }
  },
}

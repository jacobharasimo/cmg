import { ReferenceKey, SensorType, Verdict } from '../types'
import type { EvaluationInput, Evaluation, SensorStrategy, Thresholds } from '../types'

/**
 * Thermometers are judged on the series as a whole (assignment p.3): the mean
 * must sit within tolerance of the reference, and σ decides how precise.
 *
 * Missing the mean check caps the device at `precise` however tight σ is.
 */
export const thermometer: SensorStrategy = {
  type: SensorType.Thermometer,
  shortLabel: 'Thermometer',
  label: 'Thermometer',
  unit: '°',
  referenceKey: ReferenceKey.Temperature,
  decimals: 1,
  isPerReading: false,
  judgedOn: 'the mean and σ of the whole series',
  rankAxisLabel: 'σ — standard deviation of readings',

  tolerance: (thresholds: Thresholds) => thresholds.thermometerMean,
  rankBy: (stats) => stats.sd,

  evaluate({ stats, thresholds }: EvaluationInput): Evaluation {
    const { thermometerMean, thermometerSdUltra, thermometerSdVery } = thresholds
    const deviation = stats.meanDeviation ?? Number.POSITIVE_INFINITY
    const meanOk = deviation <= thermometerMean
    const ultraOk = stats.sd < thermometerSdUltra
    const veryOk = stats.sd < thermometerSdVery

    const verdict = meanOk && ultraOk
      ? Verdict.UltraPrecise
      : meanOk && veryOk
        ? Verdict.VeryPrecise
        : Verdict.Precise

    return {
      verdict,
      // Null, not zero: a thermometer is judged on the mean and σ of the whole
      // series, so "readings outside tolerance" is a rule that does not apply
      // to it. Reporting a count here would imply one that does.
      outOfTolerance: null,
      checks: [
        {
          text: `mean within ${thermometerMean.toFixed(1)}° → ${deviation.toFixed(2)}°`,
          didPass: meanOk,
        },
        {
          text: `σ < ${thermometerSdUltra.toFixed(1)} (ultra) → ${stats.sd.toFixed(2)}`,
          didPass: meanOk && ultraOk,
        },
        {
          text: `σ < ${thermometerSdVery.toFixed(1)} (very) → ${stats.sd.toFixed(2)}`,
          didPass: meanOk && veryOk,
        },
        { text: `classified: ${verdict}`, didPass: verdict !== Verdict.Precise },
      ],
    }
  },
}

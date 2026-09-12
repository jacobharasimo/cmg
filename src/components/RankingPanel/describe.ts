import { SensorType, Verdict } from '@/lib'
import type { LegendEntry } from './types'

/** Title, explanation and legend for the type being ranked. */
export function describe(
  sensorType: string,
  label: string | undefined,
  /** The strategy's own type — null when nothing is registered for it. */
  registeredType: SensorType | null,
  thresholds: { thermometerSdUltra: number; thermometerSdVery: number },
  verdict: Readonly<Record<Verdict, string>>,
): { title: string; blurb: string; legend: LegendEntry[] } {
  if (registeredType === null) {
    return {
      title: `Unrecognised sensor type: ${sensorType}`,
      blurb:
        'No classification strategy is registered for this type, so no thresholds are drawn. ' +
        'The readings are still parsed and summarised — the library reports these devices as ' +
        "unclassified rather than guessing with another type's rules.",
      legend: [{ label: 'unclassified — no rule registered', color: verdict[Verdict.Unclassified] }],
    }
  }

  if (registeredType === SensorType.Thermometer) {
    return {
      title: 'Thermometer precision, ranked',
      blurb:
        'Bar length is σ and the shaded zones are the σ classes. The label on each bar is that ' +
        "device's mean deviation from reference — ✗ means it failed the mean rule, which caps it " +
        'at "precise" whatever its σ.',
      legend: [
        { label: `ultra precise — σ < ${String(thresholds.thermometerSdUltra)}`, color: verdict[Verdict.UltraPrecise] },
        { label: `very precise — σ < ${String(thresholds.thermometerSdVery)}`, color: verdict[Verdict.VeryPrecise] },
        { label: 'precise — fallback', color: verdict[Verdict.Precise] },
      ],
    }
  }

  return {
    title: `${label ?? sensorType} devices, ranked`,
    blurb:
      "Bar length is the worst single reading's distance from reference, and the label is how " +
      'many readings missed. Anything past the tolerance line is discarded — one bad reading is enough.',
    legend: [
      { label: 'keep — every reading within tolerance', color: verdict[Verdict.Keep] },
      { label: 'discard — at least one reading outside', color: verdict[Verdict.Discard] },
    ],
  }
}

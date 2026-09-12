/**
 * Every type, interface and enum for the evaluation layer.
 *
 * Nothing here imports React, MUI or the DOM — this is the part of the app that
 * decides whether a sensor passes, and it stays callable from anywhere.
 */

/**
 * Sensor types with a registered classification rule.
 *
 * A string enum rather than a union: it exists at runtime, so `Object.values()`
 * drives the filter controls and the strategy registry, and `Record<SensorType, T>`
 * refuses to compile until every member is handled.
 *
 * `Noise` is NOT in the assignment spec — p.7 names a noise level detector as a
 * future sensor type, so it is registered here to demonstrate that adding one is
 * additive. Its threshold is ours, not the spec's.
 */
export enum SensorType {
  Thermometer = 'thermometer',
  Humidity = 'humidity',
  Monoxide = 'monoxide',
  Noise = 'noise',
}

/** Every classification a device can receive. */
export enum Verdict {
  /** Thermometer: mean within tolerance and σ below the ultra ceiling. */
  UltraPrecise = 'ultra precise',
  /** Thermometer: mean within tolerance and σ below the very ceiling. */
  VeryPrecise = 'very precise',
  /** Thermometer: the fallback when the mean or σ rules are missed. */
  Precise = 'precise',
  /** Per-reading types: every reading sat inside the tolerance band. */
  Keep = 'keep',
  /** Per-reading types: at least one reading fell outside it. */
  Discard = 'discard',
  /** No strategy is registered for the sensor type — reported, not judged. */
  Unclassified = 'unclassified',
}

/** Reference keys a log can declare. */
export enum ReferenceKey {
  Temperature = 'temperature',
  Humidity = 'humidity',
  Monoxide = 'monoxide',
  Noise = 'noise',
}

/** A single logged reading. `at` is the raw timestamp as it appeared. */
export interface Reading {
  readonly at: string
  readonly value: number
}

/** A device block as parsed, before any rule is applied. */
export interface ParsedDevice {
  /** The raw type string from the log — not yet known to be a `SensorType`. */
  readonly type: string
  readonly name: string
  readonly readings: readonly Reading[]
}

export type ReferenceValues = Partial<Record<ReferenceKey, number>>

export interface ParsedLog {
  readonly reference: ReferenceValues
  readonly devices: readonly ParsedDevice[]
  readonly lines: number
}

/**
 * Descriptive statistics for one device.
 *
 * The deviation fields are null when no reference exists for the sensor type —
 * defaulting them to zero would read as a perfect score.
 */
export interface DeviceStats {
  readonly count: number
  readonly mean: number
  readonly sd: number
  readonly min: number
  readonly max: number
  readonly meanDeviation: number | null
  readonly worstDeviation: number | null
}

/** One line of the rule trace shown beside a device. */
export interface RuleCheck {
  readonly text: string
  readonly didPass: boolean
}

/** Thresholds are configuration, never literals inside a rule. */
export interface Thresholds {
  /** Thermometer: max |mean − reference|, in degrees. */
  readonly thermometerMean: number
  /** Thermometer: σ below which a device is ultra precise. */
  readonly thermometerSdUltra: number
  /** Thermometer: σ below which a device is very precise. */
  readonly thermometerSdVery: number
  /** Humidity: max |reading − reference| for every reading, in %. */
  readonly humidity: number
  /** Carbon monoxide: max |reading − reference| for every reading, in ppm. */
  readonly monoxide: number
  /** Noise: max |reading − reference| for every reading, in dB. Not in the spec. */
  readonly noise: number
}

/** What a strategy is handed when it judges a device. */
export interface EvaluationInput {
  readonly stats: DeviceStats
  readonly readings: readonly Reading[]
  readonly reference: number | null
  readonly thresholds: Thresholds
}

/** What a strategy returns. */
export interface Evaluation {
  readonly verdict: Verdict
  readonly outOfTolerance: number | null
  readonly checks: readonly RuleCheck[]
}

/**
 * How one sensor type is judged.
 *
 * Adding a sensor type means adding one of these to the registry; no existing
 * strategy is touched and nothing switches on the type.
 */
export interface SensorStrategy {
  /** Null for the unregistered fallback, which has no type of its own. */
  readonly type: SensorType | null
  readonly label: string
  /**
   * Shorter name, for a filter chip or an axis where `label` will not fit.
   * Lives with the sensor so nothing downstream keeps a second list of names.
   */
  readonly shortLabel: string
  /** Display unit, including any leading space (`' ppm'`, `'%'`, `'°'`). */
  readonly unit: string
  readonly referenceKey: ReferenceKey | null
  readonly decimals: number
  /** True when every reading is judged, false when the series is judged as a whole. */
  readonly isPerReading: boolean
  /** Human-readable summary of what the rule looks at. */
  readonly judgedOn: string
  /** Absolute tolerance for this strategy at the given thresholds. */
  readonly tolerance: (thresholds: Thresholds) => number
  /** The value this sensor type is ranked by in the ranking chart. */
  readonly rankBy: (stats: DeviceStats) => number
  /** Y-axis label for the ranking chart. */
  readonly rankAxisLabel: string
  readonly evaluate: (input: EvaluationInput) => Evaluation
}

/** One device, fully evaluated. */
export interface DeviceReport {
  readonly name: string
  /** The raw type string from the log. */
  readonly type: string
  readonly strategy: SensorStrategy
  readonly isRegistered: boolean
  readonly reference: number | null
  readonly readings: readonly Reading[]
  readonly stats: DeviceStats
  readonly verdict: Verdict
  readonly outOfTolerance: number | null
  readonly checks: readonly RuleCheck[]
  /** Absolute tolerance applied to this device, for drawing the band. */
  readonly tolerance: number
}

/** The whole batch, as the UI consumes it. */
export interface BatchReport {
  readonly reference: Required<ReferenceValues>
  readonly devices: readonly DeviceReport[]
  readonly counts: Readonly<Partial<Record<Verdict, number>>>
  readonly lines: number
}

/** The spec's output shape: device name → verdict. */
export type VerdictMap = Record<string, Verdict>

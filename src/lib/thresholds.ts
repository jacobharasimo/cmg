import type { Thresholds } from './types'

/**
 * The spec's thresholds (assignment p.3).
 *
 * `noise` is not in the spec — p.7 names a noise level detector as a future
 * sensor type, so this value is our own placeholder for the extensibility demo.
 */
export const DEFAULT_THRESHOLDS: Thresholds = Object.freeze({
  thermometerMean: 0.5,
  thermometerSdUltra: 3,
  thermometerSdVery: 5,
  humidity: 1,
  monoxide: 3,
  noise: 3,
})

/** Merge partial overrides onto the spec defaults. */
export function resolveThresholds(overrides?: Partial<Thresholds>): Thresholds {
  return { ...DEFAULT_THRESHOLDS, ...overrides }
}

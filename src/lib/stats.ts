import type { DeviceStats, Reading } from './types'

const EMPTY: DeviceStats = {
  count: 0,
  mean: 0,
  sd: 0,
  min: 0,
  max: 0,
  meanDeviation: null,
  worstDeviation: null,
}

/**
 * Descriptive statistics for one device's readings.
 *
 * `reference` is null when the sensor type has none registered, and the
 * deviation fields stay null rather than defaulting to zero — zero would read
 * as a perfect score for a device nothing was measured against.
 */
export function summarise(readings: readonly Reading[], reference: number | null): DeviceStats {
  const count = readings.length
  if (count === 0) return EMPTY

  let total = 0
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  for (const { value } of readings) {
    total += value
    if (value < min) min = value
    if (value > max) max = value
  }

  const mean = total / count
  let squaredError = 0
  let worstDeviation = reference === null ? null : 0
  for (const { value } of readings) {
    squaredError += (value - mean) ** 2
    if (reference !== null && worstDeviation !== null) {
      worstDeviation = Math.max(worstDeviation, Math.abs(value - reference))
    }
  }

  return {
    count,
    mean,
    sd: Math.sqrt(squaredError / count),
    min,
    max,
    meanDeviation: reference === null ? null : Math.abs(mean - reference),
    worstDeviation,
  }
}

/** How many readings sit further than `tolerance` from `reference`. */
export function countOutOfTolerance(
  readings: readonly Reading[],
  reference: number | null,
  tolerance: number,
): number | null {
  if (reference === null) return null
  return readings.filter(({ value }) => Math.abs(value - reference) > tolerance).length
}

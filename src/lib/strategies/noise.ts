import { ReferenceKey, SensorType } from '../types'
import type { SensorStrategy } from '../types'
import { perReadingStrategy } from './perReading'

/**
 * Noise level detectors — **not in the assignment spec**.
 *
 * p.7 names a noise detector as a future sensor type, so it is registered here
 * to demonstrate the shape of that change: one file, one registry entry, one
 * threshold, and no edit to any existing rule. Its 3 dB tolerance is ours, not
 * the spec's.
 *
 * Decibels are logarithmic and have no imperial counterpart, so like the other
 * per-reading types this file declares no conversion.
 */
export const noise: SensorStrategy = perReadingStrategy({
  type: SensorType.Noise,
  shortLabel: 'Noise',
  label: 'Noise (ext.)',
  unit: ' dB',
  referenceKey: ReferenceKey.Noise,
  decimals: 1,
  thresholdKey: 'noise',
  note: 'registered post-hoc: no core code changed',
})

import { ReferenceKey, SensorType } from '../types'
import type { SensorStrategy } from '../types'
import { perReadingStrategy } from './perReading'

/**
 * Humidity sensors: discarded unless **every** reading sits within tolerance of
 * the reference (assignment p.3, rule 2).
 *
 * Readings are a percentage of moisture saturation, which is a ratio rather
 * than a dimension — so there is no second unit to offer a reader, and this
 * file has no conversion to declare.
 */
export const humidity: SensorStrategy = perReadingStrategy({
  type: SensorType.Humidity,
  shortLabel: 'Humidity',
  label: 'Humidity',
  unit: '%',
  referenceKey: ReferenceKey.Humidity,
  decimals: 1,
  thresholdKey: 'humidity',
})

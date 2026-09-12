import { ReferenceKey, SensorType } from '../types'
import type { SensorStrategy } from '../types'
import { perReadingStrategy } from './perReading'

/**
 * Carbon monoxide detectors: discarded unless **every** reading sits within
 * tolerance of the reference (assignment p.3, rule 3).
 *
 * Readings are integer parts per million. ppm is a ratio, so it does not
 * convert; the mg/m³ figure some regions prefer depends on molar mass and on
 * the temperature and pressure a reading was taken at, which makes it a derived
 * quantity rather than a display unit. See `docs/enhancements/02-data-model.md`.
 */
export const monoxide: SensorStrategy = perReadingStrategy({
  type: SensorType.Monoxide,
  shortLabel: 'CO',
  label: 'CO detector',
  unit: ' ppm',
  referenceKey: ReferenceKey.Monoxide,
  decimals: 0,
  thresholdKey: 'monoxide',
})

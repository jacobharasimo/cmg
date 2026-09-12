/**
 * Which rule judges which sensor type.
 *
 * Nothing but wiring: each sensor owns its own file, and this maps them. Kept
 * out of `index.ts` so that file stays a barrel — the same split
 * `RankingPanel` uses for its chart registry.
 */

import { SensorType } from '../types'
import type { SensorStrategy } from '../types'
import { humidity } from './humidity'
import { monoxide } from './monoxide'
import { noise } from './noise'
import { thermometer } from './thermometer'
import { unregistered } from './unregistered'

/**
 * The strategy registry.
 *
 * Typed as a total record over `SensorType`, so adding a member to the enum
 * fails to compile until its strategy exists. Nothing in the codebase switches
 * on a sensor type.
 */
export const STRATEGIES: Readonly<Record<SensorType, SensorStrategy>> = Object.freeze({
  [SensorType.Thermometer]: thermometer,
  [SensorType.Humidity]: humidity,
  [SensorType.Monoxide]: monoxide,
  [SensorType.Noise]: noise,
})

const SENSOR_TYPES: readonly string[] = Object.values(SensorType)

/** Narrows a raw type string from a log to a registered sensor type. */
export function isSensorType(value: string): value is SensorType {
  return SENSOR_TYPES.includes(value)
}

/** Look a raw log type up, falling back to the report-only strategy. */
export function strategyFor(type: string): SensorStrategy {
  return isSensorType(type) ? STRATEGIES[type] : unregistered
}

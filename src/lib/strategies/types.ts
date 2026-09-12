import type { ReferenceKey, SensorType, Thresholds } from '../types'

/** Types shared by the strategy implementations. */

/**
 * Which threshold a per-reading strategy reads.
 *
 * Derived from `Thresholds` rather than written out, so removing or renaming a
 * threshold fails to compile here instead of at the call site.
 */
export type PerReadingThresholdKey = Extract<keyof Thresholds, 'humidity' | 'monoxide' | 'noise'>

/** Everything that distinguishes one per-reading sensor type from another. */
export interface PerReadingConfig {
  readonly type: SensorType
  readonly label: string
  readonly shortLabel: string
  readonly unit: string
  readonly referenceKey: ReferenceKey
  readonly decimals: number
  readonly thresholdKey: PerReadingThresholdKey
  /** Extra first line in the rule trace, used by the post-hoc noise strategy. */
  readonly note?: string | undefined
}

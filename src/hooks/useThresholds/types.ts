import type { Thresholds } from '@/lib'

/** Types for `useThresholds`. */

export interface UseThresholdsResult {
  readonly thresholds: Thresholds
  /** True when any value differs from the spec defaults. */
  readonly isModified: boolean
  readonly set: (key: keyof Thresholds, value: number) => void
  readonly reset: () => void
}

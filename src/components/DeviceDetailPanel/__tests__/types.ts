/**
 * Types for this folder's tests only.
 *
 * Kept out of the component's `types.ts`, which is its public surface — a
 * fixture builder's options are not part of what `DeviceDetailPanel` offers.
 */

/** Overrides for the `device()` fixture builder. */
export interface Overrides {
  readonly isPerReading?: boolean
  readonly reference?: number | null
  readonly values?: number[]
  readonly tolerance?: number
}

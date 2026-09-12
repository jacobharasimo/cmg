import type { DeviceReport, SensorType } from '@/lib'

/** Types for `useDeviceSelection`. */

/** Columns the device table can sort by. */
export enum SortKey {
  Name = 'name',
  Type = 'type',
  Verdict = 'verdict',
  Mean = 'mean',
  Deviation = 'deviation',
  Sd = 'sd',
  OutOfTolerance = 'outOfTolerance',
  Readings = 'readings',
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

/**
 * The two filters that are not a sensor type.
 *
 * An enum rather than bare strings so `'unregistered'` cannot be mistyped at
 * any of the call sites that compare against it.
 */
export enum FilterScope {
  All = 'all',
  Unregistered = 'unregistered',
}

/** Either one sensor type, or one of the scopes above. */
export type DeviceFilter = SensorType | FilterScope

export interface UseDeviceSelectionResult {
  readonly devices: readonly DeviceReport[]
  readonly selected: DeviceReport | null
  readonly sortKey: SortKey
  readonly sortDirection: SortDirection
  readonly filter: DeviceFilter
  readonly select: (name: string) => void
  readonly sortBy: (key: SortKey) => void
  readonly filterBy: (filter: DeviceFilter) => void
}

import { SortKey } from '@/hooks'
import type { DeviceColumn } from './types'

/**
 * The table's columns, in order.
 *
 * A runtime value rather than a type, so it lives here instead of `types.ts`.
 * Keyed by `SortKey` so a column cannot name a sort the hook does not
 * implement, and `isNumeric` right-aligns the cell and selects the monospace
 * treatment that makes the numeric columns scannable.
 */
export const DEVICE_COLUMNS: readonly DeviceColumn[] = [
  { key: SortKey.Name, label: 'Device', isNumeric: false },
  { key: SortKey.Type, label: 'Type', isNumeric: false },
  { key: SortKey.Verdict, label: 'Verdict', isNumeric: false },
  { key: SortKey.Mean, label: 'Mean', isNumeric: true },
  { key: SortKey.Deviation, label: 'Deviation from ref', isNumeric: true },
  { key: SortKey.Sd, label: 'Standard deviation', isNumeric: true },
  { key: SortKey.OutOfTolerance, label: 'Readings outside tolerance', isNumeric: true },
  { key: SortKey.Readings, label: 'Total readings', isNumeric: true },
]

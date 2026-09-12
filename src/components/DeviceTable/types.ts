import type { DeviceFilter, SortDirection } from '@/hooks'
import type { SortKey } from '@/hooks'
import type { DeviceReport, Verdict } from '@/lib'
import type { DeviceFilterOption } from '@/components/DeviceFilters'

/** One column definition. `numeric` right-aligns the cell, as numbers should be. */
export interface DeviceColumn {
  readonly key: SortKey
  readonly label: string
  readonly isNumeric: boolean
}

export interface DeviceRowProps {
  readonly device: DeviceReport
  readonly isSelected: boolean
  readonly onSelect: (name: string) => void
  /**
   * Position in the *whole* batch, not the rendered window — the table is
   * virtualised, so this is what tells assistive technology where the row sits.
   */
  readonly rowIndex: number
  /** Set on one rendered row, so the window can measure a real row height. */
  readonly measureRef?: ((node: HTMLElement | null) => void) | undefined
}

export interface VerdictChipProps {
  readonly verdict: Verdict
  /** Filled chips are used where the verdict is the panel's headline. */
  readonly isFilled?: boolean | undefined
}

export interface DeviceTableProps {
  readonly devices: readonly DeviceReport[]
  readonly selectedName: string | null
  readonly sortKey: SortKey
  readonly sortDirection: SortDirection
  readonly filter: DeviceFilter
  readonly filterOptions: readonly DeviceFilterOption[]
  readonly onSelect: (name: string) => void
  readonly onSort: (key: SortKey) => void
  readonly onFilter: (filter: DeviceFilter) => void
}

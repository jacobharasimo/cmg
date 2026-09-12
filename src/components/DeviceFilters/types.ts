/** Props and option shape for the sensor-type filter. */
import type { DeviceFilter } from '@/hooks'

export interface DeviceFilterOption {
  readonly value: DeviceFilter
  readonly label: string
}

export interface DeviceFiltersProps {
  readonly options: readonly DeviceFilterOption[]
  readonly value: DeviceFilter
  readonly onChange: (value: DeviceFilter) => void
}

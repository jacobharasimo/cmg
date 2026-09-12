import type { DeviceReport } from '@/lib'

export interface DeviceDetailPanelProps {
  readonly device: DeviceReport | null
  readonly devices: readonly DeviceReport[]
  /** Show timestamps on a 12-hour clock. */
  readonly is12HourClock: boolean
  readonly onSelect: (name: string) => void
  readonly onClockChange: (is12HourClock: boolean) => void
}

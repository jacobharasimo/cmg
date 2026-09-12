import type { Theme } from '@mui/material'
import type { DeviceReport, Thresholds } from '@/lib'

/** What every ranking chart variant is given. */
export interface RankingChartProps {
  /** Devices of one sensor type, already filtered. */
  readonly devices: readonly DeviceReport[]
  readonly thresholds: Thresholds
  readonly selectedName: string | null
  readonly onSelect: (name: string) => void
}

export interface LegendEntry {
  readonly label: string
  readonly color: string
}

export interface RankingPanelProps {
  readonly devices: readonly DeviceReport[]
  readonly thresholds: Thresholds
  /** The raw log type currently being ranked. */
  readonly sensorType: string
  readonly sensorTypeOptions: readonly { value: string; label: string }[]
  readonly selectedName: string | null
  readonly onSensorTypeChange: (type: string) => void
  readonly onSelect: (name: string) => void
}

export interface BarSpec {
  readonly devices: readonly DeviceReport[]
  readonly theme: Theme
  readonly selectedName: string | null
  /** Value each bar represents. */
  readonly valueOf: (device: DeviceReport) => number
  readonly axisLabel: string
  /** Text drawn at the end of each bar. */
  readonly labelOf: (device: DeviceReport) => string
  /**
   * Colour of that text. Per point, not per chart: the design turns a label red
   * when its device failed the rule and leaves it muted otherwise.
   */
  readonly labelColorOf: (device: DeviceReport) => string
  readonly describe: (device: DeviceReport) => string
  readonly accessibilityDescription: string
  /** Selects a device, the same way clicking its row in the table does. */
  readonly onSelect: (name: string) => void
  /** Shaded zones and lines on the value axis. */
  readonly bands?: YAxisDecoration | undefined
}

export interface YAxisDecoration {
  readonly plotBands: { from: number; to: number; color: string }[]
  readonly plotLines: { value: number; color: string; dashStyle?: 'Dash' }[]
}

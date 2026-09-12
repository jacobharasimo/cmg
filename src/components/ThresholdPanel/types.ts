/** Props for the threshold panel, and the definition of one slider. */
import type { Thresholds } from '@/lib'

export interface ThresholdSlider {
  readonly key: keyof Thresholds
  readonly label: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly unit: string
}

export interface ThresholdPanelProps {
  readonly thresholds: Thresholds
  readonly isModified: boolean
  readonly onChange: (key: keyof Thresholds, value: number) => void
  readonly onReset: () => void
}

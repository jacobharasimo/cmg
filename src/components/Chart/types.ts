import type { Options } from 'highcharts'

export interface ChartProps {
  /** Fully-formed Highcharts options. Built by a pure function, never inline. */
  readonly options: Options
  /** Height in px. Charts need an explicit height to lay out. */
  readonly height: number
  /**
   * Rendered instead of the chart when Highcharts is unavailable. Every value
   * in a chart is also reachable as text, so this is a real fallback.
   */
  readonly fallback?: React.ReactNode
}

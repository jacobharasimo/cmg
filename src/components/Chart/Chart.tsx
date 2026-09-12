import { Box, useTheme } from '@mui/material'
import Highcharts from 'highcharts'
import 'highcharts/modules/accessibility'
import { useEffect, useMemo, useRef } from 'react'
import { chartTheme } from './chartTheme'
import type { ChartProps } from './types'

/**
 * The single Highcharts wrapper.
 *
 * Chrome and palette are merged in here, so a builder declares only what is
 * unique to its chart and cannot forget the rest.
 *
 * Merging rather than `Highcharts.setOptions()`: that applies defaults to the
 * whole process, which would put the theme outside React's ownership and make
 * ordering matter — the defaults would have to be installed before any chart
 * was constructed. Merging per chart keeps the theme flowing through context
 * and costs one shallow object per render.
 *
 * The `accessibility` module is imported for its side effect — a chart without
 * it fails WCAG, so it is not optional.
 */
const Chart = ({ options, height }: ChartProps) => {
  const theme = useTheme()
  const container = useRef<HTMLDivElement>(null)
  const chart = useRef<Highcharts.Chart | null>(null)

  const merged = useMemo(() => Highcharts.merge(chartTheme(theme), options), [options, theme])

  useEffect(() => {
    if (!container.current) return

    chart.current = Highcharts.chart(container.current, merged)

    return () => {
      chart.current?.destroy()
      chart.current = null
    }
    // Options are rebuilt on every relevant change; re-creating keeps the
    // chart honest rather than diffing two option trees by hand.
  }, [merged])

  return <Box ref={container} sx={{ width: '100%', height }} />
}

export default Chart

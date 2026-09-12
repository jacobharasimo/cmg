import type { Theme } from '@mui/material'
import type { Options } from 'highcharts'

/** The mono stack as a plain string — Highcharts style objects reject undefined. */
const mono = (theme: Theme): string => String(theme.typography.mono.fontFamily ?? 'monospace')

/** Axis chrome, applied to both axes of every chart. */
const axis = (theme: Theme) => ({
  gridLineColor: theme.palette.divider,
  lineColor: theme.palette.outline,
  tickColor: theme.palette.outline,
  title: { style: { color: theme.palette.text.secondary } },
  labels: { style: { color: theme.palette.text.secondary, fontFamily: mono(theme) } },
})

/**
 * Chart defaults derived from the MUI theme.
 *
 * Merged beneath every chart's own options by the `Chart` wrapper, so a
 * builder declares only what is unique to that chart and cannot forget the
 * chrome.
 *
 * Every colour here comes from the palette; no chart file holds a hex literal.
 */
export const chartTheme = (theme: Theme): Options => ({
  chart: {
    backgroundColor: 'transparent',
    style: { fontFamily: String(theme.typography.fontFamily ?? 'inherit') },
    spacing: [8, 8, 8, 8],
  },
  credits: { enabled: false },
  title: { text: '' },
  legend: { enabled: false },
  // Without this the charts are unreachable by keyboard and unreadable by a
  // screen reader. Each chart adds its own `description` on top.
  accessibility: { keyboardNavigation: { enabled: true } },
  tooltip: {
    backgroundColor: theme.palette.background.default,
    borderColor: theme.palette.outline,
    style: { color: theme.palette.text.primary },
  },
  xAxis: axis(theme),
  yAxis: axis(theme),
})

/** A palette colour at partial opacity, for threshold bands. */
export const tint = (hex: string, alpha: number): string => {
  const value = Number.parseInt(hex.slice(1), 16)
  const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255]
  return `rgba(${String(r)}, ${String(g)}, ${String(b)}, ${String(alpha)})`
}

export { mono }

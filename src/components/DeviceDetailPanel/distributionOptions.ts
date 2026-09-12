import type { Theme } from '@mui/material'
import type { Options } from 'highcharts'
import type { DeviceReport } from '@/lib'

export const BIN_COUNT = 12

/** Bin readings into a fixed number of buckets across their observed range. */
export function bins(device: DeviceReport): { midpoint: number; count: number; width: number; low: number }[] {
  const values = device.readings.map((reading) => reading.value)
  const low = Math.min(...values)
  const span = Math.max(...values) - low || 1
  const width = span / BIN_COUNT

  const counts = new Array<number>(BIN_COUNT).fill(0)
  for (const value of values) {
    const index = Math.min(BIN_COUNT - 1, Math.floor(((value - low) / span) * BIN_COUNT))
    counts[index] = (counts[index] ?? 0) + 1
  }

  return counts.map((count, index) => ({
    midpoint: Number((low + width * (index + 0.5)).toFixed(2)),
    count,
    width,
    low,
  }))
}

/** How a device's readings are spread, with the mean and reference marked. */
export function distributionOptions(device: DeviceReport, theme: Theme): Options {
  const unit = device.strategy.unit.trim()
  const data = bins(device)

  return {
    chart: { type: 'column', height: 268 },
    accessibility: {
      description:
        `Histogram of ${device.name} readings in ${String(BIN_COUNT)} bins, with markers for the ` +
        'mean and the reference value.',
      keyboardNavigation: { enabled: true },
    },
    xAxis: {
      title: { text: unit ? `reading value (${unit})` : 'reading value' },
      plotLines: [
        { value: device.stats.mean, color: theme.palette.text.primary, width: 1, zIndex: 5 },
        ...(device.reference === null
          ? []
          : [{ value: device.reference, color: theme.palette.primary.main, width: 1, dashStyle: 'Dash' as const, zIndex: 5 }]),
      ],
    },
    yAxis: { title: { text: 'count' }, allowDecimals: false },
    series: [
      {
        type: 'column',
        name: 'readings',
        // AA: the design's bar colour is 2.84:1 on paper and fails 1.4.11.
        color: theme.palette.outline,
        borderWidth: 0,
        pointPadding: 0.04,
        groupPadding: 0.02,
        data: data.map((bin) => [bin.midpoint, bin.count]),
      },
    ],
  }
}

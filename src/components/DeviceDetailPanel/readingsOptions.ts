import type { Theme } from '@mui/material'
import type { Options } from 'highcharts'
import { mono, tint } from '@/components/Chart/chartTheme'
import { Verdict } from '@/lib'
import type { DeviceReport } from '@/lib'

/** Readings over time, with the tolerance band the device is judged against. */
export function readingsOptions(device: DeviceReport, theme: Theme, is12HourClock: boolean): Options {
  const { readings, reference, stats, strategy, tolerance } = device
  const timeFormat = is12HourClock ? '%l:%M %p' : '%H:%M'
  const unit = strategy.unit.trim()
  const hasReference = reference !== null
  const isPerReading = strategy.isPerReading

  const points = readings.map((reading) => [Date.parse(`${reading.at}:00Z`), reading.value])
  const outside =
    isPerReading && hasReference
      ? readings
          .filter((reading) => Math.abs(reading.value - reference) > tolerance)
          .map((reading) => [Date.parse(`${reading.at}:00Z`), reading.value])
      : []

  // A per-reading sensor is judged against its tolerance band; a thermometer is
  // judged on the spread of the whole series, so ±1σ is the meaningful band.
  const band =
    isPerReading && hasReference
      ? { from: reference - tolerance, to: reference + tolerance, color: tint(theme.palette.primary.main, 0.13) }
      : { from: stats.mean - stats.sd, to: stats.mean + stats.sd, color: tint(theme.palette.verdict[Verdict.Precise], 0.16) }

  return {
    chart: { type: 'line', height: 280 },
    accessibility: {
      description:
        `${device.name} readings over time` +
        (hasReference ? ` against a reference of ${reference.toFixed(strategy.decimals)}` : '; no reference is registered for this sensor type') +
        (isPerReading && hasReference
          ? `, with a tolerance band of plus or minus ${tolerance.toFixed(2)}; ${String(device.outOfTolerance ?? 0)} of ${String(stats.count)} readings fall outside it.`
          : '. Judged on the mean and spread of the whole series, so the shaded band is plus or minus one standard deviation.'),
      keyboardNavigation: { enabled: true },
    },
    xAxis: {
      title: { text: 'time' },
      type: 'datetime',
      labels: { format: `{value:${timeFormat}}`, style: { fontFamily: mono(theme) } },
    },
    yAxis: {
      title: { text: unit ? `reading (${unit})` : 'reading' },
      startOnTick: false,
      endOnTick: false,
      plotBands: [band],
      plotLines: [
        ...(hasReference
          ? [{ value: reference, color: theme.palette.primary.main, width: 1, dashStyle: 'Dash' as const, zIndex: 3 }]
          : []),
        { value: stats.mean, color: theme.palette.text.primary, width: 1, zIndex: 3 },
      ],
    },
    tooltip: { xDateFormat: timeFormat, valueDecimals: strategy.decimals },
    series: [
      {
        type: 'spline',
        name: 'reading',
        color: theme.palette.text.secondary,
        lineWidth: 2,
        data: points,
        marker: { enabled: readings.length <= 120, radius: 3 },
      },
      ...(outside.length > 0
        ? [
            {
              type: 'scatter' as const,
              name: 'outside tolerance',
              color: theme.palette.verdict[Verdict.Discard],
              data: outside,
              marker: { radius: 5, symbol: 'circle' },
            },
          ]
        : []),
    ],
  }
}

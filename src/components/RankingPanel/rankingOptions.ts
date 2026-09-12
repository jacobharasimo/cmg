import type { Options, Point, PointOptionsObject } from 'highcharts'
import { mono } from '@/components/Chart/chartTheme'
import type { BarSpec } from './types'

/** Bars get taller lists more room, so labels never collide. */
export function rankingHeight(count: number): number {
  return Math.max(300, count * 28 + 90)
}

/**
 * The shape every ranking chart shares: a horizontal bar per device, sorted,
 * coloured by verdict.
 *
 * The variants differ only in what the bar measures and what is drawn on the
 * value axis — so they configure this rather than each rebuilding a chart.
 *
 * The selected device is marked across the full width of its row rather than
 * on the bar alone: a band behind it, an accent border, and a caret on its
 * category label. A bar outline would be invisible on a short bar.
 *
 * A bar is also a way to select that device, matching the table. It is a
 * convenience, not the only route: every device is selectable from the table,
 * which is a real button and fully keyboard-operable, so nothing here is
 * mouse-only in the sense WCAG 2.1.1 cares about.
 */
export function barRanking(spec: BarSpec): Options {
  const { devices, theme, selectedName, valueOf, axisLabel, labelOf, labelColorOf, describe, onSelect } =
    spec
  const sorted = [...devices].sort((a, b) => valueOf(a) - valueOf(b))
  const selectedIndex = sorted.findIndex((device) => device.name === selectedName)

  const data: PointOptionsObject[] = sorted.map((device) => ({
    y: Number(valueOf(device).toFixed(2)),
    name: device.name,
    color: theme.palette.verdict[device.verdict],
    ...(device.name === selectedName
      ? { borderColor: theme.palette.text.primary, borderWidth: 2 }
      : { borderWidth: 0 }),
    // Per point, so a failing device's label reads red.
    dataLabels: { color: labelColorOf(device) },
    custom: { label: labelOf(device), description: describe(device) },
  }))

  return {
    chart: { type: 'bar', height: rankingHeight(sorted.length), marginLeft: 96, marginRight: 24 },
    accessibility: {
      description: spec.accessibilityDescription,
      keyboardNavigation: { enabled: true },
      point: {
        descriptionFormatter: (point) =>
          String((point.options.custom as { description?: string } | undefined)?.description ?? point.name),
      },
    },
    xAxis: {
      categories: sorted.map((device) => device.name),
      reversed: true,
      // The selected row, marked across its whole width rather than on the bar.
      plotBands:
        selectedIndex < 0
          ? []
          : [
              {
                from: selectedIndex - 0.52,
                to: selectedIndex + 0.48,
                color: theme.palette.action.selected,
                borderColor: theme.palette.primary.main,
                borderWidth: 1,
                zIndex: 0,
              },
            ],
      labels: {
        useHTML: true,
        // Device names are the one axis worth reading at full contrast, and the
        // selected one carries a caret so the row is identifiable without colour.
        formatter() {
          const isSelected = this.value === selectedName
          const colour = isSelected ? theme.palette.primary.main : theme.palette.text.primary
          const weight = isSelected ? theme.typography.fontWeightBold : theme.typography.fontWeightRegular
          return `<span style="font-family:${mono(theme)};color:${colour};font-weight:${String(weight)}">${
            isSelected ? '▸ ' : ''
          }${String(this.value)}</span>`
        },
      },
    },
    yAxis: {
      title: { text: axisLabel },
      min: 0,
      maxPadding: 0.3,
      plotBands: spec.bands?.plotBands ?? [],
      plotLines: (spec.bands?.plotLines ?? []).map((line) => ({ ...line, width: 1, zIndex: 4 })),
    },
    plotOptions: {
      bar: {
        cursor: 'pointer',
        point: {
          events: {
            // Highcharts also routes its own keyboard activation through this
            // event, but that path is unverified here and is not relied on —
            // the table is the keyboard route to the same selection.
            click(this: Point) {
              onSelect(this.name)
            },
          },
        },
        borderWidth: 0,
        pointPadding: 0.08,
        groupPadding: 0.04,
        dataLabels: {
          enabled: true,
          align: 'left',
          inside: false,
          crop: false,
          overflow: 'allow',
          // No `color` here — each point sets its own, above.
          style: { textOutline: 'none', fontFamily: mono(theme), fontWeight: '500' },
          formatter() {
            // `this` is the Point in a dataLabels formatter.
            const custom = this.options.custom as { label?: string } | undefined
            return custom?.label ?? ''
          },
        },
      },
    },
    series: [{ type: 'bar', name: axisLabel, data }],
  }
}

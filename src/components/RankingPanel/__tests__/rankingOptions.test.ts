import { describe, expect, it, vi } from 'vitest'
import { SensorType, Verdict } from '@/lib'
import type { DeviceReport } from '@/lib'
import { createAppTheme } from '@/theme'
import { barRanking, rankingHeight } from '../rankingOptions'

// Isolation: the mono stack has its own test; a sentinel proves it is applied.
vi.mock('@/components/Chart/chartTheme', () => ({ mono: () => 'mono-stack' }))

const theme = createAppTheme()

const device = (name: string, value: number, verdict = Verdict.Keep): DeviceReport =>
  ({ name, type: SensorType.Humidity, verdict, stats: { sd: value } }) as unknown as DeviceReport

const onSelect = vi.fn()

const spec = (devices: readonly DeviceReport[], selectedName: string | null = null) => ({
  devices,
  theme,
  selectedName,
  onSelect,
  valueOf: (d: DeviceReport) => d.stats.sd,
  axisLabel: 'sigma',
  labelOf: (d: DeviceReport) => `${d.name} label`,
  labelColorOf: (d: DeviceReport) => `${d.name} colour`,
  describe: (d: DeviceReport) => `${d.name} description`,
  accessibilityDescription: 'the whole chart',
})

describe('rankingHeight', () => {
  it('grows with the number of devices, so labels never collide', () => {
    expect(rankingHeight(20)).toBeGreaterThan(rankingHeight(5))
  })

  it('never drops below a readable minimum', () => {
    expect(rankingHeight(0)).toBe(300)
    expect(rankingHeight(1)).toBe(300)
  })
})

describe('barRanking', () => {
  const devices = [device('c', 3), device('a', 1), device('b', 2)]

  it('sorts ascending by the measured value, not by name', () => {
    const options = barRanking(spec(devices))
    const series = options.series?.[0] as { data: { name: string }[] }

    expect(series.data.map((point) => point.name)).toEqual(['a', 'b', 'c'])
  })

  it('rounds values to two decimals', () => {
    const options = barRanking(spec([device('a', 1.23456)]))
    const series = options.series?.[0] as { data: { y: number }[] }

    expect(series.data[0]?.y).toBe(1.23)
  })

  it('colours each bar by its verdict', () => {
    const options = barRanking(spec([device('a', 1, Verdict.Discard)]))
    const series = options.series?.[0] as { data: { color: string }[] }

    expect(series.data[0]?.color).toBe(theme.palette.verdict[Verdict.Discard])
  })

  it('outlines only the selected bar', () => {
    const options = barRanking(spec(devices, 'b'))
    const series = options.series?.[0] as { data: { name: string; borderWidth: number }[] }

    expect(series.data.find((p) => p.name === 'b')?.borderWidth).toBe(2)
    expect(series.data.find((p) => p.name === 'a')?.borderWidth).toBe(0)
  })

  it('colours each label per point, so a failing device reads red', () => {
    const options = barRanking(spec([device('a', 1)]))
    const series = options.series?.[0] as { data: { dataLabels: { color: string } }[] }

    expect(series.data[0]?.dataLabels.color).toBe('a colour')
  })

  it('bands the selected row across its full width, not just the bar', () => {
    const xAxis = barRanking(spec(devices, 'b')).xAxis as {
      plotBands: { from: number; to: number; borderColor: string }[]
    }

    // 'b' sorts to index 1; the band spans that row.
    expect(xAxis.plotBands[0]).toMatchObject({ from: 0.48, to: 1.48 })
    expect(xAxis.plotBands[0]?.borderColor).toBe(theme.palette.primary.main)
  })

  it('draws no band when nothing is selected', () => {
    const xAxis = barRanking(spec(devices)).xAxis as { plotBands: unknown[] }

    expect(xAxis.plotBands).toEqual([])
  })

  it('carries a per-point description for screen readers', () => {
    const options = barRanking(spec([device('a', 1)]))
    const series = options.series?.[0] as { data: { custom: { description: string } }[] }

    expect(series.data[0]?.custom.description).toBe('a description')
  })

  it('describes the chart as a whole', () => {
    expect(barRanking(spec(devices)).accessibility?.description).toBe('the whole chart')
  })

  it('titles the value axis and leaves the category axis untitled', () => {
    const options = barRanking(spec(devices))

    expect((options.yAxis as { title: { text: string } }).title.text).toBe('sigma')
    expect(options.xAxis).not.toHaveProperty('title')
  })

  it('reverses the category axis so the smallest value reads first', () => {
    expect((barRanking(spec(devices)).xAxis as { reversed: boolean }).reversed).toBe(true)
  })

  it('draws no threshold bands unless given some', () => {
    const yAxis = barRanking(spec(devices)).yAxis as { plotBands: unknown[]; plotLines: unknown[] }

    expect(yAxis.plotBands).toEqual([])
    expect(yAxis.plotLines).toEqual([])
  })

  it('applies threshold bands and lines when given them', () => {
    const options = barRanking({
      ...spec(devices),
      bands: {
        plotBands: [{ from: 0, to: 1, color: 'green' }],
        plotLines: [{ value: 1, color: 'red' }],
      },
    })
    const yAxis = options.yAxis as { plotBands: unknown[]; plotLines: { width: number }[] }

    expect(yAxis.plotBands).toHaveLength(1)
    expect(yAxis.plotLines[0]).toMatchObject({ value: 1, color: 'red', width: 1 })
  })

  describe('category labels', () => {
    const labelFor = (name: string, selectedName: string | null = null): string => {
      const xAxis = barRanking(spec(devices, selectedName)).xAxis as {
        labels: { formatter: (this: { value: string }) => string }
      }
      return xAxis.labels.formatter.call({ value: name })
    }

    it('sets them in the monospace stack', () => {
      expect(labelFor('a')).toContain('mono-stack')
    })

    it('marks the selected device with a caret, not colour alone', () => {
      expect(labelFor('b', 'b')).toContain('▸')
    })

    it('leaves every other label unmarked', () => {
      expect(labelFor('a', 'b')).not.toContain('▸')
    })

    it('renders the device name', () => {
      expect(labelFor('hum-1')).toContain('hum-1')
    })
  })

  it('sizes the chart from the number of devices', () => {
    expect(barRanking(spec(devices)).chart?.height).toBe(rankingHeight(3))
  })

  /*
    A bar selects its device, matching the table. Highcharts fires the same
    `click` for a mouse press and for Enter on a keyboard-focused point, so one
    handler covers both and we write no key handling.
  */
  describe('selecting from a bar', () => {
    it('selects the device the point belongs to', () => {
      const options = barRanking(spec(devices))
      const click = options.plotOptions?.bar?.point?.events?.click

      click?.call({ name: 'b' } as never, {} as never)

      expect(onSelect).toHaveBeenCalledExactlyOnceWith('b')
    })

    it('marks the bars as pointer targets, so they look selectable', () => {
      expect(barRanking(spec(devices)).plotOptions?.bar?.cursor).toBe('pointer')
    })
  })
})

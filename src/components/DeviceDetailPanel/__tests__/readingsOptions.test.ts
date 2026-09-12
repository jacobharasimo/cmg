import { describe, expect, it } from 'vitest'
import { SensorType, Verdict } from '@/lib'
import type { DeviceReport } from '@/lib'
import { createAppTheme } from '@/theme'
import { readingsOptions } from '../readingsOptions'
import type { Overrides } from './types'

const theme = createAppTheme()

const device = ({
  isPerReading = true,
  reference = 45,
  values = [45, 44, 48],
  tolerance = 1,
}: Overrides = {}): DeviceReport =>
  ({
    name: 'hum-1',
    type: SensorType.Humidity,
    verdict: Verdict.Keep,
    reference,
    tolerance,
    outOfTolerance: 1,
    readings: values.map((value, i) => ({ at: `2007-04-05T22:0${String(i)}`, value })),
    stats: { mean: 45, sd: 1, count: values.length },
    strategy: { unit: '%', decimals: 1, isPerReading, label: 'Humidity' },
  }) as unknown as DeviceReport

describe('readingsOptions', () => {
  it('plots readings over time', () => {
    const options = readingsOptions(device(), theme, false)

    expect(options.chart?.type).toBe('line')
    expect((options.xAxis as { type: string }).type).toBe('datetime')
  })

  it('adds a second series marking readings outside tolerance', () => {
    const series = readingsOptions(device(), theme, false).series ?? []

    expect(series).toHaveLength(2)
    expect((series[1] as { name: string }).name).toBe('outside tolerance')
  })

  it('omits that series when every reading is inside tolerance', () => {
    expect(readingsOptions(device({ values: [45, 45, 45] }), theme, false).series).toHaveLength(1)
  })

  it('omits it for a type judged on the series rather than each reading', () => {
    expect(readingsOptions(device({ isPerReading: false }), theme, false).series).toHaveLength(1)
  })

  it('bands the tolerance around the reference for a per-reading type', () => {
    const yAxis = readingsOptions(device(), theme, false).yAxis as {
      plotBands: { from: number; to: number }[]
    }

    expect(yAxis.plotBands[0]).toMatchObject({ from: 44, to: 46 })
  })

  it('bands ±1σ instead when the whole series is judged', () => {
    const yAxis = readingsOptions(device({ isPerReading: false }), theme, false).yAxis as {
      plotBands: { from: number; to: number }[]
    }

    expect(yAxis.plotBands[0]).toMatchObject({ from: 44, to: 46 })
  })

  it('draws reference and mean lines when a reference exists', () => {
    const yAxis = readingsOptions(device(), theme, false).yAxis as { plotLines: unknown[] }

    expect(yAxis.plotLines).toHaveLength(2)
  })

  it('draws only the mean line when no reference is registered', () => {
    const yAxis = readingsOptions(device({ reference: null }), theme, false).yAxis as {
      plotLines: unknown[]
    }

    expect(yAxis.plotLines).toHaveLength(1)
  })

  it('switches the time format with the 12-hour toggle', () => {
    const twelve = readingsOptions(device(), theme, true).xAxis as { labels: { format: string } }
    const twentyFour = readingsOptions(device(), theme, false).xAxis as { labels: { format: string } }

    expect(twelve.labels.format).toContain('%p')
    expect(twentyFour.labels.format).not.toContain('%p')
  })

  it('says how many readings fell outside tolerance, for screen readers', () => {
    const { accessibility } = readingsOptions(device(), theme, false)

    expect(accessibility?.description).toContain('1 of 3 readings fall outside it')
  })

  it('says so when the sensor type has no reference at all', () => {
    const { accessibility } = readingsOptions(device({ reference: null }), theme, false)

    expect(accessibility?.description).toContain('no reference is registered')
  })

  it('hides markers on a dense series so the line stays readable', () => {
    const many = Array.from({ length: 200 }, () => 45)
    const series = readingsOptions(device({ values: many }), theme, false).series?.[0] as {
      marker: { enabled: boolean }
    }

    expect(series.marker.enabled).toBe(false)
  })
})

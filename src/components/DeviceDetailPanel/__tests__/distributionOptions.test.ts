import { describe, expect, it } from 'vitest'
import { SensorType } from '@/lib'
import type { DeviceReport } from '@/lib'
import { createAppTheme } from '@/theme'
import { BIN_COUNT, bins, distributionOptions } from '../distributionOptions'

const theme = createAppTheme()

const device = (values: number[], reference: number | null = 45): DeviceReport =>
  ({
    name: 'hum-1',
    type: SensorType.Humidity,
    reference,
    readings: values.map((value, i) => ({ at: `2007-04-05T22:0${String(i)}`, value })),
    stats: { mean: values.reduce((a, b) => a + b, 0) / values.length },
    strategy: { unit: '%', decimals: 1 },
  }) as unknown as DeviceReport

describe('bins', () => {
  it('always produces a fixed number of buckets', () => {
    expect(bins(device([1, 2, 3]))).toHaveLength(BIN_COUNT)
  })

  it('counts every reading exactly once', () => {
    const values = [1, 2, 2, 3, 3, 3, 4]
    const total = bins(device(values)).reduce((sum, bin) => sum + bin.count, 0)

    expect(total).toBe(values.length)
  })

  it('puts the maximum reading in the last bucket rather than overflowing', () => {
    expect(bins(device([0, 10])).at(-1)?.count).toBe(1)
  })

  it('survives every reading being identical', () => {
    const result = bins(device([5, 5, 5]))

    expect(result.reduce((sum, bin) => sum + bin.count, 0)).toBe(3)
  })

  it('reports bucket midpoints, which is what the chart plots', () => {
    const [first] = bins(device([0, 12]))

    expect(first?.midpoint).toBeCloseTo(0.5, 5)
  })
})

describe('distributionOptions', () => {
  it('is a column chart', () => {
    expect(distributionOptions(device([1, 2, 3]), theme).chart?.type).toBe('column')
  })

  it('uses the AA-safe outline colour for bars, not the design’s failing one', () => {
    const series = distributionOptions(device([1, 2, 3]), theme).series?.[0] as { color: string }

    expect(series.color).toBe(theme.palette.outline)
  })

  it('marks the mean, and the reference when one exists', () => {
    const xAxis = distributionOptions(device([44, 45, 46]), theme).xAxis as {
      plotLines: { value: number }[]
    }

    expect(xAxis.plotLines.map((line) => line.value)).toEqual([45, 45])
  })

  it('marks only the mean when there is no reference', () => {
    const xAxis = distributionOptions(device([1, 2, 3], null), theme).xAxis as {
      plotLines: unknown[]
    }

    expect(xAxis.plotLines).toHaveLength(1)
  })

  it('names the unit on the value axis', () => {
    const xAxis = distributionOptions(device([1, 2]), theme).xAxis as { title: { text: string } }

    expect(xAxis.title.text).toBe('reading value (%)')
  })

  it('counts whole readings, so the count axis takes no decimals', () => {
    const yAxis = distributionOptions(device([1, 2]), theme).yAxis as { allowDecimals: boolean }

    expect(yAxis.allowDecimals).toBe(false)
  })

  it('describes itself for screen readers', () => {
    const { accessibility } = distributionOptions(device([1, 2]), theme)

    expect(accessibility?.description).toContain('Histogram of hum-1 readings')
  })
})

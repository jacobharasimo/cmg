import { describe, expect, it, vi } from 'vitest'
import { ReferenceKey, SensorType } from '../../types'

/*
  Isolation: the keep/discard rule belongs to `perReadingStrategy` and has its
  own test. This file's whole job is the configuration it hands over, so the
  factory is mocked and the config is what gets asserted.
*/
vi.mock('../perReading', () => ({ perReadingStrategy: vi.fn((config: unknown) => config) }))

const { humidity } = await import('../humidity')

describe('humidity', () => {
  it('judges the humidity type against the humidity reference and threshold', () => {
    expect(humidity).toEqual({
      type: SensorType.Humidity,
      shortLabel: 'Humidity',
      label: 'Humidity',
      unit: '%',
      referenceKey: ReferenceKey.Humidity,
      decimals: 1,
      thresholdKey: 'humidity',
    })
  })

  // A ratio, not a dimension — there is no second unit to convert to.
  it('declares no conversion', () => {
    expect(humidity).not.toHaveProperty('convert')
  })
})

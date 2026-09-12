import { describe, expect, it, vi } from 'vitest'
import { ReferenceKey, SensorType } from '../../types'

// Isolation: see `humidity.test.ts` — the rule is the factory's, the config is this file's.
vi.mock('../perReading', () => ({ perReadingStrategy: vi.fn((config: unknown) => config) }))

const { monoxide } = await import('../monoxide')

describe('monoxide', () => {
  it('judges the monoxide type against the monoxide reference and threshold', () => {
    expect(monoxide).toEqual({
      type: SensorType.Monoxide,
      /*
        "CO", not the design canvas's "CO2". CO2 is carbon dioxide; this sensor
        measures carbon monoxide (assignment p.3), and mislabelling a gas
        detector is not a copy decision worth honouring. It is also shorter,
        which was the reason the canvas abbreviated it.
      */
      shortLabel: 'CO',
      label: 'CO detector',
      unit: ' ppm',
      referenceKey: ReferenceKey.Monoxide,
      decimals: 0,
      thresholdKey: 'monoxide',
    })
  })

  /*
    Readings are whole parts per million (assignment p.3), so no decimal place
    is shown — a CO reading of "5.0 ppm" would imply precision the sensor does
    not report.
  */
  it('renders readings as whole numbers', () => {
    expect(monoxide).toMatchObject({ decimals: 0 })
  })
})

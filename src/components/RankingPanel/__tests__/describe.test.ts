import { describe as describeSuite, expect, it } from 'vitest'
import { SensorType, Verdict } from '@/lib'
import { createAppTheme } from '@/theme'
import { describe } from '../describe'

const { verdict } = createAppTheme().palette
const thresholds = { thermometerSdUltra: 3, thermometerSdVery: 5 }

describeSuite('describe', () => {
  describeSuite('an unregistered type', () => {
    const result = describe('lux', undefined, null, thresholds, verdict)

    it('names the type it could not recognise', () => {
      expect(result.title).toBe('Unrecognised sensor type: lux')
    })

    it('explains that this is an absence of criteria, not a failure', () => {
      expect(result.blurb).toContain('reports these devices as unclassified')
    })

    it('offers one legend entry, since no threshold is drawn', () => {
      expect(result.legend).toEqual([
        { label: 'unclassified — no rule registered', color: verdict[Verdict.Unclassified] },
      ])
    })
  })

  describeSuite('a thermometer', () => {
    const result = describe('thermometer', 'Thermometer', SensorType.Thermometer, thresholds, verdict)

    it('titles the chart for precision ranking', () => {
      expect(result.title).toBe('Thermometer precision, ranked')
    })

    it('explains that failing the mean rule caps the verdict', () => {
      expect(result.blurb).toContain('failed the mean rule')
    })

    it('lists the three precision grades with their current σ ceilings', () => {
      expect(result.legend.map((entry) => entry.label)).toEqual([
        'ultra precise — σ < 3',
        'very precise — σ < 5',
        'precise — fallback',
      ])
    })

    it('reflects moved thresholds in the legend', () => {
      const moved = describe('thermometer', 'Thermometer', SensorType.Thermometer, { thermometerSdUltra: 1.5, thermometerSdVery: 9 }, verdict)

      expect(moved.legend[0]?.label).toBe('ultra precise — σ < 1.5')
    })
  })

  describeSuite('a per-reading type', () => {
    const result = describe('humidity', 'Humidity', SensorType.Humidity, thresholds, verdict)

    it('titles the chart with the strategy label', () => {
      expect(result.title).toBe('Humidity devices, ranked')
    })

    it('explains that one bad reading is enough to discard', () => {
      expect(result.blurb).toContain('one bad reading is enough')
    })

    it('lists only keep and discard', () => {
      expect(result.legend.map((entry) => entry.color)).toEqual([
        verdict[Verdict.Keep],
        verdict[Verdict.Discard],
      ])
    })

    it('falls back to the raw type when no label is registered', () => {
      expect(describe('noise', undefined, SensorType.Noise, thresholds, verdict).title).toBe(
        'noise devices, ranked',
      )
    })
  })
})

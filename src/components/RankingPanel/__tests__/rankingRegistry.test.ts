import { describe, expect, it } from 'vitest'
import { SensorType } from '@/lib'
import { SigmaBandsRanking, ToleranceRanking } from '../rankingCharts'
import { RANKING_CHARTS } from '../rankingRegistry'

describe('RANKING_CHARTS', () => {
  it('has a chart for every member of the SensorType enum', () => {
    expect(Object.keys(RANKING_CHARTS).sort()).toEqual(Object.values(SensorType).sort())
  })

  it('gives thermometers the sigma-band chart, because they are judged on σ', () => {
    expect(RANKING_CHARTS[SensorType.Thermometer]).toBe(SigmaBandsRanking)
  })

  it.each([SensorType.Humidity, SensorType.Monoxide, SensorType.Noise])(
    'gives %s the tolerance chart, because it is judged per reading',
    (type) => {
      expect(RANKING_CHARTS[type]).toBe(ToleranceRanking)
    },
  )

  it('is frozen, so the registry cannot be mutated at runtime', () => {
    expect(Object.isFrozen(RANKING_CHARTS)).toBe(true)
  })
})

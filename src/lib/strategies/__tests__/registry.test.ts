import { describe, expect, it } from 'vitest'
import { SensorType } from '../../types'
import { STRATEGIES, isSensorType, strategyFor } from '../registry'
import { unregistered } from '../unregistered'

describe('STRATEGIES', () => {
  it('registers exactly one strategy for every member of the SensorType enum', () => {
    expect(Object.keys(STRATEGIES).sort()).toEqual(Object.values(SensorType).sort())
  })

  it('gives each strategy the type it is registered under', () => {
    for (const [type, strategy] of Object.entries(STRATEGIES)) {
      expect(strategy.type).toBe(type)
    }
  })

  it('is frozen, so the registry cannot be mutated at runtime', () => {
    expect(Object.isFrozen(STRATEGIES)).toBe(true)
  })
})

describe('isSensorType', () => {
  it.each(Object.values(SensorType))('accepts the registered type %s', (type) => {
    expect(isSensorType(type)).toBe(true)
  })

  it.each(['lux', 'Thermometer', '', 'noise '])('rejects the unregistered type %o', (value) => {
    expect(isSensorType(value)).toBe(false)
  })
})

describe('strategyFor', () => {
  it('returns the registered strategy for a known type', () => {
    expect(strategyFor(SensorType.Humidity)).toBe(STRATEGIES[SensorType.Humidity])
  })

  it('falls back to the report-only strategy for an unknown type', () => {
    expect(strategyFor('lux')).toBe(unregistered)
  })
})

import { describe, expect, it } from 'vitest'
import { FilterScope } from '@/hooks'
import { SensorType, STRATEGIES } from '@/lib'
import type { DeviceReport } from '@/lib'
import { filterOptions } from '../filterOptions'

const device = (type: SensorType | null): DeviceReport =>
  ({ strategy: { type }, isRegistered: type !== null }) as unknown as DeviceReport

describe('filterOptions', () => {
  it('always offers All first', () => {
    expect(filterOptions([])[0]).toEqual({ value: FilterScope.All, label: 'All' })
  })

  it('offers only the sensor types present in the batch', () => {
    const options = filterOptions([device(SensorType.Humidity), device(SensorType.Monoxide)])

    expect(options.map((option) => option.label)).toEqual(['All', 'Humidity', 'CO'])
  })

  it('offers Unknown when a device has no registered strategy', () => {
    const options = filterOptions([device(SensorType.Humidity), device(null)])

    expect(options.map((option) => option.label)).toEqual(['All', 'Humidity', 'Unknown'])
  })

  it('omits Unknown when every device is registered', () => {
    expect(filterOptions([device(SensorType.Noise)]).map((o) => o.label)).not.toContain('Unknown')
  })

  it('lists sensor types in enum order, not batch order', () => {
    const options = filterOptions([device(SensorType.Noise), device(SensorType.Thermometer)])

    expect(options.map((option) => option.label)).toEqual(['All', 'Thermometer', 'Noise'])
  })

  /*
    The chip names come from each sensor's own `shortLabel`, not a list kept
    beside this function. A second list is a second place to edit when a sensor
    type is added, and the compiler cannot see that two lists disagree.
  */
  it('takes its names from the sensor strategies, not a local list', () => {
    const labels = filterOptions([device(SensorType.Monoxide)]).map((option) => option.label)

    expect(labels).toContain(STRATEGIES[SensorType.Monoxide].shortLabel)
  })
})

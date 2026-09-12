import { FilterScope } from '@/hooks'
import { SensorType, STRATEGIES, unregistered } from '@/lib'
import type { DeviceReport } from '@/lib'
import type { DeviceFilterOption } from './types'

/**
 * The filter chips this batch should offer.
 *
 * Only a filter that would match something is shown, so a log without CO
 * devices gets no CO chip.
 *
 * Names come from each sensor's own `shortLabel` rather than a list kept here.
 * A second list would be a second place to edit when a sensor type is added,
 * and the compiler cannot tell that two lists disagree — it can only tell that
 * a registry is missing an entry.
 */
export function filterOptions(devices: readonly DeviceReport[]): readonly DeviceFilterOption[] {
  const options: DeviceFilterOption[] = [{ value: FilterScope.All, label: 'All' }]

  for (const type of Object.values(SensorType)) {
    if (devices.some((device) => device.strategy.type === type)) {
      options.push({ value: type, label: STRATEGIES[type].shortLabel })
    }
  }

  if (devices.some((device) => !device.isRegistered)) {
    options.push({ value: FilterScope.Unregistered, label: unregistered.shortLabel })
  }

  return options
}

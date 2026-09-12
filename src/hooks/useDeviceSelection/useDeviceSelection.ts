import { useCallback, useMemo, useState } from 'react'
import type { DeviceReport } from '@/lib'
import { FilterScope, SortDirection, SortKey } from './types'
import type { DeviceFilter, UseDeviceSelectionResult } from './types'

/** The value each sort key compares on. */
const sortValue = (device: DeviceReport, key: SortKey): string | number => {
  switch (key) {
    case SortKey.Name:
      return device.name
    case SortKey.Type:
      return device.strategy.label
    case SortKey.Verdict:
      return device.verdict
    case SortKey.Mean:
      return device.stats.mean
    case SortKey.Deviation:
      // Devices with no reference sort below every measured one.
      return device.stats.meanDeviation ?? -1
    case SortKey.Sd:
      return device.stats.sd
    case SortKey.OutOfTolerance:
      return device.outOfTolerance ?? -1
    case SortKey.Readings:
      return device.stats.count
  }
}

const matches = (device: DeviceReport, filter: DeviceFilter): boolean => {
  if (filter === FilterScope.All) return true
  if (filter === FilterScope.Unregistered) return !device.isRegistered
  // Compare on the strategy's typed member so both sides share the enum.
  return device.strategy.type === filter
}

/**
 * Sorting, filtering and selection for the device table.
 *
 * Purely view state: it reorders and narrows the report it is handed and never
 * re-evaluates anything, so moving a threshold and sorting a column stay
 * independent of each other.
 *
 * A selection survives re-sorting and re-filtering — a device hidden by the
 * current filter stays selected — but falls back to the first visible device
 * when a newly loaded log no longer contains it. Sorting a new column starts
 * ascending; sorting the same column again reverses it.
 */
export const useDeviceSelection = (devices: readonly DeviceReport[]): UseDeviceSelectionResult => {
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>(SortKey.Name)
  const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.Asc)
  const [filter, setFilter] = useState<DeviceFilter>(FilterScope.All)

  const visible = useMemo(() => {
    const direction = sortDirection === SortDirection.Asc ? 1 : -1

    return devices
      .filter((device) => matches(device, filter))
      .slice()
      .sort((a, b) => {
        const left = sortValue(a, sortKey)
        const right = sortValue(b, sortKey)
        const order =
          typeof left === 'string' && typeof right === 'string'
            ? left.localeCompare(right)
            : Number(left) - Number(right)
        return order * direction
      })
  }, [devices, filter, sortDirection, sortKey])

  // A selection survives re-sorting and re-filtering, but not a new log.
  const selected = useMemo(
    () => devices.find((device) => device.name === selectedName) ?? visible[0] ?? null,
    [devices, selectedName, visible],
  )

  const sortBy = useCallback((key: SortKey) => {
    setSortKey((currentKey) => {
      setSortDirection((currentDirection) =>
        currentKey === key && currentDirection === SortDirection.Asc
          ? SortDirection.Desc
          : SortDirection.Asc,
      )
      return key
    })
  }, [])

  const filterBy = useCallback((next: DeviceFilter) => {
    setFilter(next)
  }, [])

  return {
    devices: visible,
    selected,
    sortKey,
    sortDirection,
    filter,
    select: setSelectedName,
    sortBy,
    filterBy,
  }
}

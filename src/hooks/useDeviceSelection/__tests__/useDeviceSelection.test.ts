import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SensorType, Verdict } from '@/lib'
import type { DeviceReport } from '@/lib'
import { FilterScope, SortKey } from '../types'
import { useDeviceSelection } from '../useDeviceSelection'

/** Minimal stand-ins — this hook only reads a handful of fields. */
function device(
  name: string,
  type: SensorType | null,
  overrides: { mean?: number; sd?: number; count?: number; out?: number | null } = {},
): DeviceReport {
  const { mean = 70, sd = 1, count = 10, out = 0 } = overrides
  return {
    name,
    type: type ?? 'lux',
    isRegistered: type !== null,
    strategy: { type, label: type ?? 'Unrecognised' },
    verdict: Verdict.Keep,
    stats: { mean, sd, count, meanDeviation: type === null ? null : 0.2 },
    outOfTolerance: out,
  } as unknown as DeviceReport
}

const devices = [
  device('temp-2', SensorType.Thermometer, { sd: 3, count: 30 }),
  device('hum-1', SensorType.Humidity, { sd: 1, count: 10 }),
  device('lux-1', null, { sd: 2, count: 20 }),
]

describe('useDeviceSelection', () => {
  it('sorts by name ascending to begin with', () => {
    const { result } = renderHook(() => useDeviceSelection(devices))

    expect(result.current.devices.map((d) => d.name)).toEqual(['hum-1', 'lux-1', 'temp-2'])
  })

  it('selects the first visible device when nothing is chosen', () => {
    const { result } = renderHook(() => useDeviceSelection(devices))

    expect(result.current.selected?.name).toBe('hum-1')
  })

  it('selects a device by name', () => {
    const { result } = renderHook(() => useDeviceSelection(devices))

    act(() => {
      result.current.select('temp-2')
    })

    expect(result.current.selected?.name).toBe('temp-2')
  })

  it('toggles direction when the same column is sorted twice', () => {
    const { result } = renderHook(() => useDeviceSelection(devices))

    act(() => {
      result.current.sortBy(SortKey.Name)
    })
    expect(result.current.sortDirection).toBe('desc')
    expect(result.current.devices.map((d) => d.name)).toEqual(['temp-2', 'lux-1', 'hum-1'])
  })

  it('returns to ascending when a different column is sorted', () => {
    const { result } = renderHook(() => useDeviceSelection(devices))

    act(() => {
      result.current.sortBy(SortKey.Name)
    })
    act(() => {
      result.current.sortBy(SortKey.Sd)
    })

    expect(result.current.sortDirection).toBe('asc')
    expect(result.current.devices.map((d) => d.name)).toEqual(['hum-1', 'lux-1', 'temp-2'])
  })

  it('sorts unmeasured devices below measured ones on deviation', () => {
    const { result } = renderHook(() => useDeviceSelection(devices))

    act(() => {
      result.current.sortBy(SortKey.Deviation)
    })

    expect(result.current.devices[0]?.name).toBe('lux-1')
  })

  it('filters to one sensor type', () => {
    const { result } = renderHook(() => useDeviceSelection(devices))

    act(() => {
      result.current.filterBy(SensorType.Humidity)
    })

    expect(result.current.devices.map((d) => d.name)).toEqual(['hum-1'])
  })

  it('filters to devices with no registered strategy', () => {
    const { result } = renderHook(() => useDeviceSelection(devices))

    act(() => {
      result.current.filterBy(FilterScope.Unregistered)
    })

    expect(result.current.devices.map((d) => d.name)).toEqual(['lux-1'])
  })

  it('shows every device again when the filter is cleared', () => {
    const { result } = renderHook(() => useDeviceSelection(devices))

    act(() => {
      result.current.filterBy(SensorType.Humidity)
    })
    act(() => {
      result.current.filterBy(FilterScope.All)
    })

    expect(result.current.devices).toHaveLength(3)
  })

  it('keeps a selection that the current filter hides', () => {
    const { result } = renderHook(() => useDeviceSelection(devices))

    act(() => {
      result.current.select('temp-2')
    })
    act(() => {
      result.current.filterBy(SensorType.Humidity)
    })

    expect(result.current.selected?.name).toBe('temp-2')
  })

  it('falls back to the first visible device when the selection is gone', () => {
    const { result, rerender } = renderHook(({ list }) => useDeviceSelection(list), {
      initialProps: { list: devices },
    })

    act(() => {
      result.current.select('temp-2')
    })
    rerender({ list: [devices[1]!] })

    expect(result.current.selected?.name).toBe('hum-1')
  })

  it('returns null when there are no devices at all', () => {
    const { result } = renderHook(() => useDeviceSelection([]))

    expect(result.current.selected).toBeNull()
  })
})

import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_THRESHOLDS, evaluateBatch } from '@/lib'
import type * as LibModule from '@/lib'
import type { BatchReport } from '@/lib'
import { useDeviceReport } from '../useDeviceReport'

// Isolation: the hook's job is memoisation and delegation, not classification.
vi.mock('@/lib', async (importOriginal) => ({
  ...(await importOriginal<typeof LibModule>()),
  evaluateBatch: vi.fn(),
}))

const mockedEvaluate = vi.mocked(evaluateBatch)
const report = { devices: [], counts: {}, lines: 0 } as unknown as BatchReport

describe('useDeviceReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedEvaluate.mockReturnValue(report)
  })

  it('delegates to evaluateBatch with the text and thresholds it is given', () => {
    renderHook(() => useDeviceReport('log text', DEFAULT_THRESHOLDS))

    expect(mockedEvaluate).toHaveBeenCalledExactlyOnceWith('log text', DEFAULT_THRESHOLDS)
  })

  it('returns the report unchanged', () => {
    const { result } = renderHook(() => useDeviceReport('log text', DEFAULT_THRESHOLDS))

    expect(result.current).toBe(report)
  })

  it('does not re-evaluate when nothing changed', () => {
    const { rerender } = renderHook(() => useDeviceReport('log text', DEFAULT_THRESHOLDS))
    rerender()

    expect(mockedEvaluate).toHaveBeenCalledTimes(1)
  })

  it('re-evaluates when the log changes', () => {
    const { rerender } = renderHook(({ text }) => useDeviceReport(text, DEFAULT_THRESHOLDS), {
      initialProps: { text: 'first' },
    })
    rerender({ text: 'second' })

    expect(mockedEvaluate).toHaveBeenCalledTimes(2)
  })

  it('re-evaluates when a threshold moves', () => {
    const { rerender } = renderHook(({ thresholds }) => useDeviceReport('log', thresholds), {
      initialProps: { thresholds: DEFAULT_THRESHOLDS },
    })
    rerender({ thresholds: { ...DEFAULT_THRESHOLDS, humidity: 2 } })

    expect(mockedEvaluate).toHaveBeenCalledTimes(2)
  })
})

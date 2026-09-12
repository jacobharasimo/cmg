import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DEFAULT_THRESHOLDS } from '@/lib'
import { useThresholds } from '../useThresholds'

describe('useThresholds', () => {
  it('starts at the spec defaults and unmodified', () => {
    const { result } = renderHook(() => useThresholds())

    expect(result.current.thresholds).toEqual(DEFAULT_THRESHOLDS)
    expect(result.current.isModified).toBe(false)
  })

  it('sets one threshold without disturbing the others', () => {
    const { result } = renderHook(() => useThresholds())

    act(() => {
      result.current.set('humidity', 2.5)
    })

    expect(result.current.thresholds.humidity).toBe(2.5)
    expect(result.current.thresholds.monoxide).toBe(DEFAULT_THRESHOLDS.monoxide)
  })

  it('reports itself modified once a value differs from the defaults', () => {
    const { result } = renderHook(() => useThresholds())

    act(() => {
      result.current.set('monoxide', 5)
    })

    expect(result.current.isModified).toBe(true)
  })

  it('is unmodified again when a value is set back to its default', () => {
    const { result } = renderHook(() => useThresholds())

    act(() => {
      result.current.set('monoxide', 5)
    })
    act(() => {
      result.current.set('monoxide', DEFAULT_THRESHOLDS.monoxide)
    })

    expect(result.current.isModified).toBe(false)
  })

  it('resets every value back to the spec defaults', () => {
    const { result } = renderHook(() => useThresholds())

    act(() => {
      result.current.set('humidity', 3)
      result.current.set('thermometerMean', 1.5)
    })
    act(() => {
      result.current.reset()
    })

    expect(result.current.thresholds).toEqual(DEFAULT_THRESHOLDS)
    expect(result.current.isModified).toBe(false)
  })
})

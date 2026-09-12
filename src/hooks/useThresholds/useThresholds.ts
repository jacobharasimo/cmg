import { useCallback, useMemo, useState } from 'react'
import { DEFAULT_THRESHOLDS } from '@/lib'
import type { Thresholds } from '@/lib'
import type { UseThresholdsResult } from './types'

/**
 * Owns the adjustable classification thresholds.
 *
 * The spec fixes `evaluateLogFile`'s signature, so thresholds travel as state
 * here and are handed to `evaluateBatch` — moving a slider re-evaluates the
 * whole batch without any rule being rewritten.
 */
export const useThresholds = (): UseThresholdsResult => {
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS)

  const set = useCallback((key: keyof Thresholds, value: number) => {
    setThresholds((current) => ({ ...current, [key]: value }))
  }, [])

  const reset = useCallback(() => {
    setThresholds(DEFAULT_THRESHOLDS)
  }, [])

  const isModified = useMemo(
    () => (Object.keys(DEFAULT_THRESHOLDS) as (keyof Thresholds)[]).some(
      (key) => thresholds[key] !== DEFAULT_THRESHOLDS[key],
    ),
    [thresholds],
  )

  return { thresholds, isModified, set, reset }
}

import { useMemo } from 'react'
import { evaluateBatch } from '@/lib'
import type { Thresholds } from '@/lib'
import type { UseDeviceReportResult } from './types'

/**
 * Evaluates a log against the current thresholds.
 *
 * The boundary components consume: nothing in the UI calls `parseLog` or
 * `evaluateLogFile` directly, so replacing this with a server round-trip later
 * changes this file and nothing else.
 */
export const useDeviceReport = (text: string, thresholds: Thresholds): UseDeviceReportResult =>
  useMemo(() => evaluateBatch(text, thresholds), [text, thresholds])

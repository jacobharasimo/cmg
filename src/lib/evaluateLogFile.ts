import { parseLog } from './parseLog'
import { summarise } from './stats'
import { isSensorType, strategyFor } from './strategies'
import { DEFAULT_THRESHOLDS } from './thresholds'
import { ReferenceKey } from './types'
import type {
  BatchReport,
  Verdict,
  DeviceReport,
  ParsedDevice,
  ReferenceValues,
  Thresholds,
  VerdictMap,
} from './types'

/**
 * Reference values assumed when a log does not declare them.
 * These are the spec example's values (assignment p.4).
 */
const FALLBACK_REFERENCE: Required<ReferenceValues> = Object.freeze({
  [ReferenceKey.Temperature]: 70,
  [ReferenceKey.Humidity]: 45,
  [ReferenceKey.Monoxide]: 6,
  [ReferenceKey.Noise]: 35,
})

/**
 * The assignment's required export (p.6):
 *
 *   evaluateLogFile(logContentsStr) { }
 *
 * One string parameter, returning each device mapped to its classification.
 * Thresholds are not a parameter here because the spec fixes this signature —
 * adjustable thresholds go through `evaluateBatch` below.
 *
 * @throws {LogFormatError} if the text is not a sensor log at all. A device
 * whose *type* has no rule is not an error — it comes back `Unclassified`.
 * Returning `{}` for an unreadable file would be indistinguishable from a log
 * that genuinely contains no devices, and the caller could not tell the
 * difference.
 */
export function evaluateLogFile(logContentsStr: string): VerdictMap {
  const { devices } = evaluateBatch(logContentsStr, DEFAULT_THRESHOLDS)
  return Object.fromEntries(devices.map((device) => [device.name, device.verdict]))
}

/**
 * The richer entry point the UI consumes: the same rules, plus the statistics
 * and rule traces that make each verdict auditable.
 */
export function evaluateBatch(text: string, thresholds: Thresholds): BatchReport {
  const { reference, devices, lines } = parseLog(text)
  const resolved: Required<ReferenceValues> = { ...FALLBACK_REFERENCE, ...reference }

  const reports = devices.map((device) => toReport(device, resolved, thresholds))

  const counts: Partial<Record<Verdict, number>> = {}
  for (const { verdict } of reports) {
    counts[verdict] = (counts[verdict] ?? 0) + 1
  }

  return { reference: resolved, devices: reports, counts, lines }
}

function toReport(
  device: ParsedDevice,
  reference: Required<ReferenceValues>,
  thresholds: Thresholds,
): DeviceReport {
  const strategy = strategyFor(device.type)
  const referenceValue = strategy.referenceKey === null ? null : reference[strategy.referenceKey]
  const stats = summarise(device.readings, referenceValue)
  const tolerance = strategy.tolerance(thresholds)

  const { verdict, outOfTolerance, checks } = strategy.evaluate({
    stats,
    readings: device.readings,
    reference: referenceValue,
    thresholds,
  })

  return {
    name: device.name,
    type: device.type,
    strategy,
    isRegistered: isSensorType(device.type),
    reference: referenceValue,
    readings: device.readings,
    stats,
    verdict,
    outOfTolerance,
    checks,
    tolerance,
  }
}

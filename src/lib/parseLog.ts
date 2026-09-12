import { LogFormatError } from './errors'
import { ReferenceKey } from './types'
import type { ParsedDevice, ParsedLog, Reading, ReferenceValues } from './types'

/**
 * Parse a sensor log (assignment p.4).
 *
 *   reference <temperature> <humidity> <monoxide>   the spec's form
 *   reference <type> <value>                        extended form
 *   <type> <name>                                   starts a device block
 *   <ISO-8601 timestamp> <value>                    a reading in that block
 *
 * Every production has a fixed arity, which is what makes the format
 * recognisable at all. A line matching none of them is skipped rather than
 * guessed at: a log is an artefact from the field, and one corrupt line should
 * not cost the rest of the file.
 *
 * Skipping is tolerable only because the *file* is still checked. If nothing in
 * the input is sensor-log syntax — no readings and no reference — the input is
 * some other kind of file and `LogFormatError` is thrown. Without that check,
 * an uploaded email or CSV parses "successfully" into devices with no readings,
 * and the UI reports a clean batch of nothing.
 */

const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/
const REFERENCE = 'reference'

/** The positional order of the spec's three-value reference line. */
const SPEC_REFERENCE_ORDER = [
  ReferenceKey.Temperature,
  ReferenceKey.Humidity,
  ReferenceKey.Monoxide,
] as const

const REFERENCE_KEYS: readonly string[] = Object.values(ReferenceKey)

function isReferenceKey(value: string): value is ReferenceKey {
  return REFERENCE_KEYS.includes(value)
}

export function parseLog(text: string): ParsedLog {
  const reference: ReferenceValues = {}
  const devices: ParsedDevice[] = []
  let readings: Reading[] | null = null
  let lines = 0
  let readingCount = 0
  let hasReference = false

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (line === '') continue
    lines += 1

    const token = line.split(/\s+/)
    const head = token[0]
    if (head === undefined) continue

    if (head === REFERENCE) {
      if (applyReference(reference, token)) hasReference = true
      continue
    }

    if (TIMESTAMP.test(head)) {
      const value = Number(token[1])
      if (token.length !== 2 || Number.isNaN(value)) continue
      readingCount += 1
      // A reading before any device header has nothing to attach to.
      if (readings) readings.push({ at: head, value })
      continue
    }

    // `<type> <name>` — exactly two tokens. Prose, CSV and markup rarely match,
    // which is most of what keeps a non-log from parsing into phantom devices.
    if (token.length === 2) {
      readings = []
      devices.push({ type: head, name: token[1] ?? '', readings })
    }
  }

  if (readingCount === 0 && !hasReference) {
    throw new LogFormatError(
      `Not a sensor log: no readings and no reference line in ${String(lines)} non-blank line(s).`,
    )
  }

  return { reference, devices, lines }
}

/**
 * Applies a reference line, returning whether the line was well-formed
 * reference *syntax* — which is a different question from whether we
 * understood the key.
 *
 * `reference brightness 900` is a log talking about a quantity we have no
 * `ReferenceKey` for. The value is dropped, but the line still proves this is a
 * sensor log, so it counts. That mirrors how an unknown device type is reported
 * rather than treated as corruption.
 */
function applyReference(reference: ReferenceValues, token: readonly string[]): boolean {
  // reference <temperature> <humidity> <monoxide>
  if (token.length === 4) {
    SPEC_REFERENCE_ORDER.forEach((key, index) => {
      reference[key] = Number(token[index + 1])
    })
    return true
  }

  // reference <type> <value>
  const key = token[1]
  if (token.length !== 3 || key === undefined) return false
  if (isReferenceKey(key)) reference[key] = Number(token[2])
  return true
}

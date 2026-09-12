import { useCallback, useState } from 'react'
import { isLogFormatError, parseLog } from '@/lib'
import { EXAMPLE_LOG } from '@/lib/fixtures'
import type { LogState, UseSensorLogResult } from './types'

const EXAMPLE_LABEL = 'spec example log'

/**
 * Parses the text to validate it, and measures it for the stats line.
 *
 * Parsing here rather than counting lines by hand does two jobs at once: it is
 * what rejects a file that is not a log, and it makes `parseMs` an honest
 * number instead of the cost of a `split`.
 *
 * @throws {LogFormatError} if the text is not a sensor log.
 */
const measure = (text: string, label: string): LogState => {
  const startedAt = performance.now()
  const { lines } = parseLog(text)
  return {
    text,
    source: { label, lines, bytes: text.length, parseMs: performance.now() - startedAt },
  }
}

/** What the user is shown when a file cannot be read at all. */
const uploadFailed = (name: string): string => `Log file upload failed — “${name}” could not be read.`

/** What the user is shown when a file is read but is not a sensor log. */
const parsingFailed = (name: string): string =>
  `Log file parsing failed — “${name}” is not a sensor log. The previous log is still shown.`

/**
 * Owns where the log comes from.
 *
 * The app opens on the assignment's own example log, so the six verdicts it
 * specifies are on screen immediately. Anything larger arrives by upload or
 * drop — `synthetic_log_test.txt` at the repo root is a 46-device batch kept
 * for exactly that.
 *
 * **This is the only file that knows where a log comes from.** Serving one from
 * an API is a change here and nowhere else; no component reads a source.
 *
 * **A log is committed only if it parses**, and a failed load *throws* rather
 * than returning an error to store. That keeps the hook to one job: the caller
 * decides how a failure is shown, which is what lets the snackbar stay generic
 * infrastructure rather than something this hook has to know about.
 *
 * The thrown `Error` carries a presentable `message` — the library's own error
 * text names line counts, which is right for a developer and wrong for a bar
 * across the top of the page. The original is kept as `cause`.
 */
export const useSensorLog = (): UseSensorLogResult => {
  const [state, setState] = useState<LogState>(() => measure(EXAMPLE_LOG, EXAMPLE_LABEL))

  const loadText = useCallback((text: string, label: string) => {
    // Measure into a local first: `setState` must not run if this throws, or a
    // rejected file would half-replace the log that is still on screen.
    const loaded = measure(text, label)
    setState(loaded)
  }, [])

  const loadExample = useCallback(() => {
    loadText(EXAMPLE_LOG, EXAMPLE_LABEL)
  }, [loadText])

  const loadFile = useCallback(
    async (file: File) => {
      let text: string
      try {
        text = await file.text()
      } catch (cause) {
        // Unreadable file: moved, permission revoked, or a failing disk.
        throw new Error(uploadFailed(file.name), { cause })
      }

      try {
        loadText(text, file.name)
      } catch (cause) {
        if (!isLogFormatError(cause)) throw cause
        throw new Error(parsingFailed(file.name), { cause })
      }
    },
    [loadText],
  )

  return { text: state.text, source: state.source, loadExample, loadText, loadFile }
}

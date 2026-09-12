/** Types for `useSensorLog`. */

/** Where the currently loaded log came from, for the stats line. */
export interface LogSource {
  /** Human label: the spec example log, or an uploaded file's name. */
  readonly label: string
  readonly bytes: number
  readonly lines: number
  /** Milliseconds spent parsing, measured at load. */
  readonly parseMs: number
}

/** The loaded log and what is known about it. Internal to the hook. */
export interface LogState {
  readonly text: string
  readonly source: LogSource | null
}

export interface UseSensorLogResult {
  readonly text: string
  readonly source: LogSource | null
  readonly loadExample: () => void
  /** @throws {Error} with a presentable message if the text is not a log. */
  readonly loadText: (text: string, label: string) => void
  /** @throws {Error} with a presentable message if the file cannot be used. */
  readonly loadFile: (file: File) => Promise<void>
}

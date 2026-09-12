import type { LogSource } from '@/hooks'

export interface LogSourceBarProps {
  readonly source: LogSource | null
  /** Devices found in the current log, shown in the stats line. */
  readonly deviceCount: number
  readonly onLoadExample: () => void
  readonly onLoadFile: (file: File) => void
}

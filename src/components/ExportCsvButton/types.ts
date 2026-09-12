import type { CsvCell } from '@/utils'

export interface ExportCsvButtonProps {
  /** File name offered to the browser, including the .csv extension. */
  readonly filename: string
  /** Called at click time, so the export always reflects current state. */
  readonly rows: () => readonly (readonly CsvCell[])[]
  /** Accessible name — "Export CSV" alone is ambiguous with several on a page. */
  readonly label: string
}

import type { VerdictMap } from '@/lib'

export interface JsonOutputProps {
  /** The spec-shaped result: device name → verdict. */
  readonly verdicts: VerdictMap
  /** Rendered by the CSV button beside the copy button. */
  readonly onExportCsv: () => readonly (readonly (string | number | null)[])[]
}

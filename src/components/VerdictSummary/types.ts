import type { Verdict } from '@/lib'

export interface VerdictSummaryProps {
  /** How many devices landed on each verdict. */
  readonly counts: Readonly<Partial<Record<Verdict, number>>>
  /** Batch size, used for the percentage caption. */
  readonly total: number
}

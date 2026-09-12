import { Box, useTheme } from '@mui/material'
import { Verdict } from '@/lib'
import StatCard from '@/components/StatCard'
import type { VerdictSummaryProps } from './types'

/**
 * Display order for the summary row: the thermometer grades, then the
 * keep/discard pair, then unclassified.
 */
const ORDER: readonly Verdict[] = [
  Verdict.UltraPrecise,
  Verdict.VeryPrecise,
  Verdict.Precise,
  Verdict.Keep,
  Verdict.Discard,
  Verdict.Unclassified,
]

/**
 * The batch at a glance: one tile per verdict, with its count and share.
 *
 * Only verdicts actually present are shown, so a log with no thermometers does
 * not display three empty precision tiles. Order is fixed rather than
 * count-driven — the thermometer grades, then the keep/discard pair, then
 * unclassified — so the row does not reshuffle as thresholds move.
 */
const VerdictSummary = ({ counts, total }: VerdictSummaryProps) => {
  const theme = useTheme()
  const present = ORDER.filter((verdict) => (counts[verdict] ?? 0) > 0)

  return (
    <Box
      component="section"
      aria-label="Classification summary"
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))',
        gap: 2,
      }}
    >
      {present.map((verdict) => {
        const count = counts[verdict] ?? 0
        return (
          <StatCard
            key={verdict}
            label={verdict}
            value={String(count)}
            caption={total > 0 ? `${String(Math.round((count / total) * 100))}% of batch` : undefined}
            accent={theme.palette.verdict[verdict]}
          />
        )
      })}
    </Box>
  )
}

export default VerdictSummary

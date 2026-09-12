import { Card, CardContent, Typography } from '@mui/material'
import type { StatCardProps } from './types'

/**
 * A single count tile: an uppercase label, the number in the display monospace
 * size, and an optional caption beneath it.
 *
 * Used once per verdict in the summary row, where `accent` draws the coloured
 * left edge tying the tile to its verdict. Entirely presentational — it formats
 * nothing and knows nothing about verdicts, so the caller passes finished
 * strings and picks the colour.
 */
const StatCard = ({ label, value, caption, accent }: StatCardProps) => {
  return (
    <Card sx={accent === undefined ? undefined : { borderLeft: `3px solid ${accent}` }}>
      {/* A flex column with gap, so no child carries a margin of its own. */}
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="overline" component="div" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="monoDisplay" component="div">
          {value}
        </Typography>
        {caption !== undefined && (
          <Typography variant="mono" component="div" color="text.disabled">
            {caption}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default StatCard

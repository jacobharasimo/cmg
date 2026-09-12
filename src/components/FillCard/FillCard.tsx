import { Card, CardContent } from '@mui/material'
import type { Theme } from '@mui/material'
import type { SystemStyleObject } from '@mui/system'
import type { FillCardProps } from './types'

/** Fills its grid track and lets the inner content scroll instead of the card. */
const FILL: SystemStyleObject<Theme> = {
  height: '100%',
  minHeight: 0,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}

const FILL_CONTENT: SystemStyleObject<Theme> = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
}

/**
 * The card every panel in the console is built from.
 *
 * Replaces the design's repeated `sxCardFill` / `sxCardContentFill` style
 * objects with one component: colour, border and radius all come from the
 * theme, so the only decision left to a caller is how the card behaves in its
 * grid track.
 *
 * `isFilled` makes it stretch to that track and clip its own overflow, so a
 * table or chart inside scrolls rather than pushing the card taller than the
 * row it sits in. Without it the card is sized by its content.
 */
const FillCard = ({ children, isFilled = false, sx }: FillCardProps) => {
  return (
    <Card sx={{ ...(isFilled ? FILL : {}), ...sx }}>
      <CardContent sx={isFilled ? FILL_CONTENT : {}}>{children}</CardContent>
    </Card>
  )
}

export default FillCard

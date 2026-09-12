import { Chip, useTheme } from '@mui/material'
import type { VerdictChipProps } from './types'

/**
 * A device's verdict, as a chip.
 *
 * Always carries its text label — colour is reinforcement, never the only
 * carrier of meaning (WCAG 1.4.1), which matters here because three of the six
 * verdicts are greens and blues that are hard to tell apart.
 *
 * Outlined by default, for the dense device table. `isFilled` gives the solid
 * treatment used where the verdict is a panel's headline rather than one cell
 * among many.
 */
const VerdictChip = ({ verdict, isFilled = false }: VerdictChipProps) => {
  const theme = useTheme()
  const color = theme.palette.verdict[verdict]

  return (
    <Chip
      label={verdict}
      sx={
        isFilled
          ? { bgcolor: color, color: theme.palette.background.default, fontWeight: 600 }
          : { bgcolor: 'transparent', color, border: `1px solid ${color}` }
      }
    />
  )
}

export default VerdictChip

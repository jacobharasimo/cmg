import type { Components, Theme } from '@mui/material/styles'

/**
 * Panels are outlined rather than shadowed.
 *
 * Card's border and background already come from `divider` and
 * `background.paper`, so neither is restated here.
 */
export function surfaces(theme: Theme): Components<Theme> {
  return {
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        // Dark-mode Paper paints a lightening gradient per elevation step. This
        // design separates surfaces with explicit colours, so the gradient only
        // muddies them.
        root: { backgroundImage: 'none' },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0, variant: 'outlined' },
    },
    MuiCardContent: {
      styleOverrides: {
        // MUI pads the last child by 24px to leave room for CardActions. No
        // card here has any, so the padding should simply be even.
        root: {
          padding: theme.spacing(2),
          '&:last-child': { paddingBottom: theme.spacing(2) },
        },
      },
    },
  }
}

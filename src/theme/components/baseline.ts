import type { Components, Theme } from '@mui/material/styles'

/**
 * Document-level styles.
 *
 * Deliberately tiny: MUI's own `CssBaseline` already sets `box-sizing`, font
 * smoothing, `body` margin, colour and background from the palette. Repeating
 * any of that here would be noise at best — and re-declaring `box-sizing` on
 * `*` is worse than noise, because MUI uses `inherit` so a subtree can opt out.
 *
 * What is left is the one thing MUI does not give us globally.
 */
export function baseline(theme: Theme): Components<Theme> {
  return {
    MuiCssBaseline: {
      styleOverrides: {
        // WCAG 2.4.7 — a single visible focus indicator, defined once, so no
        // component has to remember to style its own.
        ':focus-visible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
      },
    },
  }
}

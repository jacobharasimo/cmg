import { createTheme } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'
import { getComponents } from './components'
import { palette } from './foundations/palette'
import { typography } from './foundations/typography'

/** The content width cap, exposed as the `xl` breakpoint. */
const CONTENT_WIDTH = 1440

/**
 * Build the app's theme. There is exactly one — the design defines a single
 * dark theme and has no mode toggle — so this takes no arguments.
 *
 * Two passes: the first assembles palette, typography, spacing and shape; the
 * second layers on component overrides that need to read those resolved values.
 */
export function createAppTheme(): Theme {
  const base = createTheme({
    palette,
    typography,
    spacing: 8,
    // The design's card radius. Buttons, inputs and panels follow it;
    // chips are left to MUI's pill.
    shape: { borderRadius: 8 },
    // The cap lives here so no component carries a width of its own —
    // `<Container maxWidth="xl">` reads it back off the theme.
    breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: CONTENT_WIDTH } },
  })

  // No `responsiveFontSizes`: it requires unitless line heights and rescales
  // sizes per breakpoint, both of which pull the type off the 8-point grid.
  return createTheme(base, { components: getComponents(base) })
}

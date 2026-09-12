import type { TypographyVariantsOptions } from '@mui/material/styles'

/**
 * The type scale, in px.
 *
 * Sizes are even and line heights are multiples of 4, so every line box lands
 * on the 8-point grid: 12/16, 14/20, 16/24, 24/32.
 *
 * Monospace is not decoration — every number, device name, timestamp and the
 * JSON pane use it, and that is what makes the device table scannable. Three
 * sizes cover it: the data itself, a larger one for values that carry a panel,
 * and a display size for the summary counts.
 */
const SANS = "'IBM Plex Sans', system-ui, -apple-system, sans-serif"
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace"

export const typography: TypographyVariantsOptions = {
  fontFamily: SANS,
  fontSize: 14,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 600,

  h1: { fontSize: 24, lineHeight: '32px', fontWeight: 600, letterSpacing: '-0.01em' },
  h2: { fontSize: 16, lineHeight: '24px', fontWeight: 600 },
  h3: { fontSize: 14, lineHeight: '20px', fontWeight: 600 },
  h4: { fontSize: 14, lineHeight: '20px', fontWeight: 600 },
  h5: { fontSize: 12, lineHeight: '16px', fontWeight: 600 },
  h6: { fontSize: 12, lineHeight: '16px', fontWeight: 600 },

  subtitle1: { fontSize: 14, lineHeight: '20px', fontWeight: 500 },
  subtitle2: { fontSize: 12, lineHeight: '16px', fontWeight: 500 },
  body1: { fontSize: 14, lineHeight: '20px' },
  body2: { fontSize: 12, lineHeight: '16px' },
  caption: { fontSize: 12, lineHeight: '16px' },

  /** Section eyebrows: "DEVICE", "SENSOR TYPE", "DISTRIBUTION OF READINGS". */
  overline: {
    fontSize: 12,
    lineHeight: '16px',
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },

  /** Data: table cells, the JSON pane, timestamps, rule traces. */
  mono: { fontFamily: MONO, fontSize: 12, lineHeight: '16px' },
  /** A value that carries its own panel — the reference chips. */
  monoLarge: { fontFamily: MONO, fontSize: 16, lineHeight: '24px' },
  /** The summary counts. */
  monoDisplay: { fontFamily: MONO, fontSize: 24, lineHeight: '32px' },

  button: { fontSize: 14, lineHeight: '20px', fontWeight: 500, textTransform: 'none', letterSpacing: 0 },
}

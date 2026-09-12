import type { PaletteOptions } from '@mui/material/styles'
import { Verdict } from '@/lib'
import type { VerdictPalette } from '../types'

/**
 * The app's one palette. The design defines a single dark theme, so there is no
 * mode to switch between and no light variant to keep in sync.
 *
 * **This is the only file in the app containing a hex literal.** Everything
 * else — components and chart options alike — reads colours back off the theme.
 *
 * Contrast ratios in the comments were computed, not eyeballed.
 */

/**
 * The neutral ramp, darkest to lightest.
 *
 * MUI's own `grey` slot, so components and charts can reach it without a
 * parallel token system. Two entries carry accessibility meaning:
 *
 * Two entries are surfaced as named palette colours rather than read as
 * shades — see `divider` and `outline` below.
 */
const grey = {
  900: '#0f1216', // page background
  800: '#161b21', // inset surfaces: table head, JSON pane, drop zone
  700: '#1a1f25', // cards and raised surfaces
  600: '#39424c', // → divider
  500: '#6b7785', // → outline
  400: '#a3aeba', // de-emphasised text — 7.4:1
  300: '#b6c2cf', // labels and axis text — 9.2:1
  200: '#cbd5e1',
  100: '#e6edf3', // secondary text — 14.0:1
  50: '#f1f5f9', //  primary text — 15.1:1
} as const

/** One colour per verdict: ≥4.5:1 as text on paper, ≥3:1 as a graphic on bg. */
const verdict: VerdictPalette = {
  [Verdict.UltraPrecise]: '#2dd4bf',
  [Verdict.VeryPrecise]: '#38bdf8',
  [Verdict.Precise]: '#cbd5e1',
  [Verdict.Keep]: '#4ade80',
  [Verdict.Discard]: '#f87171',
  [Verdict.Unclassified]: '#fbbf24',
}

export const palette: PaletteOptions = {
  mode: 'dark',
  grey,
  primary: {
    // Focus ring, primary action and selection — 8.9:1 on paper.
    main: '#2dd4bf',
    contrastText: '#062120',
  },
  secondary: { main: grey[100], contrastText: grey[900] },
  background: {
    default: grey[900],
    paper: grey[700],
    panel: grey[800],
  },
  text: { primary: grey[50], secondary: grey[300], disabled: grey[400] },
  /**
   * Decorative separators — card outlines, row rules. **1.6:1 on paper**,
   * which is fine for ornament and never acceptable on a control.
   */
  divider: grey[600],
  /**
   * Control boundaries — inputs, focusable regions, chart bars. **3.63:1 on
   * paper**, clearing WCAG 1.4.11. Using `divider` here instead is the
   * likeliest way to introduce a contrast bug.
   */
  outline: grey[500],
  action: {
    hover: 'rgba(255, 255, 255, 0.05)',
    /**
     * The selected-row tint.
     *
     * `selectedOpacity` is the one that matters: MUI's TableRow composes its
     * own background as `alpha(primary.main, action.selectedOpacity)` and never
     * reads `action.selected`. Setting only the latter looks right and changes
     * nothing.
     *
     * 0.12 rather than the design's 0.16 because this tint sits *behind* the
     * verdict chips and so becomes part of their background: at 0.16 the blend
     * reaches #1d3c3e, where `discard` drops to 4.29:1 and fails WCAG 1.4.3.
     * At 0.12 the worst verdict holds 4.70:1 and the row is still clearly
     * selected.
     */
    selected: 'rgba(45, 212, 191, 0.12)',
    selectedOpacity: 0.12,
  },
  success: { main: verdict[Verdict.Keep] },
  error: { main: verdict[Verdict.Discard] },
  warning: { main: verdict[Verdict.Unclassified] },
  info: { main: verdict[Verdict.VeryPrecise] },
  verdict,
}

export { grey, verdict }

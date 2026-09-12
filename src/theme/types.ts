import type { Verdict } from '@/lib'
// Anchors the module augmentations below: TS only accepts `declare module` for
// a specifier this file actually resolves.
import type {} from '@mui/material/styles'
import type {} from '@mui/material/Typography'
import type { CSSProperties } from 'react'

/** Colour per verdict, exposed on the theme as `palette.verdict`. */
export type VerdictPalette = Readonly<Record<Verdict, string>>

declare module '@mui/material/styles' {
  interface Palette {
    /** Domain colours MUI cannot know about. */
    verdict: VerdictPalette
    /**
     * The boundary of a control — inputs, focusable regions, chart bars.
     *
     * A sibling to `divider`, and deliberately not the same colour: `divider`
     * is decorative and `outline` has to clear WCAG 1.4.11 at 3:1.
     */
    outline: string
  }
  interface PaletteOptions {
    verdict?: VerdictPalette
    outline?: string
  }

  /** A third surface, one step below `paper` — table heads, the JSON pane. */
  interface TypeBackground {
    panel: string
  }

  interface TypographyVariants {
    mono: CSSProperties
    monoLarge: CSSProperties
    monoDisplay: CSSProperties
  }
  interface TypographyVariantsOptions {
    mono?: CSSProperties
    monoLarge?: CSSProperties
    monoDisplay?: CSSProperties
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    mono: true
    monoLarge: true
    monoDisplay: true
  }
}

import type { Components, Theme } from '@mui/material/styles'

/** Buttons: flat, sentence-case, and never below the minimum target size. */
export function buttons(theme: Theme): Components<Theme> {
  const focusRing = {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  }

  return {
    /**
     * WCAG 2.4.7. `ButtonBase` resets `outline: 0`, which silently overrides
     * the global `:focus-visible` rule in the baseline — so every Button,
     * IconButton, TableSortLabel, Radio and Switch loses its focus ring. This
     * puts it back on MUI's own `Mui-focusVisible` class, which wins.
     *
     * This also covers `component="label"` — the upload control, where the
     * element that takes focus is a hidden input *inside* the button. React's
     * `onFocus` bubbles, so `ButtonBase` still applies the class to the label
     * and the ring lands on the visible surface. No `:has()` rule is needed;
     * `keyboard.spec.ts` asserts the ring reaches a visible ancestor.
     */
    MuiButtonBase: {
      styleOverrides: { root: { '&.Mui-focusVisible': focusRing } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, size: 'small', variant: 'outlined' },
      styleOverrides: {
        root: {
          // WCAG 2.5.8 — `size="small"` would otherwise fall under 24px.
          minHeight: 32,
          paddingInline: theme.spacing(2),
          /*
            WCAG 2.4.7 for `component="label"`. A file-upload button is a label
            wrapping a visually hidden input, so the element that takes focus is
            the invisible one and `Mui-focusVisible` never lands on the button.
            `:has()` moves the ring to the visible surface.

            `:focus-visible`, not `:focus`: matching plain focus would paint a
            ring on mouse clicks too, which is the behaviour `:focus-visible`
            exists to avoid.
          */

        },
        outlined: {
          color: theme.palette.text.primary,
          // MUI derives an outline from text colour at low alpha, which lands
          // under 3:1. `outline` is the palette's AA-safe boundary colour.
          borderColor: theme.palette.outline,
          '&:hover': {
            borderColor: theme.palette.text.primary,
            backgroundColor: theme.palette.action.hover,
          },
        },
        contained: {
          fontWeight: theme.typography.fontWeightBold,
          // The primary is a single flat colour; brightness is the hover cue.
          '&:hover': { filter: 'brightness(1.12)' },
        },
      },
    },
    MuiIconButton: {
      // WCAG 2.5.8 — a floor, whatever padding a given size resolves to.
      styleOverrides: { root: { minWidth: 24, minHeight: 24 } },
    },
  }
}

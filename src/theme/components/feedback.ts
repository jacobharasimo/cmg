import type { Components, Theme } from '@mui/material/styles'

/**
 * The error banner: a Snackbar pinned edge-to-edge across the top.
 *
 * MUI's Snackbar is a floating card inset from a corner. Everything here turns
 * that into a full-bleed bar, which is the whole of the customisation — the
 * colours are `palette.error`, which already resolves to the `discard` token.
 */
export function feedback(theme: Theme): Components<Theme> {
  return {
    MuiSnackbar: {
      defaultProps: { anchorOrigin: { vertical: 'top', horizontal: 'center' } },
      styleOverrides: {
        root: {
          // Stretch across the viewport. MUI centres the card with a transform
          // and insets it by spacing; both have to go for an edge-to-edge bar.
          top: 0,
          left: 0,
          right: 0,
          transform: 'none',
          width: '100%',
          maxWidth: '100%',
          // Above the sticky table header, below nothing.
          zIndex: theme.zIndex.snackbar,
        },
      },
    },
    MuiAlert: {
      defaultProps: { variant: 'filled' },
      styleOverrides: {
        root: {
          width: '100%',
          // Square, because it spans the viewport — a radius would leave the
          // page background showing through at the corners.
          borderRadius: 0,
          alignItems: 'center',
          /*
            MUI 9 has no `filledError` slot: the classes are `filled` and
            `colorError` separately, so the pairing is expressed as a variant
            rather than one override key.
          */
          variants: [
            {
              props: { variant: 'filled', severity: 'error' },
              style: {
                backgroundColor: theme.palette.error.main,
                /*
                  The error token is a light red, so its text must be dark.
                  `background.default` is the page ground and sits at 6.79:1 on
                  it; MUI's default white would be 2.77:1 and fail 1.4.3.
                  Both ratios are asserted in the palette test.
                */
                color: theme.palette.background.default,
              },
            },
          ],
        },
        action: {
          // Inherit the dark ink above rather than MUI's white, and centre the
          // dismiss control against the message instead of top-aligning it.
          color: 'inherit',
          paddingTop: 0,
          alignItems: 'center',
        },
        icon: { color: 'inherit', alignItems: 'center' },
      },
    },
  }
}

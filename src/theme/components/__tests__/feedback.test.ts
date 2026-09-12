import { describe, expect, it } from 'vitest'
import { createAppTheme } from '@/theme'
import { feedback } from '../feedback'

const theme = createAppTheme()
const overrides = feedback(theme)

describe('feedback', () => {
  describe('MuiSnackbar', () => {
    it('anchors to the top, so the bar reads as a page-level condition', () => {
      expect(overrides.MuiSnackbar?.defaultProps?.anchorOrigin).toEqual({
        vertical: 'top',
        horizontal: 'center',
      })
    })

    /*
      MUI insets the Snackbar and centres it with a transform. All of that has
      to be undone for a bar that spans the viewport.
    */
    it('stretches edge to edge', () => {
      expect(overrides.MuiSnackbar?.styleOverrides?.root).toMatchObject({
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        transform: 'none',
      })
    })
  })

  describe('MuiAlert', () => {
    it('is filled, so the bar reads as a solid band', () => {
      expect(overrides.MuiAlert?.defaultProps?.variant).toBe('filled')
    })

    it('is square, because a radius would show the page through its corners', () => {
      expect(overrides.MuiAlert?.styleOverrides?.root).toMatchObject({ borderRadius: 0 })
    })

    /*
      MUI 9 has no `filledError` override slot — the classes are `filled` and
      `colorError` separately — so the pairing has to be a variant. If this ever
      stops matching, the banner silently falls back to MUI's white-on-red,
      which fails 1.4.3 at 2.77:1.
    */
    it('pairs filled with error to set dark ink from the theme', () => {
      const root = overrides.MuiAlert?.styleOverrides?.root
      const variants = (root as { variants?: { props: unknown; style: unknown }[] }).variants

      expect(variants).toEqual([
        {
          props: { variant: 'filled', severity: 'error' },
          style: {
            backgroundColor: theme.palette.error.main,
            color: theme.palette.background.default,
          },
        },
      ])
    })

    it('lets the dismiss control and icon inherit that ink', () => {
      expect(overrides.MuiAlert?.styleOverrides?.action).toMatchObject({ color: 'inherit' })
      expect(overrides.MuiAlert?.styleOverrides?.icon).toMatchObject({ color: 'inherit' })
    })
  })
})

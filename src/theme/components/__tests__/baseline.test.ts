import { describe, expect, it } from 'vitest'
import { createAppTheme } from '@/theme'
import { baseline } from '../baseline'

const theme = createAppTheme()

describe('baseline', () => {
  it('defines the focus ring once, globally', () => {
    const styles = baseline(theme).MuiCssBaseline?.styleOverrides as Record<string, unknown>

    expect(styles[':focus-visible']).toMatchObject({ outlineOffset: 2 })
  })

  it('does not restate what CssBaseline already does', () => {
    const styles = baseline(theme).MuiCssBaseline?.styleOverrides as Record<string, unknown>

    // box-sizing, font smoothing and the body background all come from MUI.
    expect(Object.keys(styles)).toEqual([':focus-visible'])
  })
})

import { describe, expect, it } from 'vitest'
import { createAppTheme } from '@/theme'
import { buttons } from '../buttons'

const theme = createAppTheme()

describe('buttons', () => {
  it('clears the WCAG 2.5.8 minimum target even at size="small"', () => {
    const root = buttons(theme).MuiButton?.styleOverrides?.root as { minHeight: number }

    expect(root.minHeight).toBeGreaterThanOrEqual(24)
  })

  it('outlines with the AA-safe boundary colour, not a derived alpha', () => {
    const outlined = buttons(theme).MuiButton?.styleOverrides?.outlined as { borderColor: string }

    expect(outlined.borderColor).toBe(theme.palette.outline)
  })
})

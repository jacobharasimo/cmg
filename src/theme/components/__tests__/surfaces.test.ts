import { describe, expect, it } from 'vitest'
import { createAppTheme } from '@/theme'
import { surfaces } from '../surfaces'

const theme = createAppTheme()

describe('surfaces', () => {
  it('removes the dark-mode elevation gradient, which muddies explicit surfaces', () => {
    expect(surfaces(theme).MuiPaper?.styleOverrides?.root).toMatchObject({ backgroundImage: 'none' })
  })

  it('pads card content evenly, rather than leaving room for absent actions', () => {
    const root = surfaces(theme).MuiCardContent?.styleOverrides?.root as Record<string, unknown>

    expect(root.padding).toBe(root['&:last-child']?.['paddingBottom' as never])
  })
})

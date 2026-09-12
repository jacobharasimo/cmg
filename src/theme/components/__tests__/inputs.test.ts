import { describe, expect, it } from 'vitest'
import { createAppTheme } from '@/theme'
import { inputs } from '../inputs'

const theme = createAppTheme()

describe('inputs', () => {
  it('sizes the slider thumb to the 24px minimum target', () => {
    expect(inputs(theme).MuiSlider?.styleOverrides?.thumb).toMatchObject({ width: 24, height: 24 })
  })

  it('treats the slider rail as a control boundary', () => {
    const rail = inputs(theme).MuiSlider?.styleOverrides?.rail as { backgroundColor: string }

    expect(rail.backgroundColor).toBe(theme.palette.outline)
  })
})

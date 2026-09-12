import { describe, expect, it } from 'vitest'
import { createAppTheme } from '@/theme'
import { dataDisplay } from '../dataDisplay'

const theme = createAppTheme()

describe('dataDisplay', () => {
  it('gives table rows scroll margin, so the sticky header cannot hide focus', () => {
    expect(dataDisplay(theme).MuiTableRow?.styleOverrides?.root).toMatchObject({
      scrollMarginTop: 40,
    })
  })

  it('keeps chips at the minimum target height', () => {
    const root = dataDisplay(theme).MuiChip?.styleOverrides?.root as { height: number }

    expect(root.height).toBeGreaterThanOrEqual(24)
  })

  it('sets data cells in the monospace variant', () => {
    expect(dataDisplay(theme).MuiTableCell?.styleOverrides?.body).toBe(theme.typography.mono)
  })
})

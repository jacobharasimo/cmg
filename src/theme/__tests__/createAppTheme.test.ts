import { describe, expect, it } from 'vitest'
import { Verdict } from '@/lib'
import { createAppTheme } from '../createAppTheme'
import { verdict } from '../foundations/palette'

describe('createAppTheme', () => {
  const theme = createAppTheme()

  it('builds the single dark theme', () => {
    expect(theme.palette.mode).toBe('dark')
  })

  it('takes no arguments, because there is only one theme', () => {
    expect(createAppTheme).toHaveLength(0)
  })

  it('exposes a colour for every verdict the library can return', () => {
    for (const value of Object.values(Verdict)) {
      expect(theme.palette.verdict[value]).toBe(verdict[value])
    }
  })

  it('adds the one surface MUI lacks, below paper', () => {
    expect(theme.palette.background.panel).toBeDefined()
    expect(theme.palette.background.panel).not.toBe(theme.palette.background.paper)
  })

  it('keeps decorative and control boundaries as separate colours', () => {
    // divider is 1.6:1 and decorative; grey[500] is 3.63:1 and clears 1.4.11.
    expect(theme.palette.divider).not.toBe(theme.palette.outline)
  })

  it('uses MUI spacing on an 8-point grid', () => {
    expect(theme.spacing(1)).toBe('8px')
    expect(theme.spacing(3)).toBe('24px')
  })

  it('caps content width at the xl breakpoint', () => {
    expect(theme.breakpoints.values.xl).toBe(1440)
  })

  it('carries the shape and typography foundations', () => {
    expect(theme.shape.borderRadius).toBe(8)
    expect(theme.typography.button.textTransform).toBe('none')
    expect(theme.typography.mono.fontFamily).toContain('IBM Plex Mono')
  })

  it('sizes type in whole even px, so it sits on the grid', () => {
    const sizes = [theme.typography.body1, theme.typography.mono, theme.typography.monoDisplay]
    for (const variant of sizes) {
      expect(variant.fontSize).toBeTypeOf('number')
      expect(Number(variant.fontSize) % 2).toBe(0)
    }
  })

  it('sizes the slider thumb to the WCAG 2.5.8 minimum target', () => {
    expect(theme.components?.MuiSlider?.styleOverrides?.thumb).toMatchObject({
      width: 24,
      height: 24,
    })
  })

  it('gives table rows scroll margin so the sticky header cannot obscure focus', () => {
    expect(theme.components?.MuiTableRow?.styleOverrides?.root).toMatchObject({
      scrollMarginTop: 40,
    })
  })

  it('merges every component override group', () => {
    const { components } = theme

    expect(components?.MuiCssBaseline).toBeDefined()
    expect(components?.MuiButton?.defaultProps?.disableElevation).toBe(true)
    expect(components?.MuiCard?.defaultProps?.variant).toBe('outlined')
    expect(components?.MuiTextField?.defaultProps?.size).toBe('small')
    expect(components?.MuiTooltip?.defaultProps?.arrow).toBe(true)
  })
})

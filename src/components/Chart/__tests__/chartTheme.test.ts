import { describe, expect, it } from 'vitest'
import { createAppTheme } from '@/theme'
import { chartTheme, mono, tint } from '../chartTheme'

const theme = createAppTheme()

describe('chartTheme', () => {
  const options = chartTheme(theme)

  it('draws on the page rather than painting its own background', () => {
    expect(options.chart?.backgroundColor).toBe('transparent')
  })

  it('enables keyboard navigation, without which the charts fail WCAG', () => {
    expect(options.accessibility?.keyboardNavigation?.enabled).toBe(true)
  })

  it('hides the Highcharts credits and default title', () => {
    expect(options.credits?.enabled).toBe(false)
    expect(options.title?.text).toBe('')
  })

  it('takes every colour from the palette', () => {
    expect(options.tooltip?.backgroundColor).toBe(theme.palette.background.default)
    expect(options.tooltip?.borderColor).toBe(theme.palette.outline)
  })

  it('styles both axes identically, so a builder only supplies titles', () => {
    expect(options.xAxis).toEqual(options.yAxis)
  })

  it('uses divider for grid lines and outline for the axis itself', () => {
    const axis = options.xAxis as { gridLineColor: string; lineColor: string }

    expect(axis.gridLineColor).toBe(theme.palette.divider)
    expect(axis.lineColor).toBe(theme.palette.outline)
  })
})

describe('mono', () => {
  it('returns the theme mono stack as a plain string', () => {
    expect(mono(theme)).toContain('IBM Plex Mono')
  })
})

describe('tint', () => {
  it('converts a hex colour to rgba at the given opacity', () => {
    expect(tint('#2dd4bf', 0.15)).toBe('rgba(45, 212, 191, 0.15)')
  })

  it('handles pure black and white', () => {
    expect(tint('#000000', 1)).toBe('rgba(0, 0, 0, 1)')
    expect(tint('#ffffff', 0)).toBe('rgba(255, 255, 255, 0)')
  })
})

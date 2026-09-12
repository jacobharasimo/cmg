import { describe, expect, it } from 'vitest'
import { typography } from '../typography'

const VARIANTS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'subtitle1', 'subtitle2', 'body1', 'body2', 'caption', 'overline',
  'mono', 'monoLarge', 'monoDisplay', 'button',
] as const

const styleOf = (name: (typeof VARIANTS)[number]) =>
  typography[name] as { fontSize?: number; lineHeight?: string; fontFamily?: string }

describe('typography', () => {
  it.each(VARIANTS)('%s is sized in whole px, not a string unit', (name) => {
    expect(styleOf(name).fontSize).toBeTypeOf('number')
  })

  it.each(VARIANTS)('%s uses an even size, so halves never land off the grid', (name) => {
    expect((styleOf(name).fontSize ?? 0) % 2).toBe(0)
  })

  it.each(VARIANTS)('%s has a line height that is a multiple of 4', (name) => {
    const lineHeight = Number.parseInt(styleOf(name).lineHeight ?? '', 10)

    expect(lineHeight % 4).toBe(0)
  })

  it('draws from a small set of sizes rather than a size per variant', () => {
    const sizes = new Set(VARIANTS.map((name) => styleOf(name).fontSize))

    expect([...sizes].sort((a, b) => Number(a) - Number(b))).toEqual([12, 14, 16, 24])
  })

  it('gives the monospace scale three distinct sizes', () => {
    expect(styleOf('mono').fontSize).toBe(12)
    expect(styleOf('monoLarge').fontSize).toBe(16)
    expect(styleOf('monoDisplay').fontSize).toBe(24)
  })

  it.each(['mono', 'monoLarge', 'monoDisplay'] as const)('%s uses the mono family', (name) => {
    expect(styleOf(name).fontFamily).toContain('IBM Plex Mono')
  })

  it('keeps buttons sentence-case, as the design has them', () => {
    expect(typography.button).toMatchObject({ textTransform: 'none' })
  })
})

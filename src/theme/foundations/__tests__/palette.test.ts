import { describe, expect, it } from 'vitest'
import { Verdict } from '@/lib'
import { grey, palette, verdict } from '../palette'

/**
 * Contrast is computed here rather than trusted to a comment, so the ratios the
 * README quotes cannot drift away from the values the app actually ships.
 */
const channel = (value: number): number => {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

const luminance = (hex: string): number => {
  const n = Number.parseInt(hex.slice(1), 16)
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  )
}

const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05)
}

const PAPER = grey[700]
const BG = grey[900]

describe('palette', () => {
  it('is dark, and there is only one', () => {
    expect(palette.mode).toBe('dark')
  })

  it('adds the one surface MUI lacks', () => {
    expect(palette.background).toMatchObject({ panel: grey[800] })
  })
})

describe('text contrast (WCAG 1.4.3 — 4.5:1)', () => {
  it.each([
    ['primary', grey[50]],
    ['secondary', grey[300]],
    ['disabled', grey[400]],
  ])('%s text clears 4.5:1 on paper', (_name, colour) => {
    expect(contrast(colour, PAPER)).toBeGreaterThanOrEqual(4.5)
  })

  it('the accent clears 4.5:1 on paper, since it is used as link and code text', () => {
    expect(contrast('#2dd4bf', PAPER)).toBeGreaterThanOrEqual(4.5)
  })

  it('text on an accent fill clears 4.5:1', () => {
    expect(contrast('#062120', '#2dd4bf')).toBeGreaterThanOrEqual(4.5)
  })
})

describe('verdict colours', () => {
  it.each(Object.values(Verdict))('%s clears 4.5:1 as chip text on paper', (value) => {
    expect(contrast(verdict[value], PAPER)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(Object.values(Verdict))('%s clears 3:1 as a chart bar on the page', (value) => {
    expect(contrast(verdict[value], BG)).toBeGreaterThanOrEqual(3)
  })

  it('covers every verdict the library can return', () => {
    expect(Object.keys(verdict).sort()).toEqual(Object.values(Verdict).sort())
  })
})

describe('verdict colours on a selected row', () => {
  /**
   * The selection tint sits behind the verdict chips, so it becomes part of
   * their background. Checking against `paper` alone missed this — a real
   * browser scan caught `discard` at 4.29:1.
   */
  const blend = (fg: string, bg: string, alpha: number): string => {
    const f = Number.parseInt(fg.slice(1), 16)
    const b = Number.parseInt(bg.slice(1), 16)
    const mix = (shift: number): number =>
      Math.round((((f >> shift) & 255) * alpha) + (((b >> shift) & 255) * (1 - alpha)))
    return `#${[mix(16), mix(8), mix(0)].map((c) => c.toString(16).padStart(2, '0')).join('')}`
  }

  const SELECTION_ALPHA = 0.12
  const selectedRow = blend('#2dd4bf', PAPER, SELECTION_ALPHA)

  it('sets selectedOpacity, which is the value TableRow actually composes with', () => {
    // Setting only `action.selected` changes nothing — MUI derives the row
    // background from `alpha(primary.main, action.selectedOpacity)`.
    expect(palette.action?.selectedOpacity).toBe(SELECTION_ALPHA)
  })

  it.each(Object.values(Verdict))('%s still clears 4.5:1 on a selected row', (value) => {
    expect(contrast(verdict[value], selectedRow)).toBeGreaterThanOrEqual(4.5)
  })
})

describe('outline vs divider', () => {
  it('outline clears 3:1 on paper, as WCAG 1.4.11 requires of a control boundary', () => {
    expect(contrast(grey[500], PAPER)).toBeGreaterThanOrEqual(3)
  })

  it('divider is decorative and does not clear 3:1 — which is why they differ', () => {
    // If this ever passes, the two could be merged. Until then, swapping them
    // silently fails contrast on every input.
    expect(contrast(grey[600], PAPER)).toBeLessThan(3)
  })

  it('keeps them as separate palette entries', () => {
    expect(palette.divider).not.toBe(palette.outline)
  })
})

/*
  The error banner is a filled bar: its text sits on `error.main`, not on a
  page surface, so the pair has to be checked in that direction. MUI's default
  ink for a filled Alert is white, which is why the theme overrides it.
*/
describe('the error banner fill (WCAG 1.4.3)', () => {
  const ERROR = verdict[Verdict.Discard]

  it('carries dark ink at AA', () => {
    expect(contrast(BG, ERROR)).toBeGreaterThanOrEqual(4.5)
  })

  it("is why MUI's white default cannot be kept", () => {
    expect(contrast('#ffffff', ERROR)).toBeLessThan(4.5)
  })
})

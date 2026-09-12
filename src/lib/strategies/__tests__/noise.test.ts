import { describe, expect, it, vi } from 'vitest'
import { ReferenceKey, SensorType } from '../../types'

// Isolation: see `humidity.test.ts` — the rule is the factory's, the config is this file's.
vi.mock('../perReading', () => ({ perReadingStrategy: vi.fn((config: unknown) => config) }))

const { noise } = await import('../noise')

describe('noise', () => {
  /*
    The `note` is the part that matters here: noise is not in the assignment
    spec — p.7 names it as a future type — so it carries a line that surfaces in
    the UI, and the demonstration is never mistaken for a spec rule. Its 3 dB
    threshold is ours rather than the spec's.
  */
  it('judges the noise type, and declares itself an extension', () => {
    expect(noise).toEqual({
      type: SensorType.Noise,
      shortLabel: 'Noise',
      label: 'Noise (ext.)',
      unit: ' dB',
      referenceKey: ReferenceKey.Noise,
      decimals: 1,
      thresholdKey: 'noise',
      note: 'registered post-hoc: no core code changed',
    })
  })
})

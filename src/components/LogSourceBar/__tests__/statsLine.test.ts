import { describe, expect, it } from 'vitest'
import { statsLine } from '../statsLine'

const source = { label: 'sample test batch', lines: 2441, bytes: 51302, parseMs: 0.42 }

describe('statsLine', () => {
  it('summarises the loaded log', () => {
    expect(statsLine(source, 46)).toBe(
      'sample test batch · 2,441 lines · 50.1 KB · parsed in 0.4 ms · 46 devices',
    )
  })

  it('says so when nothing is loaded', () => {
    expect(statsLine(null, 0)).toBe('no log loaded')
  })

  it('groups thousands in the line count', () => {
    expect(statsLine(source, 46)).toContain('2,441 lines')
  })

  it('reports a batch with no devices', () => {
    expect(statsLine({ ...source, label: 'empty.log' }, 0)).toContain('0 devices')
  })
})

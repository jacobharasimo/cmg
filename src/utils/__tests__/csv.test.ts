import { describe, expect, it } from 'vitest'
import { toCsv } from '../csv'

describe('toCsv', () => {
  it('joins cells with commas and rows with newlines', () => {
    expect(toCsv([['device', 'verdict'], ['temp-1', 'precise']])).toBe('device,verdict\ntemp-1,precise')
  })

  it('quotes a cell containing a comma', () => {
    expect(toCsv([['a,b']])).toBe('"a,b"')
  })

  it('doubles embedded quotes', () => {
    expect(toCsv([['say "hi"']])).toBe('"say ""hi"""')
  })

  it('quotes a cell containing a newline', () => {
    expect(toCsv([['line\nbreak']])).toBe('"line\nbreak"')
  })

  it('writes an empty cell for null', () => {
    expect(toCsv([['a', null, 'b']])).toBe('a,,b')
  })

  it('stringifies numbers without quoting them', () => {
    expect(toCsv([[1, 2.5, -3]])).toBe('1,2.5,-3')
  })

  it('returns an empty string for no rows', () => {
    expect(toCsv([])).toBe('')
  })
})

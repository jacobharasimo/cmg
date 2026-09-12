import { describe, expect, it } from 'vitest'
import { formatCount, formatFixed, formatKilobytes, formatMilliseconds } from '../format'

describe('formatCount', () => {
  it('groups thousands', () => {
    expect(formatCount(2441)).toBe('2,441')
  })

  it('leaves small numbers alone', () => {
    expect(formatCount(46)).toBe('46')
  })
})

describe('formatKilobytes', () => {
  it('converts bytes to one decimal place', () => {
    expect(formatKilobytes(51302)).toBe('50.1 KB')
  })
})

describe('formatMilliseconds', () => {
  it('renders one decimal place', () => {
    expect(formatMilliseconds(0.234)).toBe('0.2 ms')
  })
})

describe('formatFixed', () => {
  it('renders a number to the given precision', () => {
    expect(formatFixed(1.2345, 2)).toBe('1.23')
  })

  it('renders an em dash for a missing value', () => {
    expect(formatFixed(null, 2)).toBe('—')
  })

  it('renders zero rather than treating it as missing', () => {
    expect(formatFixed(0, 1)).toBe('0.0')
  })
})

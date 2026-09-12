import { describe, expect, it } from 'vitest'
import { EXAMPLE_LOG } from '../exampleLog'

/**
 * This fixture is the assignment's own log (p.4–5). If it drifts, the anchor
 * test in evaluateLogFile stops proving anything about the spec.
 */
describe('EXAMPLE_LOG', () => {
  const lines = EXAMPLE_LOG.split('\n')

  it('opens with the reference line the spec states', () => {
    expect(lines[0]).toBe('reference 70.0 45.0 6')
  })

  it('contains exactly the six devices the spec lists', () => {
    const devices = lines.filter((line) => /^[a-z]+ [a-z]+-\d+$/.test(line))

    expect(devices).toEqual([
      'thermometer temp-1',
      'thermometer temp-2',
      'humidity hum-1',
      'humidity hum-2',
      'monoxide mon-1',
      'monoxide mon-2',
    ])
  })

  it('keeps the per-device reading counts the spec gives', () => {
    const counts: Record<string, number> = {}
    let current = ''
    for (const line of lines) {
      if (/^[a-z]+ [a-z]+-\d+$/.test(line)) current = line.split(' ')[1] ?? ''
      else if (/^\d{4}-/.test(line)) counts[current] = (counts[current] ?? 0) + 1
    }

    expect(counts).toEqual({
      'temp-1': 13,
      'temp-2': 5,
      'hum-1': 3,
      'hum-2': 5,
      'mon-1': 3,
      'mon-2': 5,
    })
  })

  it('uses only the three sensor types the spec defines', () => {
    const types = new Set(
      lines.filter((line) => /^[a-z]+ [a-z]+-\d+$/.test(line)).map((line) => line.split(' ')[0]),
    )

    expect([...types].sort()).toEqual(['humidity', 'monoxide', 'thermometer'])
  })
})

import { describe, expect, it } from 'vitest'
import { evaluateLogFile } from '../evaluateLogFile'
import { EXAMPLE_LOG } from '../fixtures/exampleLog'
import { LogFormatError } from '../errors'
import { Verdict } from '../types'

describe('evaluateLogFile', () => {
  it('matches the assignment sample output exactly (p.6)', () => {
    expect(evaluateLogFile(EXAMPLE_LOG)).toEqual({
      'temp-1': 'precise',
      'temp-2': 'ultra precise',
      'hum-1': 'keep',
      'hum-2': 'discard',
      'mon-1': 'keep',
      'mon-2': 'discard',
    })
  })

  it('takes exactly one parameter, as the spec requires', () => {
    expect(evaluateLogFile).toHaveLength(1)
  })

  it('reports an unregistered sensor type as unclassified rather than judging it', () => {
    const log = ['reference 70.0 45.0 6', 'lux lux-1', '2007-04-05T22:00 50', '2007-04-05T22:01 90'].join('\n')

    expect(evaluateLogFile(log)).toEqual({ 'lux-1': Verdict.Unclassified })
  })

  /*
    Not `{}`. An empty map would say "evaluated fine, no devices", which is a
    real and different outcome — see the reference-only log below.
  */
  it('throws rather than returning an empty map for input that is not a log', () => {
    expect(() => evaluateLogFile('')).toThrow(LogFormatError)
  })

  it('returns an empty map for a real log that declares no devices', () => {
    expect(evaluateLogFile('reference 70.0 45.0 6')).toEqual({})
  })
})

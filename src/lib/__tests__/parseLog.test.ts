import { describe, expect, it } from 'vitest'
import { LogFormatError } from '../errors'
import { parseLog } from '../parseLog'
import { ReferenceKey } from '../types'

const READING = '2007-04-05T22:00 72.4'

describe('parseLog', () => {
  it("reads the spec's positional reference line", () => {
    const { reference } = parseLog('reference 70.0 45.0 6')

    expect(reference).toEqual({
      [ReferenceKey.Temperature]: 70,
      [ReferenceKey.Humidity]: 45,
      [ReferenceKey.Monoxide]: 6,
    })
  })

  it('reads the extended `reference <type> <value>` form', () => {
    const { reference } = parseLog('reference noise 35.0')

    expect(reference).toEqual({ [ReferenceKey.Noise]: 35 })
  })

  it('ignores an extended reference for an unknown key, but still accepts the log', () => {
    expect(parseLog('reference brightness 900').reference).toEqual({})
  })

  it('groups readings under the device header above them', () => {
    const { devices } = parseLog(
      [
        'thermometer temp-1',
        '2007-04-05T22:00 72.4',
        '2007-04-05T22:01 76.0',
        'humidity hum-1',
        '2007-04-05T22:04 45.2',
      ].join('\n'),
    )

    expect(devices).toEqual([
      {
        type: 'thermometer',
        name: 'temp-1',
        readings: [
          { at: '2007-04-05T22:00', value: 72.4 },
          { at: '2007-04-05T22:01', value: 76 },
        ],
      },
      { type: 'humidity', name: 'hum-1', readings: [{ at: '2007-04-05T22:04', value: 45.2 }] },
    ])
  })

  it('drops a reading that appears before any device header', () => {
    expect(parseLog(READING).devices).toEqual([])
  })

  it('counts non-blank lines and ignores blank ones', () => {
    expect(parseLog('reference 70.0 45.0 6\n\n   \nthermometer temp-1\n').lines).toBe(2)
  })

  describe('the grammar is strict about arity', () => {
    it('skips a device header that is not exactly `<type> <name>`', () => {
      const { devices } = parseLog(['thermometer', 'thermometer temp-1 extra', READING].join('\n'))

      expect(devices).toEqual([])
    })

    it('skips a timestamped line carrying a non-numeric value', () => {
      const { devices } = parseLog(
        ['thermometer temp-1', '2007-04-05T22:00 warm', READING].join('\n'),
      )

      expect(devices[0]?.readings).toEqual([{ at: '2007-04-05T22:00', value: 72.4 }])
    })

    it('still counts a skipped line, because it was in the file', () => {
      expect(parseLog(['thermometer', READING].join('\n')).lines).toBe(2)
    })
  })

  describe('rejects input that is not a sensor log', () => {
    it.each([
      ['empty input', ''],
      ['only blank lines', '\n\n   \n'],
      ['a prose email', 'Dear team,\nplease find the Q3 report attached.\nRegards,\nSam'],
      ['a CSV', 'name,value\nfoo,1\nbar,2'],
      ['an HTML page', '<!doctype html>\n<html><body><p>hi</p></body></html>'],
      ['JSON', '{\n  "a": 1\n}'],
    ])('throws LogFormatError for %s', (_label, text) => {
      expect(() => parseLog(text)).toThrow(LogFormatError)
    })

    it('explains itself, so a caller can log something useful', () => {
      expect(() => parseLog('nope')).toThrow(/not a sensor log/i)
    })
  })

  describe('accepts anything carrying real log syntax', () => {
    it('a reference line alone — an empty batch is still a batch', () => {
      expect(parseLog('reference 70.0 45.0 6').devices).toEqual([])
    })

    it('readings with no reference line', () => {
      expect(parseLog(['thermometer temp-1', READING].join('\n')).devices).toHaveLength(1)
    })

    /*
      The distinction the error exists to preserve: an unknown *type* is a real
      device we have no rule for and must still be reported, whereas an unknown
      *file* is fatal. `lux` is in the sample batch for exactly this.
    */
    it('a device whose sensor type has no registered rule', () => {
      const { devices } = parseLog(['lux lux-1', '2007-04-05T22:00 880'].join('\n'))

      expect(devices).toEqual([
        { type: 'lux', name: 'lux-1', readings: [{ at: '2007-04-05T22:00', value: 880 }] },
      ])
    })
  })
})

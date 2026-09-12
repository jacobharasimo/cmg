import { describe, expect, it } from 'vitest'
import { isLogFormatError, LogFormatError } from '../errors'

describe('LogFormatError', () => {
  it('carries the message and a stable name', () => {
    const error = new LogFormatError('not a log')

    expect(error.message).toBe('not a log')
    expect(error.name).toBe('LogFormatError')
  })

  it('is a real Error, so it survives a throw', () => {
    expect(new LogFormatError('x')).toBeInstanceOf(Error)
  })
})

describe('isLogFormatError', () => {
  it('accepts one', () => {
    expect(isLogFormatError(new LogFormatError('x'))).toBe(true)
  })

  /*
    The reason the guard reads `name` instead of using `instanceof`. A bundler
    or test runner that loads `errors.ts` twice produces two class identities,
    and `instanceof` then rejects an error thrown by the other copy. This stands
    in for that second copy.
  */
  it('accepts a structurally identical error from a duplicate module instance', () => {
    class LogFormatError_Duplicate extends Error {
      public constructor(message: string) {
        super(message)
        this.name = 'LogFormatError'
      }
    }
    const fromOtherCopy = new LogFormatError_Duplicate('x')

    expect(fromOtherCopy).not.toBeInstanceOf(LogFormatError)
    expect(isLogFormatError(fromOtherCopy)).toBe(true)
  })

  it.each([
    ['a different Error', new TypeError('x')],
    ['a plain object wearing the name', { name: 'LogFormatError', message: 'x' }],
    ['a string', 'LogFormatError'],
    ['null', null],
    ['undefined', undefined],
  ])('rejects %s', (_label, value) => {
    expect(isLogFormatError(value)).toBe(false)
  })
})

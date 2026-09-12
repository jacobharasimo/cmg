import { afterEach, describe, expect, it, vi } from 'vitest'
import { reportError } from '../reportError'

/*
  jsdom does not implement `globalThis.reportError`, so these install a stub and
  assert what is handed to the platform. That absence is also the reason the
  function has to tolerate it being missing.
*/
const withPlatformReporter = () => {
  const spy = vi.fn()
  Object.defineProperty(globalThis, 'reportError', {
    value: spy,
    configurable: true,
    writable: true,
  })
  return spy
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'reportError')
})

describe('reportError', () => {
  it('hands the error to the platform, where an SDK can listen', () => {
    const spy = withPlatformReporter()
    const error = new Error('kaboom')

    reportError(error)

    expect(spy).toHaveBeenCalledExactlyOnceWith(error)
  })

  /*
    Context becomes the message and the original becomes `cause`, so the report
    says where it came from without losing the original stack.
  */
  it('wraps the error in its context, keeping the original as the cause', () => {
    const spy = withPlatformReporter()
    const original = new Error('kaboom')

    reportError(original, 'Unhandled error in the React tree')

    const reported = spy.mock.calls[0]?.[0] as Error
    expect(reported.message).toBe('Unhandled error in the React tree')
    expect(reported.cause).toBe(original)
  })

  it('reports a non-Error value as it was thrown', () => {
    const spy = withPlatformReporter()

    reportError('a string was thrown')

    expect(spy).toHaveBeenCalledExactlyOnceWith('a string was thrown')
  })

  /*
    The platform API is not universal — jsdom lacks it entirely. Reporting is a
    side channel, so its absence must never take the caller down with it.
  */
  it('does nothing where the platform has no reporter', () => {
    Reflect.deleteProperty(globalThis, 'reportError')

    expect(() => {
      reportError(new Error('kaboom'), 'context')
    }).not.toThrow()
  })
})

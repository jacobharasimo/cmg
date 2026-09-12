/**
 * Errors the evaluation layer throws.
 *
 * A class rather than an entry in `types.ts`, because it has to exist at
 * runtime: callers need to tell "this file is not a sensor log" apart from
 * "the file could not be read", and only a thrown value can carry that.
 */

const LOG_FORMAT_ERROR = 'LogFormatError'

/**
 * The text handed to `parseLog` is not a sensor log.
 *
 * Thrown only when nothing in the input is recognisable as the grammar on p.4.
 * It is deliberately *not* thrown for an unknown sensor type: that is a real
 * device the library has no rule for, and it takes the `Unclassified` path so
 * the log still reports it. Being unable to grade a device and being handed the
 * wrong file are different failures, and only the second one is fatal.
 */
export class LogFormatError extends Error {
  public constructor(message: string) {
    super(message)
    this.name = LOG_FORMAT_ERROR
  }
}

/**
 * Narrows a caught value to a `LogFormatError`.
 *
 * Matches on `name` rather than `instanceof`. A bundler that loads this module
 * twice — which is what a mocked import in a unit test is — produces two class
 * identities, and `instanceof` then returns false for an error this very file
 * threw. That failure is silent and it misreports the cause, so the check is
 * on a value that survives duplication instead.
 */
export function isLogFormatError(value: unknown): value is LogFormatError {
  return value instanceof Error && value.name === LOG_FORMAT_ERROR
}

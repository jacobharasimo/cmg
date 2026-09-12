/**
 * Where unexpected failures go.
 *
 * Not `console`. A console call is a debugging aid that happens to survive into
 * production, where nobody is watching it — it reaches no dashboard, no alert
 * and no error budget. This forwards to the platform's own `reportError()`
 * instead, which dispatches an `error` event on `window`: DevTools shows it
 * during development, and any error-tracking SDK picks it up in production by
 * listening for exactly that event. Choosing the sink stays a deployment
 * concern rather than something this file hard-codes.
 */

/**
 * Report an unexpected failure.
 *
 * `context` becomes the reported message and the original is preserved as
 * `cause`, so a stack trace survives while the report still says where it came
 * from ("React render tree", not just "Cannot read properties of undefined").
 *
 * Silent where the platform has no `reportError` — jsdom does not implement it,
 * and a test run should not depend on a global side effect. Callers must not
 * rely on this for anything the user needs to see; the error boundary renders a
 * fallback and the snackbar reports upload failures, both independently.
 */
export function reportError(error: unknown, context?: string): void {
  const reported = context === undefined ? error : new Error(context, { cause: error })

  if (typeof globalThis.reportError === 'function') {
    globalThis.reportError(reported)
  }
}

# `src/utils`

Genuine helpers only — pure functions with no React and no domain knowledge.
Anything that knows what a sensor is belongs in `src/lib`; anything that knows
what a component looks like belongs with that component.

| File | |
| --- | --- |
| `csv.ts` | rows → CSV text, and handing the browser a file to save |
| `format.ts` | number, size and duration formatting |
| `reportError.ts` | the one sanctioned way to record an unexpected failure |

Tested on **node**, alongside `src/lib` — nothing here should need a DOM.

## `csv.ts`

`toCsv` quotes a cell only when it contains a comma, quote or newline, and
doubles embedded quotes. `downloadCsv` is the one function here that touches the
DOM: it revokes its object URL on the next tick, because the click has already
started the download and holding the blob leaks it.

The five export buttons build their rows **at click time**, so an export always
reflects the current thresholds and filter rather than whatever was on screen
when the component mounted.

## `format.ts`

`formatFixed` renders an em dash for `null`, which is how the device table shows
"no reference to measure against" — distinct from a real zero. That distinction
is the reason it exists rather than callers using `toFixed` directly.

## `reportError`

The one sanctioned way to record an unexpected failure. **`console` is banned**
— a lint rule enforces it outside tests — because a console call is a debugging
aid that survives into production, where nothing is watching it: no dashboard,
no alert, no error budget.

`reportError` forwards to the platform's own `reportError()`, which dispatches
an `error` event on `window`. DevTools shows it in development and an
error-tracking SDK picks it up in production by listening for that event, so
choosing the sink stays a deployment concern rather than something the app
hard-codes. It is silent where the platform lacks the API (jsdom), which is why
nothing user-facing may depend on it — the error boundary renders a fallback and
the snackbar reports upload failures, both independently.

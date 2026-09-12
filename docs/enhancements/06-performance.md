# 06 — Performance

Measured against this build, not estimated. The headline is that the obvious
optimisation is the wrong one.

## What was measured

**Bundle**, from `npm run build`:

| Chunk | Raw | Gzipped |
| --- | --- | --- |
| entry | 481 kB | 154 kB |
| `Dashboard` (lazy) | 584 kB | 191 kB |
| **total** | **1,065 kB** | **345 kB** |

The route split is already doing work — the entry chunk carries React, MUI and
the router, and the Dashboard chunk carries Highcharts. Both are needed for
first meaningful paint, so today the split buys parse-time overlap rather than
bytes saved. (An aggregate `src/components/index.ts` barrel was tried and removed;
importing through it collapsed the split and pushed the entry chunk
from 453 kB to 1,044 kB, measured at the time. That is why the barrels are
per-component.)

**Evaluation**, `evaluateBatch` over scaled copies of `synthetic_log_test.txt`:

| Log | Lines | Devices | Parse + evaluate |
| --- | --- | --- | --- |
| 0.05 MB | 2,442 | 46 | 2 ms |
| 0.51 MB | 24,411 | 460 | 8 ms |
| 2.57 MB | 122,051 | 2,300 | 43 ms |

Linear, and fast. A 2.5 MB log is fully parsed and judged in 43 ms.

## The constraint

**Evaluation is not the bottleneck, and optimising it would be wasted work.**
The instinct on seeing "production logs are likely to be very large" is to reach
for a worker or an incremental parser. The numbers say otherwise: 43 ms for
2.5 MB is not what a user would notice.

What they would notice is everything downstream of it.

**The table used to render every device — this one is now done.** Each
`DeviceRow` is 8 `TableCell`s, so 2,300 devices meant ~18,400 cells plus MUI's
per-cell Emotion styling on first render. `useVirtualRows` now windows it: at
the 46-device batch the DOM holds 28 rows near the top and 17 at the bottom,
and the count no longer grows with the log. The remaining items below are not.

**Threshold drags re-evaluate synchronously.** `useDeviceReport` memoises on
`[text, thresholds]`, and MUI's `Slider` `onChange` fires on every pointer move.
Each frame therefore re-parses the entire log. At 46 devices that is 2 ms and
imperceptible. At 2,300 it is 43 ms against a 16 ms frame budget — the drag drops
to roughly 20 fps, and the re-parse is pure waste, because the text has not
changed.

**Parsing is coupled to evaluation.** `evaluateBatch(text, thresholds)` takes
the raw string, so there is no way to hold parsed readings and re-judge them.
The coupling is what makes the drag expensive.

**The whole log lives in memory as a string, plus again as objects.** Both are
held for the lifetime of the session, and a `File` is read with `file.text()` —
fully buffered before a single line is parsed.

## The proposal

In the order the measurements justify.

**1. Virtualise the device table — done.** It was the biggest win and local to
one component. `useVirtualRows` returns the slice plus two spacer heights, which
`DeviceTable` renders as empty rows so `scrollHeight` still measures the whole
batch.

The accessibility work went with it rather than after: the table carries
`aria-rowcount` and every row its `aria-rowindex` in the batch, or a screen
reader counts the DOM and reports twenty devices. Row height is measured from a
`ResizeObserver` rather than hard-coded, so the window stays aligned at 200%
zoom and under increased text spacing (1.4.4, 1.4.12).

No dependency was added. `react-virtuoso` is what MUI's own docs reach for, but
the rows here are uniform (measured: every one exactly 41px) inside a
fixed-height container, which is the case windowing is trivial for — about
sixty lines against ~17kB gzipped.

The one thing windowing costs: a row focused and then scrolled far out of view
unmounts, and focus falls to `body`. Overscan makes it unlikely, and tabbing
never triggers it because the browser keeps the focused row in view. Worth
revisiting if it is ever observed.

**2. Split parsing from evaluation.** Change the internal entry point to take
parsed input:

```ts
const parsed = useMemo(() => parseLog(text), [text])          // once per log
const report = useMemo(() => evaluate(parsed, thresholds), [parsed, thresholds])
```

`evaluateLogFile(logContentsStr)` — the graded signature — is unaffected; it
composes the two. This turns each drag frame from a full re-parse into
arithmetic over arrays already in memory.

**3. Defer the drag — until the API makes the question moot.** While
everything is client-side, keep the slider's displayed value immediate (it is
the label being read) and re-evaluate on `onChangeCommitted`, with a
`useDeferredValue` pass so the mid-drag preview updates when there is idle time.
Debouncing the number itself would make the control feel broken.

This is an interim measure with a short life. Once devices are paginated, a
client-side re-evaluation can only cover the page it holds, so
[01](01-from-file-to-api.md) replaces the whole mechanism with an Apply button and a
server round-trip. Do it now — it is a few lines — and treat it as scaffolding.

**4. Charts on demand.** The route already lazy-loads the Dashboard, but every
chart sits inside it — the ranking panel plus the detail panel's series and
histogram — so Highcharts is unavoidable on first paint. Under the routes in
[05](05-information-architecture.md) the overview needs the ranking chart and
the detail page needs the other two, which puts a real boundary between them and
takes the bulk of the 594 kB off the first request.

**5. Bound the ranking chart, which does not window.** Virtualising the table
fixed the DOM, but the ranking chart still draws one bar per device and
Highcharts has no equivalent of `useVirtualRows` — 2,300 bars is 2,300 SVG
paths, plus a data label each. `rankingHeight()` already scales the canvas with
the count, which at that size is a 64,000px-tall chart nobody can read.

The fix is not a chart-side one. Once the chart plots the rows the table is
showing ([05](05-information-architecture.md)), it draws at most a page — 50
bars — and the problem cannot recur however large the batch grows. Paging the
table is what bounds the chart.

**6. Stream the upload.** `file.text()` buffers the whole file. A
`ReadableStream` over lines would let parsing start on the first chunk and cap
peak memory at one device block. Do this only once the buffer itself is the
problem, which the measurements put well above 2.5 MB.

**7. Aggregate server-side.** Past a few thousand devices the answer stops being
"do it faster" and becomes "do less". Per [01](01-from-file-to-api.md), the
BFF returns pre-computed `DeviceReport`s and the client fetches a page at a time.
`evaluateBatch` still ships to the browser so the sliders stay interactive
against the summaries — the what-if stays local, the authoritative pass does not.

## Budgets worth holding

| | Target | Today (46 devices) |
| --- | --- | --- |
| First contentful paint | < 1.5 s on 3G | not yet measured |
| Transferred JS | < 200 kB gzipped | 345 kB |
| Threshold drag | 60 fps | met; fails ~500+ devices |
| Log → verdicts | < 100 ms per MB | 17 ms per MB |
| A page of devices, server-side | < 200 ms at p95 | n/a — no API yet |

The last row is the one worth keeping in view: the library is comfortably inside
budget, which is precisely why none of the proposals above are about the
library.

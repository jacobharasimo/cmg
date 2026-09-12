# Sensor QC Console

A React SPA that evaluates sensor quality-control logs, plus the library that
does the evaluating.

`evaluateLogFile()` is the deliverable. The console exists to make its rules
auditable — every verdict on screen can be traced back to the check that
produced it, and the thresholds behind those checks can be moved to see the
whole batch re-evaluate.

---

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
```

Requires **Node 20+** (developed on 24.20).

| Script | |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck, then production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Vitest — one isolated test file per source file |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright — accessibility and keyboard, in a real browser |
| `npm run test:e2e:ui` | Playwright in UI mode |
| `npm run coverage` | Coverage report |
| `npm run typecheck` | `tsc -b`, no emit |
| `npm run lint` | ESLint (`lint:fix` to autofix) |

`test:e2e` builds the app and serves it; a first run also needs
`npx playwright install chromium`.

### Dependencies

| | |
| --- | --- |
| React | 19.3 |
| TypeScript | 6.0 — `strict`, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` |
| MUI | 9.4 (with Emotion) |
| React Router | 7.18 |
| Highcharts | 13.0 |
| Vite | 8.3 |
| Vitest | 5.0 + Testing Library |
| Playwright | with `@axe-core/playwright` |

---

## The deliverable

The assignment fixes the signature — one string parameter:

```ts
evaluateLogFile(logContentsStr: string): Record<string, Verdict>
```

The anchor test is the spec's own example log and its stated output, asserted
exactly:

```ts
evaluateLogFile(EXAMPLE_LOG) // →
{ 'temp-1': 'precise',  'temp-2': 'ultra precise',
  'hum-1':  'keep',     'hum-2':  'discard',
  'mon-1':  'keep',     'mon-2':  'discard' }
```

Because that signature can't take options, the adjustable thresholds the UI
needs go through a second entry point beneath it —
`evaluateBatch(text, thresholds)` — which also returns the statistics and rule
traces the console displays. `evaluateLogFile` is that function with the spec's
defaults, reduced to name → verdict.

---

## Approach

**A registry of strategies, not a `switch`.** Each sensor type owns how it is
judged. Sensor types are a string enum and the registry is typed
`Record<SensorType, SensorStrategy>`, so **adding a member to the enum fails to
compile until its strategy exists.** The brief says more
sensor types are coming; this is that claim made mechanical rather than
asserted. A `noise` strategy is registered to demonstrate it — that one is not
from the spec.

**Hooks are the data boundary.** No component imports `parseLog` or
`evaluateLogFile`. `useSensorLog` owns where the log comes from, so serving it
from an API later changes one file and moves no components.

**The theme drives the styling.** One theme object holds every colour, radius,
font and spacing value; `src/theme/foundations/palette.ts` is the only file in
the app permitted to contain a hex literal, chart options included.

**Accessibility is tested, not asserted.** WCAG 2.2 AA. Contrast ratios were
computed rather than eyeballed, and two of the design's colours were changed
because they failed.

---

## Trying it

The console opens on the assignment's own log, so the six verdicts on p.6 can be
read straight off the screen.

For a batch with some size to it, feed
[`synthetic_log_test.txt`](synthetic_log_test.txt) — 46 devices over 2,441
lines — through **Upload log…**, or drop it on the log bar. Dragging is never
the only route; the button does the same job. It lives at the repo root rather
than in `public/` so it is never served: the only way in is the one a user
takes.

[`synthetic_log_failure_test.txt`](synthetic_log_failure_test.txt) is its
opposite — a file that is not a log at all. Upload it and the console rejects
it, reports why in a banner across the top, and leaves the previous log on
screen. The e2e suite uses the same two files, so what you can try by hand and
what CI checks cannot drift apart.

## Decisions worth defending

**A damaged log is tolerated; the wrong file is rejected.** The parser skips a
line it cannot read, because a log is a field artefact. But every kind of line
has a fixed number of tokens, and prose still contains two-token lines, so an
uploaded email used to parse into four devices with zero readings and report a
clean batch of nothing. `parseLog` now throws `LogFormatError` when the input
has no readings *and* no reference line. `evaluateLogFile` propagates it rather
than returning `{}`, which would be indistinguishable from a real log that
declares no devices.

**An unregistered sensor type is reported, never judged.** A log can contain a
type nothing knows how to grade. Borrowing another type's thresholds would
invent a verdict the log gives no basis for, so those devices come back
`unclassified` with a trace explaining that this is an absence of criteria, not
a failed check. `synthetic_log_test.txt` carries `lux` devices to exercise this.

**Thermometers show no out-of-tolerance count.** They are judged on the mean and
σ of the whole series, so a per-reading count would imply a rule that doesn't
exist. That column reads `—` for them.

**The sensor filters are a radio group, not toggle buttons.** It's a one-of-N
choice, which is what radios are, so exclusivity, arrow-key movement and a
single tab stop all come from the browser. The component writes no
`aria-pressed` and no key handlers — there's a test asserting it emits none.

**A device row is selected by a real button, and that selection does not follow
focus.** Selecting a device drives the detail view — charts and a rule trace. As
a radio group, arrowing through 46 devices would rebuild all of that 46 times,
so this one takes explicit activation, unlike the filters. No row carries a
`tabIndex`, and no key handler is hand-written.

**The CO detector is labelled "CO", not the design's "CO2".** CO2 is carbon
dioxide; the spec's sensor measures carbon monoxide and its readings are ppm of
CO (p.3). The design canvas is authoritative for copy, but not for naming the
wrong gas on a safety device — and "CO" is a character shorter, which was the
reason the canvas abbreviated it at all.

**Two contrast fixes.** The histogram bar colour was 2.84:1 against the card
surface, failing 1.4.11 for a meaningful graphic; it now uses the control token
at 3.63:1. And the decorative border colour (1.6:1) is kept strictly off
anything that bounds a control.

---

## Where to look

Every folder under `src/` has a README covering how its files relate. The four
worth reading first:

| | |
| --- | --- |
| [`src/lib/`](src/lib/README.md) | the rules, the two entry points, and **how to add a sensor type** |
| [`src/hooks/`](src/hooks/README.md) | the data boundary and the API-swap seam |
| [`src/components/`](src/components/README.md) | presentational rule, styling limits, the accessibility decisions |
| [`src/theme/`](src/theme/README.md) | token flow, and the two colours that are easy to misuse |

The rest: [`pages`](src/pages/README.md) ·
[`router`](src/router/README.md) ·
[`providers`](src/providers/README.md) ·
[`utils`](src/utils/README.md) ·
[`test`](src/test/README.md)

```
src/
  lib/          how sensors are judged — plain TS, no React/MUI/DOM
  hooks/        the data boundary components consume
  components/   MUI composition, one folder per component
  pages/        owns the hooks, passes plain props down
  providers/    app-level context providers
  theme/        foundations → component overrides
  router/       route table, paths and the route error element
  utils/        csv and formatting helpers
```

---

## Tests

**539 unit tests, 40 end-to-end, 93.0% statement coverage.**

```bash
npm test          # Vitest — 539 tests
npm run test:e2e  # Playwright — 40 tests
```

### Vitest — functional, isolated, one file at a time

One test file per source file, in that folder's `__tests__/`. Every source file
has one, with three deliberate exceptions: `types.ts` files (erased at compile
time — the enums in them are asserted by the registry tests that consume them),
`index.ts` barrels, and `main.tsx`, which is the composition root and is covered
by the e2e suite booting the app.

Imports that cross a file boundary are mocked, so a failure names the file that
broke rather than the file that noticed.

We test only what we wrote. MUI supplies `Alert`'s role and close button, and
Snackbar's positioning; those are exercised where they matter — the axe scan
and keyboard pass — not re-asserted in unit tests.

Two projects, and the split is load-bearing:

| Project | Environment | Covers |
| --- | --- | --- |
| `lib` | **node** | `src/lib`, `src/utils` — no DOM available, so a stray React import fails the run rather than passing quietly |
| `ui` | jsdom | everything else |

Queries are by role and accessible name. No `data-testid`, and no assertions on
class names — the one styling assertion I wrote got deleted for that reason.

Worth singling out:

- **`evaluateLogFile`** — the assignment's own example log asserted against its
  stated output, byte for byte. The anchor for everything else.
- **`palette`** — contrast ratios are *computed in the test*, so the figures
  quoted in these docs cannot drift from what ships. It asserts that `divider`
  deliberately fails 3:1 and `outline` deliberately passes, which is what keeps
  anyone from merging the two.
- **`typography`** — every size even, every line height a multiple of 4, so the
  8-point grid is enforced rather than described.
- **registries** — `STRATEGIES` and `RANKING_CHARTS` are each asserted to cover
  every member of the `SensorType` enum.

### Playwright — accessibility, in a real browser

jsdom has no layout, no paint and no real focus, so the criteria that matter
most for this UI cannot be evaluated there. These run against the production
build.

| Spec | Covers |
| --- | --- |
| `accessibility.spec.ts` | axe scans at rest and after filtering, selecting and moving a threshold |
| `keyboard.spec.ts` | 2.1.1 and 2.4.7 — every control reachable, focus always painted, arrow keys inside the radio group, sliders operable |
| `targetSize.spec.ts` | 2.5.8 — computed `boundingBox()` ≥ 24×24 for every interactive element |
| `focusNotObscured.spec.ts` | 2.4.11 — a row focused deep in the scrolled table is not hidden under the sticky header |
| `logSource.spec.ts` | 2.5.7 — uploading a log re-evaluates the batch, and every drag interaction has a button equivalent |
| `ranking.spec.ts` | clicking a bar selects that device, drives the same state as the table, and marks the row with a caret rather than colour alone |
| `virtualisation.spec.ts` | the windowed table: fewer rows in the DOM than the batch, `aria-rowcount`/`aria-rowindex` reporting the real size, scrolling swaps rows, and axe while scrolled |
| `errorBanner.spec.ts` | rejecting a file that is not a log: the message, the dismiss routes, target size and an axe scan with the bar open |

These earned their place immediately. Three real bugs came out of the first run,
none of which any unit test could have seen:

1. **Every MUI control had no visible focus indicator.** `ButtonBase` sets
   `outline: 0`, which silently overrode the global `:focus-visible` rule — so
   every button, sort label and row button failed 2.4.7. Fixed by attaching the
   ring to MUI's own `Mui-focusVisible` class.
2. **Verdict chips on a selected row fell to 4.29:1.** The selection tint sits
   *behind* them and becomes part of their background; checking colours against
   the base surface alone missed it.
3. **Row buttons were 16px tall**, under the 2.5.8 minimum.

The second had a sting in the tail: MUI's `TableRow` composes its background
from `alpha(primary.main, action.selectedOpacity)` and never reads
`action.selected`, so the obvious fix changed nothing and the scan still failed.

---

## What I'd do next

[`docs/enhancements/`](docs/enhancements/README.md) — the brief invites
advocating for improvements, and those arguments are more honest made from a
finished implementation than in the abstract, so they were written last and each
one cites the code or the measurement that provoked it.

| | |
| --- | --- |
| [01 — From an uploaded file to an API](docs/enhancements/01-from-file-to-api.md) | why a text file is the wrong interface, and what replaces it |
| [02 — The data model](docs/enhancements/02-data-model.md) | the entities behind the API, and one canonical unit on the wire with conversion at the edge |
| [03 — The API contract](docs/enhancements/03-api-contract.md) | the endpoints, returning JSON already shaped for the screen |
| [04 — Pagination and caching](docs/enhancements/04-pagination-and-caching.md) | serving those endpoints at volume, and what it leaves the browser doing |
| [05 — Information architecture](docs/enhancements/05-information-architecture.md) | one dense screen serves the engineer auditing rules and nobody else |
| [06 — Performance](docs/enhancements/06-performance.md) | measured: evaluation runs 2.5 MB in 44 ms, so the table and the bundle are the real cost |
| [07 — Scale](docs/enhancements/07-scale.md) | adding a type is 6 edits, 4 compiler-enforced — and the one assumption that breaks first |

The through-line: the client infers structure from whitespace, invents the
concept of an unregistered sensor type because a text file gives it nothing to
validate against, and can only see the one batch it was handed. All three are
fine at kilobytes and none survives the production data p.7 describes.

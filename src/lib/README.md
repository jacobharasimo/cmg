# `src/lib` — how sensors are judged

The assignment's deliverable. Plain TypeScript: no React, MUI, Highcharts or
DOM. Its tests run in the `lib` Vitest project on **node**, so a stray UI import
fails the run rather than quietly passing.

## The required export

The spec (assignment p.6) fixes the signature — one string parameter:

```ts
evaluateLogFile(logContentsStr: string): Record<string, Verdict>
```

Because that shape can't take options, adjustable thresholds go through a
second entry point beneath it:

```ts
evaluateBatch(text: string, thresholds: Thresholds): BatchReport
```

`evaluateLogFile` is `evaluateBatch` with `DEFAULT_THRESHOLDS`, reduced to
name → verdict. The UI only ever calls `evaluateBatch`, via `useDeviceReport`.

## The rules (assignment p.3)

| Sensor | Judged on | Verdicts |
| --- | --- | --- |
| thermometer | mean deviation **and** σ of the whole series | `ultra precise` / `very precise` / `precise` |
| humidity | every individual reading, within 1% | `keep` / `discard` |
| monoxide | every individual reading, within 3 ppm | `keep` / `discard` |
| noise | every individual reading — **not in the spec** | `keep` / `discard` |

Failing the thermometer's mean check caps it at `precise` however tight σ is.
For the per-reading types, one bad reading discards the device.

**`noise` is our own addition.** p.7 names "a noise level detector" as a future
sensor type, so it is registered here to show that adding one is additive — its
3 dB threshold is not from the spec.

## Two invariants worth not breaking

**An unregistered type is reported, never judged.** `strategyFor` falls back to
`unregistered`, which returns `Verdict.Unclassified` and a trace saying why.
Borrowing another type's thresholds would invent a verdict the log gives no
basis for. The sample data ships `lux` devices to exercise this path — they are
not a bug.

**Thresholds are arguments, never literals in a branch.** That is what lets the
UI's sliders re-evaluate a whole batch without a rule being rewritten.

## Adding a sensor type

The compiler drives it. Add the enum member first and the build breaks until
every place that must handle it does:

1. `types.ts` — add to the `SensorType` enum (and `ReferenceKey` if it needs a
   reference value of its own).
2. `strategies/<type>.ts` — **one file per sensor type**, named for the enum
   member. If it judges reading-by-reading, the file is a `perReadingStrategy()`
   call and a few constants; if its rule has a shape of its own, it is written
   here the way `thermometer.ts` is.
3. `strategies/registry.ts` — register it in `STRATEGIES`. Typed
   `Record<SensorType, SensorStrategy>`, so omitting this step fails to compile.
4. `thresholds.ts` — add its threshold to `Thresholds` and the defaults.
5. `components/RankingPanel/rankingRegistry.ts` — add its ranking chart. Typed
   the same way, and fails the same way.
6. `components/ThresholdPanel` — add its slider. **This is the one step the
   compiler does not force**, because `SLIDERS` is an array rather than a record
   keyed by type. See `docs/enhancements/07-scale.md`.

No existing strategy is touched, and nothing switches on a sensor type.

**One file per sensor is the point, not tidiness.** It is where anything
type-specific lands as the system grows — a rule that stops fitting
`perReadingStrategy`, unit conversion for a quantity that has one, per-device
references. Today `humidity.ts`, `monoxide.ts` and `noise.ts` are each a dozen
lines of configuration, and that is exactly what a good extension point looks
like before it is needed.

## Layout

```
types.ts            every type, interface and enum for this layer
parseLog.ts         the log grammar (p.4), and what is not a log at all
errors.ts           LogFormatError, and the guard that narrows to it
stats.ts            mean, σ, deviations, out-of-tolerance counts
thresholds.ts       DEFAULT_THRESHOLDS
evaluateLogFile.ts  both entry points
strategies/         one file per sensor type, plus registry.ts and the
                    shared per-reading factory
fixtures/           the spec example log
```

## A damaged log is tolerated; the wrong file is not

`parseLog` skips a line it does not recognise rather than throwing — a log is a
field artefact, and one corrupt line should not cost the rest of the file.

That tolerance alone is dangerous. Every production of the grammar has a fixed
arity, but prose, CSV and HTML still contain two-token lines, so a non-log used
to parse "successfully":

| Uploaded | Devices found | Readings |
| --- | --- | --- |
| a prose email | 4 | **0** |
| a CSV | 3 | **0** |
| an HTML page | 2 | **0** |

The console would then report a clean batch of nothing. So the *file* is checked
even though its lines are not: if the input contains **no readings and no
reference line**, nothing in it is sensor-log syntax and `parseLog` throws
`LogFormatError`.

Two things it deliberately does **not** reject:

- **An unknown sensor type.** That is a real device with no rule, and it comes
  back `Unclassified`. Being unable to grade a device and being handed the wrong
  file are different failures; only the second is fatal.
- **An unknown reference key.** `reference brightness 900` is a log talking
  about a quantity we have no `ReferenceKey` for. The value is dropped, but the
  line still proves this is a log.

`evaluateLogFile` propagates the throw, so it no longer returns `{}` for input
it could not read. An empty map would be indistinguishable from a real log that
declares no devices — which `reference 70.0 45.0 6` alone still is.

Narrow with `isLogFormatError`, not `instanceof`: a bundler or test runner that
loads `errors.ts` twice produces two class identities, and `instanceof` then
rejects an error this library threw. The guard matches on `name`, which
survives duplication.

## The app ships with one log

`fixtures/exampleLog.ts` is the spec's own log, and it is the only one bundled —
the console opens on it, so the six verdicts on p.6 can be read straight off the
screen.

`synthetic_log_test.txt` at the repo root is a separate, larger artefact: 46
devices over 2,441 lines, committed as a real file and never imported. It sits
at the root rather than in `public/` precisely so it is **not** served — the app
has no way to fetch it even by accident, which is the property that keeps the
upload path honest.

It is there to be fed through **Upload log…** by hand, so that path gets
exercised against a realistic batch — including the `lux` devices that prove an
unregistered type is reported rather than judged.

`synthetic_log_failure_test.txt` beside it is the negative case: prose rather
than a log, which `parseLog` rejects with `LogFormatError`. Both files are what
`e2e/` uploads, so the manual and automated checks exercise the same input.

## Tests

Run on **node**, not jsdom — a React import here fails the run rather than
passing quietly. One test file per source file.

`fixtures/exampleLog.ts` is the spec's own log, and
`__tests__/evaluateLogFile.test.ts` asserts its stated output byte for byte.
That is the anchor for everything else: `exampleLog` has its own test pinning
the fixture to the spec's device list and per-device reading counts, so the
anchor cannot quietly stop proving anything.

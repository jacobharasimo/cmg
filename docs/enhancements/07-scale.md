# 07 — Scale: adding sensor types

p.7 says 365-Widgets will be adding more sensor types. This is what that costs
today, what is already free, and the one assumption that breaks first.

## What is already additive

Adding a type is six edits, and **four of them are forced by the compiler**.
`SensorType` is a string enum, and both registries are typed as total records
over it:

```ts
export const STRATEGIES: Readonly<Record<SensorType, SensorStrategy>> = …
export const RANKING_CHARTS: Readonly<Record<SensorType, ComponentType<RankingChartProps>>> = …
```

Add a member and neither object type-checks until its entry exists. That is the
extensibility claim made mechanical rather than asserted — the compiler, not a
checklist, is what stops a half-added sensor from shipping.

| Step | Enforced by |
| --- | --- |
| Add the member to `SensorType` | — it is the trigger for the rest |
| Write `strategies/<type>.ts` | `tsc` — the registry cannot import what does not exist |
| Register it in `STRATEGIES` | `tsc` — `Record<SensorType, …>` |
| Add its threshold to `Thresholds` | `tsc` — the interface is not partial |
| Register a ranking chart in `RANKING_CHARTS` | `tsc` — same |
| Add its slider to `ThresholdPanel` | **nothing** — see below |

Two tests assert the registries cover every enum member, so the guarantee holds
even if the record type is ever loosened.

**Nothing switches on sensor type.** `strategyFor(type)` resolves through the
registry and falls back to `unregistered`; the only `switch` in the codebase is
over `SortKey` in `useDeviceSelection`. That is what makes the steps above the
*complete* list rather than the start of a hunt.

**A new type inherits its unit handling.** Conversion is keyed by quantity, not
by sensor type ([02](02-data-model.md)), so a second temperature sensor gets the
metric view for free and a type measuring something with no metric counterpart
needs nothing at all. Declaring the quantity is the whole of it.

**Each sensor already owns a file.** `humidity.ts`, `monoxide.ts`, `noise.ts`
and `thermometer.ts` sit beside each other in `src/lib/strategies`, and
`registry.ts` is wiring alone. Three of the four are a dozen lines of
configuration today — the value is that there is an obvious place for the fourth
thing a type eventually needs, whether that is a rule that stops fitting
`perReadingStrategy`, a conversion, or a per-device reference. Extension points
are cheap to establish before they are needed and expensive afterwards.

**The filters, the summary and the CSV need no edit.** They are driven from
`Object.values(SensorType)` and from the strategy's own `label`, `shortLabel`
and `unit`. This is the concrete payoff of the enum over a string union: the
union would vanish at runtime and each of those places would need its own
hand-maintained list.

That claim was checked rather than assumed, and it did not hold at first:
`filterOptions` kept a private `Record<SensorType, string>` of chip names,
because a chip abbreviates them ("CO", not "CO detector"). Two lists the
compiler cannot compare — it can tell a registry is missing an entry, but not
that two entries disagree. The short name is now `shortLabel` on the strategy,
so each sensor owns both of its names and there is one list again.

`noise` is the worked example. It is not in the spec — p.7 names it as a future
type — and it was added exactly this way: one `perReadingStrategy` call, one
registry entry, one threshold, no edit to any existing rule. It carries the note
`registered post-hoc: no core code changed`, which surfaces in the UI.

## What is not additive

**`Thresholds` is a flat object with per-type field names.**

```ts
interface Thresholds {
  readonly thermometerMean: number
  readonly thermometerSdUltra: number
  readonly thermometerSdVery: number
  readonly humidity: number
  readonly monoxide: number
  readonly noise: number
}
```

It grows a field per type, and thermometers already take three because their
rule has a different arity. `ThresholdPanel` carries a hand-written `SLIDERS`
array to match — a second list to keep in step, and the one place a new type can
be added without the compiler noticing, because a missing slider is a missing
array element, not a missing record key. **Nesting thresholds under the strategy
that owns them** fixes both: the strategy declares its own parameters with
labels, ranges and units, and the panel renders whatever it finds. Adding a type
then adds its sliders for free, and the arity mismatch stops being special.

**Reference values assume one global value per type.** `ReferenceValues` is
keyed by `ReferenceKey`, so every thermometer in a batch is judged against the
same number. That mirrors the spec's `reference` line, and it is wrong the
moment two sensors sit in different rooms. Per-device references belong in the
datastore ([01](01-from-file-to-api.md)), and the change here is that
`ReferenceValues` becomes a lookup by device with a per-type default.

**`ReferenceKey` duplicates `SensorType`.** Four members each, currently
identical strings. They are genuinely different concepts — a type is what a
device *is*, a reference key is what it is *compared against*, and several types
could share one — but as long as they are parallel enums, adding a type means
remembering both, and only one of them is compiler-checked.

**Verdicts are a closed enum across all types.** `Verdict` mixes the
thermometer's three-way grading with the per-reading keep/discard. A type
needing its own vocabulary — a battery reporting `degraded` — extends a shared
enum, and every consumer that renders a verdict colour or count must handle it.
Verdicts belong to the strategy, with the shared layer knowing only severity.

## When types come from the server

Everything above assumes sensor types are known at compile time. Once the BFF
declares them — which is where [01](01-from-file-to-api.md) leads — that
assumption inverts, and the compile-time registry needs a runtime counterpart.

The registry stays; what changes is what fills it and what happens on a miss.

- **The strategy becomes data for the common cases.** Every per-reading type is
  already the same function with different constants — `perReadingStrategy({...})`
  is that abstraction. A server-sent `{ type, label, unit, tolerance, referenceKey }`
  can be turned into a working strategy at runtime with no new code. Only a type
  with a genuinely new rule shape, as the thermometer has, needs shipped code.
- **`unregistered` becomes the normal path, not the edge.** Today a type without
  a strategy means we have not built it yet. In a server-declared world it means
  the client is older than the fleet, which is routine. It already does the right
  thing: reports the device, states plainly that no criteria exist, and never
  borrows another type's thresholds to invent a verdict. That decision was made
  for correctness and it is what makes rolling deployments safe.
- **Exhaustiveness moves from compile time to a contract test.** The `Record`
  check disappears with the hard-coded enum. Replace it with a test that fetches
  the server's declared types and asserts the client can render each one —
  catching drift in CI rather than at runtime.

## Summary

| | Today | After |
| --- | --- | --- |
| Add a type | 6 edits, 4 compiler-enforced | strategy from server data; code only for new rule shapes |
| Add its sliders | hand-written in `SLIDERS` | declared by the strategy |
| Unknown type | `unclassified` — an edge case | `unclassified` — the expected path |
| Exhaustiveness | `Record<SensorType, …>` at compile time | contract test against the server |
| Reference values | one per type, batch-wide | per device, with a type default |

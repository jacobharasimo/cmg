# 01 — From an uploaded file to an API

The case for the change. What the data then looks like is
[02](02-data-model.md); how it is asked for is [03](03-api-contract.md).

## The constraint

The problem is not that the log format is bad — it is that **a text file is
the interface at all.**

Everything awkward in `src/lib/parseLog.ts` is downstream of that one decision,
and none of it is fixable by choosing nicer syntax:

```
reference 70.0 45.0 6            three values, meaning fixed by position
thermometer temp-1               a device block starts
2007-04-05T22:00 72.4            a reading in that block
```

**Position carries meaning that nothing declares.** The reference line's three
values are temperature, humidity and monoxide *because they are first, second
and third*. `SPEC_REFERENCE_ORDER` is a constant in our code encoding a
convention the file never states.

**There are no units.** `72.4` could be Fahrenheit or Celsius; `6` could be ppm
or mg/m³. The spec's thresholds — 0.5°, 1%, 3 ppm — are only correct if every
producer agrees on units forever, and nothing records the agreement. A device
shipping Celsius would not error. It would be judged, confidently, and wrongly.

**A line's role is inferred, not declared.** `parseLog` decides a line is a
reading because it starts with something matching a timestamp regex. Corruption
is indistinguishable from new data, which is why the parser needs a
whole-file plausibility check just to reject an uploaded email.

**Sensor type is a bare string with nothing to validate against.** This is the
root of the design's most-defended decision. `isSensorType()`, the unregistered
strategy and `Verdict.Unclassified` all exist because the file can name a type
we have no rule for and gives us no way to know whether that is a new sensor or
a typo. We report it rather than judge it, which is right — but it is a
client-side workaround for the absence of a schema.

**And nothing accumulates.** A file is a snapshot someone happened to keep.
Load the next one and the previous readings are gone, so no question that spans
more than one batch — drift, trend, this device against last month — can be
asked at all.

## The proposal

**Readings live in a datastore. The client talks to a BFF that serves JSON.**
The uploaded file stops being the interface.

```
sensors ──▶ ingestion ──▶ datastore ──▶ BFF ──▶ JSON ──▶ console
            (out of scope)
```

**How readings reach the datastore is deliberately abstracted.** Devices
pushing directly, a gateway batching on their behalf, an agent tailing today's
log files during migration — all of it sits behind the API, and none of it is
the client's concern. That indifference is the point: the console asks for
devices and readings, and cannot tell how they arrived.

Two consequences fall out immediately, and neither needs a new file format:

- **The schema is the database's job.** Sensor type becomes a real column with
  referential integrity, a unit is a declared property of a device rather than
  a convention, and a reading cannot exist without the device it belongs to.
  None of that can be expressed in a log line.
- **Validation happens once, at ingestion, on the way in** — instead of in
  every client, on every load, forever.

### Where the rest of this goes

| | |
| --- | --- |
| [02 — The data model](02-data-model.md) | the entities behind the API, and units as data rather than a printed suffix |
| [03 — The API contract](03-api-contract.md) | endpoints, pagination, caching, and what is left for the browser to do |

## What happens to the upload

It survives, demoted. Handing the console a file is still the fastest way to
look at a batch that is not in the system yet — a field engineer with a log off
a bench unit, or a support case. It stops being *the* way data arrives, and
becomes one source among two.

That costs almost nothing to keep: `useSensorLog` already owns where a log comes
from, and the hooks README calls it out as the single file that becomes a
`fetch()`. Adding an API source is a change there and nowhere else.

## What it buys

- **Units make the thresholds trustworthy.** 0.5° means something once the
  device record says which degrees — and once the quantity is declared, letting
  a reader switch temperature units becomes a formatting concern rather than a
  reinterpretation of the data.
- **`Unclassified` changes meaning.** Today it covers both "new sensor type" and
  "this file is damaged". With a validated type it is a known-unknown the server
  can flag — see [07](07-scale.md), where types become server-declared.
- **Pagination becomes possible at all.** A file has no page 2. This is the
  change [06](06-performance.md) depends on: past a few thousand devices the
  answer stops being "do it faster" and becomes "ask for less".
- **The client stops calculating.** Statistics, verdicts, tallies, filter
  options and histogram bins all arrive ready to render, which removes both the
  work and the `useMemo` scaffolding holding it together.
- **Responses become cacheable**, because they are deterministic. Today there is
  nothing to cache: the computation *is* the page.
- **The pages in [05](05-information-architecture.md) get endpoints.** An
  overview that fetches counts and nothing else is cacheable and identical for
  every viewer; today it needs every reading in memory to count anything.
- **Readings outlive the batch.** Today a log is a snapshot: load a different
  one and the previous readings are simply gone. Once they persist, "has temp-1
  drifted since January" is a query rather than a question nobody can answer.

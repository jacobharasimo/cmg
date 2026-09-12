# 03 — The API contract

How the client asks for the shapes in [02](02-data-model.md). The case for
having an API at all is [01](01-from-file-to-api.md).

## The endpoints

Typed JSON over HTTP. The shapes are the ones `src/lib/types.ts` already
defines, so the client's types barely move.

Every number is in the canonical unit — Fahrenheit for temperature, and the unit
the rules are written in for everything else ([02](02-data-model.md)). The
responses never vary by a reader's display preference, which is what keeps them
cacheable.

### `GET /api/v1/batches/:id`

The overview: everything the top of the screen needs, and nothing per-device.

```json
{
  "id": "batch-2026-04-05",
  "evaluatedAt": "2026-04-05T22:30:00Z",
  "deviceCount": 46,
  "verdictCounts": {
    "keep": 31,
    "discard": 9,
    "unclassified": 6
  },
  "sensorTypes": [
    { "type": "thermometer", "label": "Thermometer", "count": 12 },
    { "type": "humidity", "label": "Humidity", "count": 18 },
    { "type": "lux", "label": "Lux", "count": 6, "isRegistered": false }
  ],
  "reference": {
    "temperature": { "value": 70.0, "unit": "F" },
    "humidity": { "value": 45.0, "unit": "pct" },
    "monoxide": { "value": 6, "unit": "ppm" }
  }
}
```

### `GET /api/v1/batches/:id/devices?page=1&take=50&sortBy=sd&sortDir=desc`

One page of evaluated devices. Sorting and filtering are parameters — a page
cannot be sorted or filtered client-side, because the rows to sort are on the
server. Filters join the same query string: `&type=thermometer`,
`&verdict=discard`.

**`page` + `take`, never a raw `skip` alongside them.** `take` is `limit` under
its Prisma/EF spelling; the point is that only one of the two vocabularies is
offered. Accepting `page` *and* `skip` invites a request that sets them
inconsistently and a server that has to pick a winner, so the UI thinks in pages
and the server derives the offset.

**`take` is a reader-facing choice, and therefore an allowlist.** The page-size
control offers 10 to 100 in steps of ten, and the server accepts exactly that
set. Anything else is a 400 — an unbounded `take` is a request for the whole
table under a different name, and one typed URL should not be able to ask a
database for 2,300 rows and every reading behind them.

**`sortBy` is an allowlist too, not a column name.** Passing it through to an
`ORDER BY` is an injection hole; it maps to the same `SortKey` enum the client
already has, and anything unrecognised is a 400 rather than a silent default.

```json
{
  "items": [
    {
      "name": "temp-1",
      "type": "thermometer",
      "quantity": "temperature",
      "unit": "F",
      "verdict": "precise",
      "stats": {
        "mean": 70.2,
        "sd": 5.4,
        "meanDeviation": 0.2,
        "worstDeviation": 9.1,
        "count": 13
      },
      "outOfTolerance": null
    }
  ],
  "page": 1,
  "take": 50,
  "total": 46
}
```

`outOfTolerance` is `null` rather than `0` for a thermometer — it is judged on
the whole series, so the count is a rule that does not apply to it. That
distinction already exists in `DeviceReport` and has to survive the wire.

### `GET /api/v1/devices/:id/readings?cursor=eyJhdCI6…&take=500`

The raw series, paginated by cursor because a device can have a great many.

```json
{
  "items": [
    { "at": "2026-04-05T22:00:00Z", "value": 72.4 },
    { "at": "2026-04-05T22:01:00Z", "value": 76.0 }
  ],
  "next": "eyJhdCI6IjIwMjYtMDQtMDVUMjI6MDE6MDBaIn0"
}
```

`v1` in the path, not a field in a payload: versioning an API is a solved
problem, and it is a much better one than versioning a file whose readers you
do not control.

## Shaped for the screen, not for a parser

The point of a BFF is that it answers *this* client's questions. Today the
browser is handed raw readings and derives everything itself:

| Computed in the browser now | Where |
| --- | --- |
| mean, σ, deviations, out-of-tolerance counts | `lib/stats.ts` |
| a verdict per device, and the verdict tallies | `lib/evaluateLogFile.ts` |
| which sensor types are present, and how many of each | `Dashboard.tsx` — a `Map` built per render |
| which filter chips to offer | `DeviceFilters/filterOptions.ts` — scans the batch |
| sorting and filtering the whole array | `useDeviceSelection` |
| a 12-bin histogram per device | `DeviceDetailPanel/distributionOptions.ts` |
| the name → verdict map for the JSON panel | `Dashboard.tsx` |

That is 32 `map`/`filter`/`reduce`/`sort` calls outside `src/lib`, and **every
one of them is deterministic given the batch and the thresholds.** None needs a
browser to happen in.

Nearly all of them sit behind a `useMemo`, which is the tell rather than the
defence: the memoisation exists because the work is expensive enough to be worth
avoiding, and every one of those hooks is a dependency array someone has to keep
correct. Moving the work to the server deletes the computation *and* the
machinery guarding it.

So the endpoints return what the screen draws. `sensorTypes` on the batch
endpoint is one example; the histogram is the other, and it arrives already
binned:

### `GET /api/v1/devices/:id/distribution?bins=12`

```json
{
  "mean": 70.2,
  "reference": 70.0,
  "bins": [
    { "low": 61.4, "midpoint": 62.3, "count": 2 },
    { "low": 63.2, "midpoint": 64.1, "count": 5 }
  ]
}
```

`sensorTypes` with counts replaces the `Map` the Dashboard builds each render,
and is the same data `filterOptions` scans the batch to derive. Between them,
the client renders and stops calculating.

**Sorting and filtering have to move server-side too.** That is a consequence rather
than a choice: once devices are paginated you cannot sort a page you do not
hold, so `sortKey` and `filter` become query parameters. `useDeviceSelection`
keeps the state and stops doing the work.

Serving these at volume — pagination, caching, and what that leaves the browser
doing — is [04](04-pagination-and-caching.md).

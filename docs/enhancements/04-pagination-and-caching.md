# 04 — Pagination and caching

How the endpoints in [03](03-api-contract.md) behave once a batch holds
thousands of devices rather than forty-six.

## Two kinds of pagination

None of [03](03-api-contract.md) works at scale without it — a request for
"the devices" has no answer when there are 2,300 of them. The two collections need different
mechanisms, and using one for both is a bug waiting on data volume:

| Collection | Mechanism | Why |
| --- | --- | --- |
| devices in a batch | **offset** — `?page=3&take=50` | the table is audited, so "jump to page 7", "how many pages" and a linkable page all matter, and the set is bounded and stable while a batch is being read |
| readings for a device | **cursor** — `?cursor=…&take=500` | an append-only stream with no meaningful page numbers, where deep offsets get slower the further you scroll and a concurrent insert shifts every later row |

**Offset pagination needs a stable sort.** Sorting by σ with ties and no
tiebreaker lets a device appear on page 2 *and* page 3 while another is never
shown at all, because the database is free to order equal keys differently per
query. Every sort must therefore end in a unique column — `ORDER BY sd DESC,
name ASC`. This is invisible in the sample batch and unavoidable at scale.

**Changing the page size moves the reader.** With `take=10` a reader on page 5
is looking at rows 41–50; switch to `take=50` and page 5 becomes rows 201–250,
so they are thrown two hundred rows from where they were. The fix is to
recompute the page from the first row currently visible — row 41 at `take=50` is
page 1 — rather than keeping the page number and changing what it means.

**Both feed the table we already window.** The windowing in `useVirtualRows` is
what makes either usable: it keeps the DOM proportional to the viewport while
the fetched set grows behind it. Infinite scroll then becomes "fetch the next
page when the window nears the end of what we hold" — the two solve different
halves of the same problem and neither replaces the other.

## What that makes cacheable

Determinism is what unlocks it. A verdict for a given batch under the spec's
default thresholds never changes, so the response is immutable once computed:

- **Per batch, indefinitely.** Readings for a completed batch do not move.
  An `ETag` on the batch id lets a client that already holds it revalidate for
  free.
- **The overview is identical for every viewer** — counts and reference values,
  no per-user content. That is a CDN response rather than a computation.
- **Default thresholds are the overwhelmingly common case.** Key the cache on
  `(batchId, thresholds)` and the default key is the only one most viewers ever
  request; the sliders are an audit tool, not the normal path.

None of that is available while the work happens in the browser, because there
is nothing to cache — the computation *is* the page.

## What stays in the browser

Less than it first looks. `evaluateBatch` is plain TypeScript with no DOM and no
React — which is why `src/lib` is tested under the `node` environment — so it
runs on either side of the wire, and moving it to the BFF is a deployment change
rather than a rewrite.

The obvious thing to keep client-side is the **threshold what-if**: dragging a
slider re-evaluating instantly against summaries already fetched, with no
round-trip. It is the most appealing part of the current console, and it is the
one thing here that does not survive pagination. A client holding page 1 of 50
devices can only re-evaluate those 50, so the verdict counts would go quietly
wrong the moment a slider moved — confident totals over a subset, in a console
whose only job is being trustworthy.

**So thresholds get an Apply button, and the server re-evaluates.** Dragging
changes the number on screen and nothing else; applying sends the threshold set
and returns authoritative results for the whole batch. Live re-evaluation on
drag is dropped, because at scale it was never telling the truth.

That trade buys three things beyond correctness:

- **A threshold set becomes a state worth naming.** Applied thresholds belong
  in the URL — `?thermometerSd=2.5` — which makes an audit linkable and
  reproducible, the same argument [05](05-information-architecture.md) makes
  for pages.
- **The cache gains a key instead of thrashing.** `(batchId, thresholds)` is
  cacheable precisely because only applied sets exist. Live dragging would have
  minted a distinct key per intermediate value, nearly all never read twice.
- **One evaluation per question asked**, rather than one per animation frame.

**Apply must never be disabled.** The console's rule is that a disabled control
leaves the tab order, so nobody can reach it to learn what would enable it.
Applying an unchanged set is idempotent, so the button stays live and the state
is stated beside it — exactly what `ThresholdPanel` already does with "Matching
spec defaults" in a polite live region.

So what the browser actually keeps is the **rule trace**: the per-device
explanation of which checks passed and why. It needs one device and its
thresholds, both already in hand, so it stays instant and needs no round-trip.
**The server owns the verdict; the client explains it.**

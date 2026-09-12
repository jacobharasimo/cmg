# 05 — Information architecture

How the console is arranged once the data arrives over an API rather than in one
uploaded file. Assumes the endpoints in [03](03-api-contract.md) and the paging
in [04](04-pagination-and-caching.md).

## The constraint

Everything is on one screen: the log source bar, six verdict counts, the
threshold sliders, a sortable table of every device, a ranking chart, a time
series, a histogram, the rule trace, and the JSON output.

That is the right screen for exactly one person — an engineer auditing whether
the rules are correct. They need the verdict, the numbers behind it and the rule
that produced it in one field of view, because the whole point is checking that
the three agree. For that reader, splitting the page across routes would be a
regression.

They are not the only reader, and for everyone else the density is the problem
rather than the feature.

**Nothing is prioritised, because everything is present.** A fleet operator
opening this wants one answer: is anything wrong right now? That answer exists —
it is the `discard` count — but it is one tile among six, on a screen with three
charts competing for attention. Dense-by-default optimises for the reader who
already knows what they are looking for.

**Detail is bound to selection, not to a location.** Choosing a device changes
the right-hand panel and nothing else — no URL change, so a specific device's
readings cannot be linked, bookmarked or sent to a colleague. For a console
whose likely use is "look at this one, it's misbehaving", the thing you most
want to share is the thing you cannot address.

**Every reader pays for every widget.** The charts are loaded and rendered
whether or not this visit is about charts. That is a page-weight problem
([06](06-performance.md)), but it is an attention problem first.

**The vocabulary assumes the spec.** `σ`, `ultra precise`, `out of tolerance`,
`reference` — precise terms, and correct, but they read as jargon to anyone who
has not read p.3. The rule trace explains each verdict once you select a device;
nothing explains the columns.

## The proposal

**An overview, with detail pages behind it.** Not a decomposition of this screen
— this screen survives as the audit view.

```
/                       overview — fleet health, and what needs attention
/devices                the full table, filterable and sortable
/devices/:id            one device: readings, distribution, rule trace
/audit                  today's dense screen, for the rule-checking reader
```

**The overview answers the operator's question.** How many devices, how many
are failing, which ones, and when the batch was evaluated. Verdict counts stay, as the
primary element rather than a strip. The ranking chart stays, because "which
devices are furthest out" is the overview's actual job. The table becomes a
short "needs attention" list — `discard` and `unclassified` only — linking into
the detail pages. Sliders, histogram, time series and JSON move off it.

**`/devices/:id` makes a device addressable.** Same content as today's detail
panel, at a URL. Selection state becomes route state, which also removes the
"selected device no longer exists after a filter change" class of bug, because
the route either resolves or 404s.

**Plain-language framing, with the precise term kept.** "2 devices need
replacing" above the fold; `discard` and σ still shown, because the engineer
needs them and the operator learns them. Column headers get help text rather
than being renamed.

**The split is what makes the APIs easy.** This is the part that matters
architecturally, and it points straight back at [01](01-from-file-to-api.md):

| Page | Asks for |
| --- | --- |
| `/` | counts and the worst *n* — a few hundred bytes, cacheable, identical for every viewer |
| `/devices` | one page of `DeviceReport` — paginated, no readings |
| `/devices/:id` | one device's readings — paginated, infinite scroll |

Today's single screen needs every reading of every device in memory at once, so
there is no smaller request to make. Once each route asks for one thing, each
response is small enough to paginate and stable enough to cache — the overview
in particular is the same bytes for everyone, which makes it a CDN response
rather than a computation.

**Paged for devices, infinite scroll for readings — and that is not a
preference.** `/devices` is a table people audit: they need "page 4" to be a
place they can return to and send to someone, they need to know how much there
is, and they need to reach whatever sits after the table. Infinite scroll
removes all three, and takes the footer out of reach of a keyboard or screen
reader entirely, which this project is not willing to trade. Readings are the
opposite — an undifferentiated stream where no one wants page numbers — so they
scroll, and [01](01-from-file-to-api.md) gives them a cursor rather than an offset
for the same reason.

**The chart mirrors the table.** The ranking chart plots the rows currently in
the table — same page, same filter, same order — and re-renders when any of
them change. The table becomes the source of truth and the chart becomes a view
of it, which settles three things at once:

- **The chart stops being unbounded.** It draws at most a page of bars, so the
  2,300-bar problem in [06](06-performance.md) never arises and no top-*n* rule
  is needed. The page-size control caps at 100 for the same reason:
  `rankingHeight()` grows 28px per bar, so a hundred bars is already a
  2,900px-tall chart, and that ceiling is as much a chart constraint as a
  request one.
- **Two controls collapse into one.** Today `RankingPanel` has its own
  sensor-type dropdown *and* `DeviceTable` has a sensor-type filter — two ways
  to narrow by the same thing, which can disagree. The table's filter wins and
  the dropdown goes.
- **One question, one answer.** "What am I looking at?" has a single response
  instead of depending on which panel you read.

One consequence to design around: **a ranking chart is only a ranking when the
table is sorted by what the chart measures.** Sorted by σ descending, page 1 holds
the genuine worst offenders and the chart reads as it does today. Sorted by
name, the same chart is σ in alphabetical order — a bar chart, not a ranking.
The chart should follow the table's order rather than quietly re-sorting, and
say what it is showing: "devices on this page, by σ". Re-sorting behind the
reader's back would make the chart disagree with the table beside it, which is
the one thing this arrangement exists to prevent.

**Watch the waterfall.** Overview → devices → detail is three sequential
round-trips if each page waits to mount before asking. Prefetch on intent —
hovering a device row, or focusing it — costs nothing on a fast connection and
hides the second and third hops. Build it in from the start: retrofitting means
untangling fetches from render.

## What it buys

- **A default reader who is served.** The operator gets an answer above the
  fold; the engineer keeps `/audit` intact.
- **Linkable devices.** The most shareable object in the app becomes shareable.
- **Requests sized to the page.** Infinite scroll on readings, pagination on
  devices, a cacheable overview — none of which is possible while one screen
  needs everything.
- **A route is a place.** `/devices?page=4&sort=sd` is linkable, restorable on
  back, and reproducible in a bug report. None of that survives a single screen
  holding its state in memory.
- **A cheaper first paint.** Charts load on the routes that show charts. See
  [06](06-performance.md) for what that is worth in kilobytes.

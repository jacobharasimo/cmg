# Next steps

Page 7 of the assignment invites arguing for changes — to the log format, to the
interface, and for what happens as logs grow and sensor types are added. These
are written from the finished build rather than in the abstract, so each one
names the line of code or the measurement that provoked it.

| | |
| --- | --- |
| [01 — From an uploaded file to an API](01-from-file-to-api.md) | why a text file is the wrong interface, and what replaces it |
| [02 — The data model](02-data-model.md) | the entities behind the API, and one canonical unit on the wire with conversion at the edge |
| [03 — The API contract](03-api-contract.md) | the endpoints, returning JSON already shaped for the screen |
| [04 — Pagination and caching](04-pagination-and-caching.md) | serving those endpoints at volume, and what it leaves the browser doing |
| [05 — Information architecture](05-information-architecture.md) | one dense screen serves the engineer auditing rules and nobody else |
| [06 — Performance](06-performance.md) | measured: evaluation is not the bottleneck, and the obvious fix is the wrong one |
| [07 — Scale](07-scale.md) | what adding a sensor type costs today, and the one assumption that breaks first |

**01 to 04 are one argument in four parts** — the case, the shapes, the
interface, and how it holds at volume. Read them in order. 05 to 07 stand alone.

## The through-line

They are the same argument at different distances.

**The client is doing work it was never given enough information to do well.**
It infers structure from whitespace, invents the concept of an unregistered
sensor type because a text file offers nothing to validate against, recomputes
every statistic on every threshold change, and can only ever see the one batch
someone handed it.

Each of those is defensible for a log measured in kilobytes. None survives
contact with the production data p.7 describes. The fix in every case is to move
the decision to where the information actually is: the datastore and the server
(01–04), the page boundary (05), or the type registry (07).

**Everything depends on 01 to 04 happening.** 05's page split needs endpoints to
call, 06's performance work assumes them, and 07's server-declared sensor types
are rows in the datastore 02 describes.

Two tensions surfaced while writing these, and both are resolved rather than
left as caveats. Paginating devices breaks the live threshold what-if, so
thresholds gain an **Apply** button and the server re-evaluates the whole batch
([03](03-api-contract.md)). And the ranking chart cannot window the way the
table does, so it plots the rows the table is showing — which bounds it at one
page however large the batch gets ([05](05-information-architecture.md)).

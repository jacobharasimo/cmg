# `src/router`

React Router 7 in data-router mode. One screen today, arranged so adding more
is a route entry rather than a refactor.

| | |
| --- | --- |
| `router.tsx` | the route table — what the routing *is*, so it sits at the root of the layer |
| `paths/` | every path as a constant — import these, never a string literal |
| `RouteError/` | the `errorElement` |
| `browserRouter/` | `createBrowserRouter(routes)`, rendered by `main.tsx` |

The pieces the table is assembled *from* each get a folder with a barrel and
`__tests__`, the same shape `components`, `hooks`, `pages` and `providers` use.

`router.tsx` is the table; `browserRouter` is one router *built* from it. They
are separate because the table has to stay usable without touching the URL —
the tests build memory routers from the same array, and `browserRouter` reads
`window.location` the moment it is imported.

`RouteError` lives here rather than in `components/`, even though it is a
component. Everything in `components/` is presentational and takes props; this
one reads `useRouteError()`, so it only means anything mounted as a route's
`errorElement`. Keeping it beside the table that mounts it is what stops the
presentational rule next door from acquiring an exception.

## Two error boundaries, deliberately

```
AppLayout            errorElement: RouteError   ← the shell itself
  └─ (pathless)      errorElement: RouteError   ← the pages inside it
       └─ Dashboard
```

The inner one is a **pathless** route, so a page that throws renders the error
inside the shell and the layout survives. The outer one exists because that
inner boundary is a *descendant* of `AppLayout` — without it, an error in the
layout escapes to React Router's built-in fallback.

Neither covers a failure above the router: the theme provider, or building the
router itself. `AppErrorBoundary` in `src/providers` is the backstop for those.

## Lazy pages

Pages are declared with `lazy`, which is what keeps Highcharts out of the entry
chunk — the Dashboard chunk is ~191 kB gzipped and the entry is ~154 kB.

That also means **`router.tsx` must import `AppLayout` directly**, not through
an aggregate `@/components` barrel. Importing the barrel pulls every component
into the entry bundle and collapses the split entirely; measured, it took the
entry from 453 kB to 1,044 kB.

Unknown URLs redirect to the dashboard rather than reaching a dead end.

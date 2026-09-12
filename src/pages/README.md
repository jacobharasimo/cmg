# `src/pages`

One folder per route. A page is the only place that calls hooks — it owns the
data and hands plain props to presentational components.

```
Dashboard/
  Dashboard.tsx
  index.ts
  __tests__/
```

## What a page is responsible for

`Dashboard` calls all four hooks, derives what the components need, and passes
it down. Nothing below it reaches for data of its own:

- **derives** the sensor-type options and their counts, the verdict map for the
  JSON panel, and the CSV row builders
- **holds** the two pieces of view state that are not worth a hook — the
  12-hour clock and which sensor type is ranked
- **renders** the header inline, because it shows dashboard data (the reference
  values) rather than being app chrome — `AppLayout` stays data-free

A page test mocks every hook and every child, so it asserts what the page passes
down rather than re-testing the pieces.

## The ranked type is a preference, not a fact

`sensorType` falls back to the selected device's type whenever a newly loaded
log has no devices of the remembered type. Without that, loading a log that
happens to lack thermometers leaves the panel ranking nothing.

## Adding a page

`docs/enhancements/05-information-architecture.md` argues for splitting this
screen into an overview plus per-type detail pages. A new page is a folder
here, a path in `src/router/paths/`, and a lazy entry in the route table.

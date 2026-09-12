# `src/hooks` — the data boundary

Components consume hooks. **No component imports `parseLog` or
`evaluateLogFile`.** That line is the point of this folder: it is what lets the
log come from somewhere else later without a single component moving.

One folder per hook, each with its own `index.ts` and `__tests__`, plus a
`types.ts` where it needs one — `useSnackbar` does not, because its types belong
to the provider that publishes them.

There is **no `types.ts` at this level**: every type here has exactly one owning
hook, so it lives beside that hook and is re-exported through the barrel.
`SortKey` and `DeviceFilter` are imported by components from `@/hooks`, but
`useDeviceSelection` is the only thing that defines their meaning — a consumer
is not a second owner. A file at this level would be for a type two hooks
genuinely share, and there isn't one.

## The hooks

| Hook | Owns |
| --- | --- |
| `useSensorLog` | **where the log comes from** — the spec example, upload, drop |
| `useThresholds` | the adjustable classification thresholds, and reset |
| `useDeviceReport` | the evaluated batch, memoised |
| `useDeviceSelection` | sorting, filtering and which device is selected |
| `useSnackbar` | raising and clearing the app's message bar |
| `useVirtualRows` | which rows of a long list are actually rendered |

Two are not data boundaries. `useSnackbar` is the read side of
`SnackbarProvider`, and `useVirtualRows` is presentation logic that happens to
need state and a `ResizeObserver`. Both live here because this is where hooks
live; the snackbar's context stays with the provider that publishes it.

## Failures are thrown, not returned

`useSensorLog.loadFile` rejects rather than storing an error for a component to
render. That keeps the hook to one job and leaves *how* a failure is shown to
the caller, which is what lets the snackbar stay generic infrastructure:

```ts
loadFile(file).then(clearMessage, (cause: unknown) => {
  setMessage({ message: cause instanceof Error ? cause.message : FALLBACK_MESSAGE })
})
```

The thrown `Error` carries a presentable `message` — the library's own text
names line counts, which is right for a developer and wrong for a bar across
the top of the page. The original is kept as `cause`.

A log is committed to state only if it parses, so a rejected file leaves the
previous one on screen. An empty console would be indistinguishable from a log
that genuinely has no devices.

## The seam

`useSensorLog` is the single file that becomes a network call. Nothing else
changes:

```ts
const { text, source } = useSensorLog()                    // today: a bundled log
const { text, source } = useSensorLog({ batchId })         // later: the BFF
```

`docs/enhancements/01-from-file-to-api.md` argues for that move: readings live
in a datastore and reach the client as JSON, rather than being uploaded as a
text file. The upload survives as a second source, which is why this hook stays
the thing that owns *where a log comes from* rather than being replaced.

`useDeviceReport` shrinks with it — `docs/enhancements/03-api-contract.md` has
the server returning pre-aggregated devices, leaving the client to evaluate only
what a reader explicitly applies.

## Why `evaluateLogFile` is not a hook

It is the graded deliverable and must stay callable from anywhere — a hook only
runs during render, so wrapping the rules in one would make them untestable
without a render harness. `useDeviceReport` is the thin memo over it:

```ts
export function useDeviceReport(text: string, thresholds: Thresholds) {
  return useMemo(() => evaluateBatch(text, thresholds), [text, thresholds])
}
```

## Tests

`renderHook`, with the layer below mocked — `useDeviceReport` mocks
`evaluateBatch` and asserts delegation and memoisation, not classification.
`useSensorLog` mocks the fixtures and asserts where a log came from, not what is
in one.

## Pages own hooks, components don't

`Dashboard` calls all four and passes plain data down. A component that
called `useDeviceReport` itself would be pinned to this one screen and would
need a real hook to be tested. See `src/components/README.md`.

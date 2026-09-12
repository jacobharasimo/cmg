# `src/providers`

What gets mounted at the app root. One folder per provider.

```tsx
<AppErrorBoundary>        // outside, so it catches the theme failing
  <AppThemeProvider>
    <SnackbarProvider>    // inside, because the bar it renders is themed
      <RouterProvider router={browserRouter} />
    </SnackbarProvider>
  </AppThemeProvider>
</AppErrorBoundary>
```

## `AppThemeProvider`

Applies `createAppTheme()` and `CssBaseline`. No colour mode — the design has
one theme, so there is nothing to switch and no second palette to keep in sync.

## `SnackbarProvider`

The app's one message bar, and the channel for raising it:

```ts
const { setMessage, clearMessage } = useSnackbar()
setMessage({ message: 'something went wrong' })          // severity: 'error'
setMessage({ message: 'saved', severity: 'success' })
```

Three decisions worth knowing:

- **The context carries only the two callbacks, never the message.** Both are
  `useCallback`-stable, so the value never changes and raising a bar re-renders
  nothing below it. Putting the message in the context would re-render every
  consumer each time one opened.
- **The default context value is `null`, not a no-op channel.** That is what
  lets `useSnackbar` throw when there is no provider above it. A snackbar that
  silently discards messages is worse than one that fails at mount — reporting
  failures is the entire job.
- **One message, not a queue.** A second failure while the first is up almost
  always describes the same broken attempt; stacking bars would bury the page.

It renders `AlertBanner`, which is presentational and has no state of its own.

## `AppErrorBoundary`

The last line of defence. React Router's `errorElement` covers the routed tree,
but it is a *descendant* of the theme provider and the router, so neither is
covered by it. This sits above both.

Two things about it are deliberate:

- **It is the only class component in the app.** React still has no hook
  equivalent for `componentDidCatch`.
- **Its styling is inline**, reading raw values from `palette.ts` rather than
  through React context. It cannot depend on the theme it exists to survive.
  Verified by throwing inside `AppThemeProvider` and confirming the fallback
  still renders.

It does **not** catch errors in event handlers, in async callbacks, or thrown by
itself — React boundaries never do.

## Why these are not in `theme/`

`theme/` owns *what the theme is*; applying it is an app-level concern. Keeping
them apart gives a query client, feature flags or a second boundary an obvious
home later — none of which would belong under `theme/`.

There is no `AppProviders` composition component. With three providers it would
still be a wrapper with no behaviour; `main.tsx` reads perfectly well as it is.

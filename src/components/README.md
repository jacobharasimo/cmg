# `src/components`

One folder per component: its `.tsx`, an `index.ts` barrel, `__tests__`, and a
`types.ts` where the component takes props — `AppLayout` takes none, so it has
none. A component split across several files keeps them in the same folder;
`DeviceTable` is the one that is, with `DeviceRow`, `VerdictChip` and its column
definitions beside it. Built from MUI, styled by the theme.

Components and hooks are **arrow consts**, default-exported on their own line:

```tsx
const DeviceTable = ({ devices, onSelect }: DeviceTableProps) => { … }

export default DeviceTable
```

Two lint rules hold that line. `func-style` catches local and named-export
declarations; it does not see `export default function`, so a
`no-restricted-syntax` selector covers that form. Plain TypeScript modules —
`lib`, `utils`, theme factories — keep function declarations, where hoisting is
useful and expected.

## Presentational, always

**Components take props. Pages own hooks.** `DeviceTable` receives `devices`,
`sortKey` and `onSelect`; it never calls `useDeviceReport`. Two reasons, both
practical:

- it can be unit-tested with plain props and mocked children, no real state
- it isn't pinned to this one screen, which matters for the multi-page split in
  `docs/enhancements/05-information-architecture.md`

## Styling

Colour, border, radius and type come from the theme. `sx` is for **layout
only** — `display`, `gap`, `grid*`, `p`/`m`, `minWidth`, `height`. If the same
`sx` appears twice, it belongs in `src/theme/components/`. If a layout repeats,
it becomes a component — that is what `FillCard` is.

`font: 'inherit'` and `color: 'inherit'` are fine: they set no design value.

## Accessibility decisions made here

These are the non-obvious ones, and the reasoning is worth keeping close to
the code:

- **`DeviceFilters`** — a radio group, not the design's toggle chips. One-of-N
  is what radios are, so the browser supplies exclusivity, arrow-key movement
  and a single tab stop. We write no `aria-pressed` and no key handlers.
- **`DeviceRow`** — the device name is a real `ButtonBase`, not a focusable
  `<tr>`. Selecting a device rebuilds three charts, so this selection must
  **not** follow focus the way the filters' does.
- **`ExportCsvButton`** — every instance needs a distinct `label`. Five buttons
  all reading "Export CSV" tell a screen-reader user nothing.
- **`ThresholdPanel`** — reset is never disabled. A disabled button leaves the
  tab order, so nobody can reach it to find out what would enable it. Resetting
  is idempotent, so the state is stated beside the button in a live region
  rather than used to block it. A lint rule keeps `disabled` off buttons.
- **`DeviceTable` / `JsonOutput`** — `tabIndex` on their scroll containers.
  WCAG 2.1.1 requires overflow to be reachable and no native element makes an
  overflow box focusable. Neither has a click or key handler, which is what
  separates them from a fake control.
- **`LogSourceBar`** — "Upload log…" is a `<label>` wrapping a **visually
  hidden, not `hidden`,** file input. `hidden` would drop the input from the tab
  order and the accessibility tree, and a `<label>` is not focusable on its own,
  so the control would be keyboard-unreachable. The label carries
  `role={undefined}` and `tabIndex={-1}` to undo `ButtonBase`, which otherwise
  makes it a second, fake tab stop in front of the real input. That is the
  opposite of the `tabIndex` smell below — nothing is being made focusable,
  something is being un-faked. The focus ring still lands on the visible label:
  React's `onFocus` bubbles, so MUI marks it `Mui-focusVisible`.
- **`AlertBanner`** — the app's one **added** live region, and the only
  justified one. MUI's `Alert` supplies `role="alert"`, which announces without
  moving focus. It earns the exception because a rejected upload leaves the
  previous log on screen looking current, so the bar is the only thing saying
  otherwise. It ignores Snackbar's default clickaway dismissal for the same
  reason: an unrelated click must not discard it.

## Tests

One test file per component, in that folder's `__tests__/`. Children and hooks
are mocked, so a test asserts what *this* component does — `VerdictSummary`
mocks `StatCard` and checks the label, value and caption it passes down.

Queries are by role and accessible name. That is not a style preference: it is
what caught `Switch` rendering as `role="switch"` rather than `checkbox`, and
what makes these tests double as a description of the component's semantics.

Chart components assert the **options object** their builder produced, never
rendered SVG. `Chart` itself mocks Highcharts entirely — what matters is that it
merges the theme underneath the options and destroys the instance on unmount.

## Chart details that are easy to lose

Two came back as regressions after a refactor, so they are worth naming:

- **Bar labels colour per point, not per chart.** A device that failed its rule
  reads in the discard colour; everything else is muted. Setting a shared
  `style` without a `color` hands the decision to Highcharts, which picks black
  — unreadable on a dark surface.
- **The selected device is marked across its whole row** — a band behind it, an
  accent border and a `▸` caret on its category label. An outline on the bar
  alone vanishes on a short bar, and colour alone would not survive 1.4.1.

## Selecting a device

There are two surfaces for it, and they drive the same `onSelect`: a row in
`DeviceTable`, and a bar in `RankingPanel`.

**The table row is the keyboard route.** It is a real `ButtonBase`, and it
selects on **activation**, never on focus — selecting rebuilds three Highcharts
instances and a rule trace, so selection-follows-focus would pay that cost once
per row while arrowing through 46 devices. That is why it is a button and not a
radio.

**The chart bar is a pointer convenience on top of that.** Clicking it selects
the device. Highcharts routes its own keyboard activation through the same
`click` event, but that path is not verified and nothing depends on it: every
device is reachable and selectable from the table, and every value in the chart
is also in the table and the CSV.

**The selected row is marked without relying on colour** (WCAG 1.4.1): a band
across the full row, an accent border, and a `▸` caret on the category label. A
bar outline alone would be invisible on a short bar.

## The device table is windowed

Only the rows near the viewport are in the DOM. `useVirtualRows` returns the
slice to render plus two spacer heights, and `DeviceTable` renders those as
empty rows — a `tbody` cannot take padding, and this has to stay a real
`<table>` for its semantics to hold. The spacers keep `scrollHeight` equal to
the whole batch, so the scrollbar does not shrink as you scroll.

Measured, not assumed: `useVirtualRows` takes the height of a rendered row from
a `ResizeObserver` rather than a constant, which is what keeps the window
aligned at 200% zoom and under increased text spacing (WCAG 1.4.4, 1.4.12). A
hard-coded height would drift further out of position the further you scrolled.

Three accessibility consequences, all of them load-bearing:

- **`aria-rowcount` on the table and `aria-rowindex` on every row.** Without
  them a screen reader counts the DOM and reports a fleet of twenty. The header
  is row 1, so body rows start at 2 and carry their index in the *batch*.
- **The spacer rows are `aria-hidden`.** They are layout, not data.
- **A short list is not windowed**, and that falls out of the arithmetic rather
  than a branch — when everything fits, both spacers are zero.

## Flat DOM

Children are spaced with `gap` on a flex or grid parent, never with a margin on
a wrapper element. A `<Box>` whose only job is to hold `mt: 1` is an element
that exists to carry one number — the parent's `gap` does it for free.

Grid items likewise carry no `minWidth: 0`; the track sets its own minimum with
`minmax(0, …)`.

Measured in the browser: `div`s with exactly one element child and no role or
ARIA. Ours is zero. The rest is MUI's own anatomy — `Chip > ChipLabel` and
`Paper > CardContent` — which is not ours to flatten.

## Generic before specific

If the design shows the same shape twice, it is one component with props:
`FillCard` for every panel, `StatCard` for every count tile, `ExportCsvButton`
for all five exports, `Chart` for all three Highcharts views.

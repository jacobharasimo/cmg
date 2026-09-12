# `src/theme`

One theme. The design defines a single dark theme and has no mode toggle, so
`createAppTheme()` takes no arguments and there is no light palette to keep in
sync.

There is **no separate token layer**: MUI's palette is the token system, and a
parallel one would just be a second name for every colour. Values live directly
in `foundations/palette.ts`, and everything else reads them back off the theme.

```
foundations/ ──> components/ ──> createAppTheme.ts
```

`createAppTheme()` is applied by `AppThemeProvider`, which lives in
`src/providers/` — providers are an app-level concern, not a theme one.

## `foundations/palette.ts`

**The only file in the app containing a hex literal.** A rebrand is an edit
here.

Neutrals go in MUI's own `grey` ramp, so components and chart options reach
them without a parallel vocabulary:

| | | |
| --- | --- | --- |
| `grey[900]` | page background | → `background.default` |
| `grey[800]` | inset surfaces | → `background.panel` |
| `grey[700]` | cards | → `background.paper` |
| `grey[600]` | decorative edges | → `divider` |
| `grey[500]` | control boundaries | → `outline` |
| `grey[400]`–`grey[50]` | text | → `text.*` |

Nothing outside this file reads the ramp directly — components use the named
slot, never a shade number.

Two of those slots carry accessibility meaning, and swapping them is the
likeliest way to introduce a contrast bug:

- **`divider` is 1.6:1 on paper.** Decorative only — card outlines, row
  separators. Never a control boundary.
- **`outline` is 3.63:1**, clearing WCAG 1.4.11. Inputs, focusable regions and
  chart bars use this. It is also what the histogram bars use: the design's own
  bar colour is 2.84:1 on paper and fails.

Contrast ratios are computed **in the test**, not quoted from a comment, so the
numbers here cannot drift from what ships.

One trap worth knowing: the selected-row tint sits *behind* the verdict chips
and becomes part of their background. Checking a colour against `paper` alone is
not enough — at the design's 0.16 opacity, `discard` fell to 4.29:1 on a
selected row. `action.selectedOpacity` is 0.12 for that reason, and the value
MUI's `TableRow` actually reads is `selectedOpacity`, not `action.selected`.

## What MUI does not have

Only two things needed augmenting (`types.ts`):

- **`palette.verdict`** — one colour per `Verdict`, typed as a total record so
  a new verdict cannot be forgotten. Domain colours MUI cannot know about.
- **`palette.outline`** — the boundary of a control. A sibling to `divider`,
  which is MUI's own precedent for a line colour as a plain palette string.
- **`background.panel`** — a third surface, one step below `paper`.

Everything else uses an existing slot: `action.hover` and `action.selected` for
row states, `divider` for chart grid lines, `primary.main` for the focus ring
and selection, `shape.borderRadius` for corners, `spacing` for the 8-point grid,
`breakpoints.values.xl` for the content width cap.

## `foundations/typography.ts`

Sizes in px, all even; line heights are explicit px multiples of 4, so every
line box lands on the grid — 12/16, 14/20, 16/24, 24/32.

`responsiveFontSizes` is deliberately not used: it rejects px line heights and
rescales sizes per breakpoint, both of which pull type off the grid.

Monospace is not decoration — every number, device name, timestamp and the JSON
pane uses it, and that is what makes the device table scannable. Three sizes
cover it: `mono` (data), `monoLarge` (a value that carries a panel), and
`monoDisplay` (the summary counts).

## Radius

`shape.borderRadius` is 8, the design's card radius, and buttons, inputs and
panels follow it.

**Chips are left alone.** MUI's Chip is a pill and the design sets no radius on
it, so overriding it is overriding the design — a squared chip reads as a
button, which is exactly what a chip is not. The filter pills are styled labels
rather than Chips, so they carry a pill radius explicitly to match.

## `components/`

Global `defaultProps` and `styleOverrides`, one file per concern, merged by
`getComponents()`. Anything that should look the same everywhere belongs here
rather than in a repeated `sx` prop. Overrides spread typography variants rather
than restating sizes.

Two exist for accessibility, not aesthetics:

- **`inputs.ts`** sizes the Slider thumb to 24px. MUI's default is 20px, under
  the WCAG 2.5.8 minimum target.
- **`dataDisplay.ts`** gives table rows `scrollMarginTop`, so a focused row
  cannot end up under the sticky header (WCAG 2.4.11).

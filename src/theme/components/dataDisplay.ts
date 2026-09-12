import { tableSortLabelClasses } from '@mui/material/TableSortLabel'
import type { Components, Theme } from '@mui/material/styles'

/**
 * Chips, tables and tooltips — where most of the console's data lives.
 *
 * Table cell borders, row hover and row selection already resolve to `divider`,
 * `action.hover` and `action.selected`, so none of those are restated.
 */
export function dataDisplay(theme: Theme): Components<Theme> {
  return {
    MuiChip: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          ...theme.typography.caption,
          fontWeight: theme.typography.fontWeightMedium,
          // No `borderRadius` here on purpose: MUI's Chip is a pill, which is
          // what the design uses. Squaring it off makes a chip read as a button.
          // WCAG 2.5.8 — the floor for an interactive target.
          height: 24,
        },
      },
    },
    MuiTableContainer: {
      // MUI leaves the scroll container unstyled; this one is a focusable
      // region, so it needs a visible edge of its own.
      styleOverrides: {
        root: {
          border: `1px solid ${theme.palette.outline}`,
          borderRadius: theme.shape.borderRadius,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        // One unit each way: eight numeric columns have to fit without the
        // table scrolling sideways.
        root: { paddingBlock: theme.spacing(1), paddingInline: theme.spacing(1) },
        head: {
          ...theme.typography.overline,
          backgroundColor: theme.palette.background.panel,
          color: theme.palette.text.secondary,
          // Headers wrap to two lines; aligning down keeps the baseline steady.
          verticalAlign: 'bottom',
          // Heavier than a row rule — this edge separates header from data.
          borderBottom: `1px solid ${theme.palette.outline}`,
        },
        body: theme.typography.mono,
      },
    },
    MuiTableRow: {
      // WCAG 2.4.11 — keeps a focused row clear of the sticky header.
      styleOverrides: { root: { scrollMarginTop: 40 } },
    },
    MuiTableSortLabel: {
      styleOverrides: {
        root: {
          // WCAG 2.5.8 — the label is the click target for sorting.
          minHeight: 24,
          // Only the active column shows its direction, so that is the only
          // arrow worth colouring. Written against the root slot to match the
          // specificity of MUI's own rule — nesting it under the icon slot
          // loses the cascade and needs `!important` to win.
          [`&.${tableSortLabelClasses.active} .${tableSortLabelClasses.icon}`]: {
            color: theme.palette.primary.main,
          },
        },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: {
        tooltip: {
          ...theme.typography.body2,
          // Darker than the surface it floats over, so it reads as above it.
          backgroundColor: theme.palette.background.default,
          border: `1px solid ${theme.palette.outline}`,
        },
        arrow: { color: theme.palette.background.default },
      },
    },
  }
}

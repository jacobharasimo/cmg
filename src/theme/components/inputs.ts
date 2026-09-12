import type { Components, Theme } from '@mui/material/styles'

/** Form controls: compact, and monospace wherever they show data. */
export function inputs(theme: Theme): Components<Theme> {
  return {
    MuiTextField: {
      defaultProps: { size: 'small' },
      // Both selects hold device and sensor-type names; a shared floor stops
      // them resizing as the selection changes.
      styleOverrides: { root: { minWidth: 220 } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          // What these inputs hold is data, so they are set like data.
          ...theme.typography.mono,
          backgroundColor: theme.palette.action.hover,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.outline },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.primary },
        },
      },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
      // The arrow is a graphic conveying state — 1.4.11 wants 3:1, and MUI's
      // default `action.active` alpha sits below that on these surfaces.
      styleOverrides: { icon: { color: theme.palette.text.primary } },
    },
    MuiSlider: {
      styleOverrides: {
        // Room for the always-on value label above the track.
        root: { marginTop: theme.spacing(4) },
        // The rail is a control boundary, not decoration.
        rail: { backgroundColor: theme.palette.outline, opacity: 1 },
        mark: { backgroundColor: theme.palette.text.disabled },
        markLabel: { ...theme.typography.mono, color: theme.palette.text.disabled },
        // WCAG 2.5.8 — MUI's thumb is 20px, under the 24px minimum target.
        thumb: { width: 24, height: 24 },
        valueLabel: {
          ...theme.typography.mono,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          fontWeight: theme.typography.fontWeightBold,
        },
      },
    },
    MuiSwitch: {
      defaultProps: { size: 'small' },
      // Unchecked, the track is the only thing showing the control exists.
      styleOverrides: { track: { backgroundColor: theme.palette.outline, opacity: 1 } },
    },
  }
}

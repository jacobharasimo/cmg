import { styled } from '@mui/material/styles'

/**
 * An `<input>` that is invisible but still focusable.
 *
 * The clip-and-shrink technique, not `display: none` or the `hidden`
 * attribute: those remove the element from the accessibility tree *and* the tab
 * order. A file input has to stay in both — it is the real control, and the
 * `<label>` styled as a button around it is not focusable on its own.
 *
 * A ring drawn on this element would be clipped away with it. The visible one
 * comes from the enclosing Button: React's `onFocus` bubbles out of here, so
 * MUI's `ButtonBase` marks the label `Mui-focusVisible` and the theme paints
 * the ring there instead.
 */
export const VisuallyHiddenInput = styled('input')({
  clipPath: 'inset(50%)',
  height: 1,
  width: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
})

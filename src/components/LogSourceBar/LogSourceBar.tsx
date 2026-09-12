import { Box, Button, Typography } from '@mui/material'
import { useCallback, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { statsLine } from './statsLine'
import type { LogSourceBarProps } from './types'
import { VisuallyHiddenInput } from './VisuallyHiddenInput'

/**
 * Where the log comes from.
 *
 * The drop zone is a convenience, never the only route: WCAG 2.5.7 requires a
 * pointer-free equivalent, and the two buttons are it.
 *
 * "Upload log…" is a `<label>` wrapping a visually hidden file input rather
 * than a button that clicks a hidden input through a ref. The input stays the
 * focusable control, so it announces as a file picker instead of a generic
 * button, and no imperative DOM call is needed to open the dialog.
 */
const LogSourceBar = ({ source, deviceCount, onLoadExample, onLoadFile }: LogSourceBarProps) => {
  const [isDraggingOver, setDraggingOver] = useState(false)

  const handleFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) onLoadFile(file)
      // Allow the same file to be chosen twice in a row.
      event.target.value = ''
    },
    [onLoadFile],
  )

  const handleDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      setDraggingOver(false)
      const file = event.dataTransfer.files[0]
      if (file) onLoadFile(file)
    },
    [onLoadFile],
  )

  return (
    <Box
      component="section"
      aria-label="Log source"
      onDragOver={(event) => {
        event.preventDefault()
        setDraggingOver(true)
      }}
      onDragLeave={() => {
        setDraggingOver(false)
      }}
      onDrop={handleDrop}
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 2,
        bgcolor: (theme) => theme.palette.background.panel,
        border: 1,
        borderStyle: 'dashed',
        borderColor: (theme) => (isDraggingOver ? theme.palette.primary.main : theme.palette.outline),
        borderRadius: (theme) => `${String(theme.shape.borderRadius)}px`,
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button variant="contained" onClick={onLoadExample}>
          Spec example log
        </Button>
        {/*
          `role={undefined}` and `tabIndex={-1}` undo `ButtonBase`, which
          assumes any non-`button` component needs to be *made* button-like and
          adds both. Here that is wrong twice over: the label would claim a role
          it cannot fulfil, and the control would take two tab stops — the fake
          button and the real input inside it. Removing them leaves the input as
          the single tab stop, which is the element that actually does the work.

          This is the opposite of the `tabIndex` smell the components README
          warns about: nothing here is being made focusable, something is being
          un-faked. It is also MUI's documented file-upload pattern.
        */}
        <Button component="label" role={undefined} tabIndex={-1}>
          Upload log…
          <VisuallyHiddenInput type="file" accept=".log,.txt,text/plain" onChange={handleFile} />
        </Button>
        <Typography variant="caption" color="text.disabled">
          or drop a file here
        </Typography>
      </Box>

      <Typography variant="mono" aria-live="polite" color="text.secondary">
        {statsLine(source, deviceCount)}
      </Typography>
    </Box>
  )
}

export default LogSourceBar

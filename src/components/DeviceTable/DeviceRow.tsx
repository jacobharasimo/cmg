import { ButtonBase, TableCell, TableRow, Typography } from '@mui/material'
import { memo } from 'react'
import { formatFixed } from '@/utils'
import type { DeviceRowProps } from './types'
import VerdictChip from './VerdictChip'

/**
 * One device in the table: its name, type, verdict chip and statistics.
 *
 * The name is a real button rather than a focusable row. Selecting a device
 * rebuilds three charts and a rule trace, so it takes deliberate activation
 * and must *not* follow focus the way the sensor-type filters do — arrowing
 * through 46 devices would otherwise rebuild all of that 46 times.
 *
 * Memoised, because every threshold change re-renders the whole table.
 */
const DeviceRow = ({ device, isSelected, onSelect, rowIndex, measureRef }: DeviceRowProps) => {
  const { name, stats, strategy, outOfTolerance } = device

  const select = (): void => {
    onSelect(name)
  }

  return (
    <TableRow
      ref={measureRef}
      hover
      selected={isSelected}
      // The table is windowed, so this is the row's place in the whole batch
      // rather than its position in the DOM.
      aria-rowindex={rowIndex}
      // Pointer convenience only. The button below is the real control, so
      // there is no keyboard behaviour to duplicate here.
      onClick={select}
      sx={{ cursor: 'pointer' }}
    >
      <TableCell component="th" scope="row">
        {/*
          A real <button>: focusable, activated by Enter and Space, announced as
          a button — all from the element. Anything that needed a tabIndex and a
          keydown handler here would be a button wearing a table row's clothes.
        */}
        <ButtonBase
          disableRipple
          onClick={select}
          aria-current={isSelected ? 'true' : undefined}
          sx={{
            // Inherit rather than set: the cell already carries the design's
            // monospace type, and this button should be invisible styling-wise.
            font: 'inherit',
            color: 'inherit',
            width: '100%',
            // WCAG 2.5.8 — the text alone is only 16px tall.
            minHeight: 24,
            justifyContent: 'flex-start',
            borderRadius: (theme) => `${String(theme.shape.borderRadius)}px`,
          }}
        >
          {name}
        </ButtonBase>
      </TableCell>
      <TableCell>
        {/* The only non-numeric column, so it opts out of the table's mono. */}
        <Typography variant="body2" color="text.secondary">
          {strategy.label}
        </Typography>
      </TableCell>
      <TableCell>
        <VerdictChip verdict={device.verdict} />
      </TableCell>
      <TableCell align="right">{stats.mean.toFixed(2)}</TableCell>
      <TableCell align="right">{formatFixed(stats.meanDeviation, 2)}</TableCell>
      <TableCell align="right">{stats.sd.toFixed(2)}</TableCell>
      <TableCell align="right">
        <Typography
          variant="mono"
          color={(outOfTolerance ?? 0) > 0 ? 'verdict.discard' : 'text.secondary'}
        >
          {outOfTolerance === null ? '—' : `${String(outOfTolerance)}/${String(stats.count)}`}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="mono" color="text.secondary">
          {stats.count}
        </Typography>
      </TableCell>
    </TableRow>
  )
}

export default memo(DeviceRow)

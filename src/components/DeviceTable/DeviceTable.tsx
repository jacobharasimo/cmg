import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material'
import { useCallback, useMemo } from 'react'
import { SortDirection, useVirtualRows } from '@/hooks'
import DeviceFilters from '@/components/DeviceFilters'
import ExportCsvButton from '@/components/ExportCsvButton'
import FillCard from '@/components/FillCard'
import type { CsvCell } from '@/utils'
import DeviceRow from './DeviceRow'
import { DEVICE_COLUMNS } from './columns'

/**
 * Height assumed for one row before a real one has been measured.
 *
 * Only affects the first paint — `useVirtualRows` measures a rendered row and
 * replaces it, which is what keeps the window right at 200% zoom.
 */
const ROW_HEIGHT_ESTIMATE = 41

import type { DeviceTableProps } from './types'

/**
 * The device table.
 *
 * Rows are selectable by mouse and keyboard (WCAG 2.1.1), and the theme gives
 * them `scrollMarginTop` so a focused row never hides under the sticky header
 * (WCAG 2.4.11).
 */
const DeviceTable = ({
  devices,
  selectedName,
  sortKey,
  sortDirection,
  filter,
  filterOptions,
  onSelect,
  onSort,
  onFilter,
}: DeviceTableProps) => {
  const csvRows = useCallback((): readonly (readonly CsvCell[])[] => {
    const header: CsvCell[] = [
      'device',
      'type',
      'verdict',
      'mean',
      'deviation_from_reference',
      'sigma',
      'out_of_tolerance',
      'readings',
    ]
    return [
      header,
      ...devices.map((device): CsvCell[] => [
        device.name,
        device.type,
        device.verdict,
        device.stats.mean.toFixed(3),
        device.stats.meanDeviation?.toFixed(3) ?? 'n/a',
        device.stats.sd.toFixed(3),
        device.outOfTolerance ?? 'n/a',
        device.stats.count,
      ]),
    ]
  }, [devices])

  /*
    Windowed, because a production log is not the sample. At 2,300 devices the
    unwindowed table is ~18,400 cells on first render; the evaluation behind it
    takes 43ms, so the DOM is the cost, not the arithmetic.
  */
  const { startIndex, endIndex, paddingTop, paddingBottom, scrollRef, rowRef } = useVirtualRows({
    count: devices.length,
    estimatedRowHeight: ROW_HEIGHT_ESTIMATE,
  })

  const visible = useMemo(
    () => devices.slice(startIndex, endIndex),
    [devices, startIndex, endIndex],
  )

  return (
    <FillCard isFilled>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h2" component="h2">
          Devices
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <DeviceFilters options={filterOptions} value={filter} onChange={onFilter} />
          <ExportCsvButton
            filename="device-evaluation.csv"
            rows={csvRows}
            label="Export device table as CSV"
          />
        </Box>
      </Box>

      <Typography variant="caption" color="text.disabled" sx={{ mt: 1 }}>
        Select a row to inspect its readings and the rule trace behind its verdict.
      </Typography>

      {/*
        The one place a tabIndex is warranted: a scrolling container must be
        keyboard-operable (WCAG 2.1.1) and no native element makes an overflow
        box focusable. This is the documented technique, not a fake control —
        it has no click handler and no key handler.
      */}
      <TableContainer
        ref={scrollRef}
        tabIndex={0}
        role="region"
        aria-label="Device evaluation table, scrollable"
        sx={{ mt: 1, flex: 1, minHeight: 0, height: 0 }}
      >
        {/*
          Only the rows on screen are in the DOM, so the table has to state the
          real size itself: `aria-rowcount` counts the whole batch plus the
          header, and every row carries the index it would have unwindowed.
          Without them a screen reader is told the fleet is twenty devices.
        */}
        <Table
          size="small"
          stickyHeader
          aria-label="Device evaluation results"
          aria-rowcount={devices.length + 1}
        >
          <TableHead>
            <TableRow aria-rowindex={1}>
              {DEVICE_COLUMNS.map((column) => {
                const active = sortKey === column.key
                return (
                  <TableCell
                    key={column.key}
                    scope="col"
                    align={column.isNumeric ? 'right' : 'left'}
                    sortDirection={active ? sortDirection : false}
                  >
                    <TableSortLabel
                      active={active}
                      direction={active ? sortDirection : SortDirection.Asc}
                      onClick={() => {
                        onSort(column.key)
                      }}
                    >
                      {column.label}
                    </TableSortLabel>
                  </TableCell>
                )
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {/*
              Spacer rows stand in for the windowed-out ones so the scrollbar
              still measures the whole batch. A `tbody` cannot take padding, and
              this has to remain a real table for its semantics to hold. They
              are hidden from assistive technology, which reads the row indices
              above instead.
            */}
            {paddingTop > 0 && (
              <TableRow aria-hidden style={{ height: paddingTop }}>
                <TableCell colSpan={DEVICE_COLUMNS.length} sx={{ p: 0, border: 0 }} />
              </TableRow>
            )}
            {visible.map((device, index) => (
              <DeviceRow
                key={device.name}
                device={device}
                isSelected={device.name === selectedName}
                onSelect={onSelect}
                rowIndex={startIndex + index + 2}
                {...(index === 0 ? { measureRef: rowRef } : {})}
              />
            ))}
            {paddingBottom > 0 && (
              <TableRow aria-hidden style={{ height: paddingBottom }}>
                <TableCell colSpan={DEVICE_COLUMNS.length} sx={{ p: 0, border: 0 }} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </FillCard>
  )
}

export default DeviceTable

import { Button } from '@mui/material'
import { useCallback } from 'react'
import { downloadCsv } from '@/utils'
import type { ExportCsvButtonProps } from './types'

/**
 * Downloads a CSV of whatever the caller supplies.
 *
 * `rows` is a function rather than an array because it is called at click time:
 * an export always reflects the current thresholds, filter and selection, not
 * whatever was on screen when the button mounted.
 *
 * Every instance reads "Export CSV" but takes a distinct `label` for its
 * accessible name — the console has five of them, and five identical names tell
 * a screen-reader user nothing about which is which.
 */
const ExportCsvButton = ({ filename, rows, label }: ExportCsvButtonProps) => {
  const handleClick = useCallback(() => {
    downloadCsv(filename, rows())
  }, [filename, rows])

  return (
    <Button onClick={handleClick} aria-label={label}>
      Export CSV
    </Button>
  )
}

export default ExportCsvButton

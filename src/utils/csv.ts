/** CSV assembly and download. Pure string work, plus one DOM helper. */

import type { CsvCell } from './types'

/** Quote a cell only when it contains a comma, quote or newline. */
function escapeCell(cell: CsvCell): string {
  if (cell === null) return ''
  const text = String(cell)
  return /["\n,]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Rows → CSV text. The first row is treated as the header by convention. */
export function toCsv(rows: readonly (readonly CsvCell[])[]): string {
  return rows.map((row) => row.map(escapeCell).join(',')).join('\n')
}

/**
 * Hand the browser a file to save.
 *
 * Object URLs are revoked on the next tick — the click has already started the
 * download by then, and holding the blob leaks it.
 */
export function downloadCsv(filename: string, rows: readonly (readonly CsvCell[])[]): void {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}

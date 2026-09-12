import { describe, expect, it } from 'vitest'
import { SortKey } from '@/hooks'
import { DEVICE_COLUMNS } from '../columns'

describe('DEVICE_COLUMNS', () => {
  /*
    Every column is sortable, and its key is the one the selection hook
    implements. A column naming a key the hook does not handle would render a
    sort control that silently does nothing.
  */
  it('names only sort keys the selection hook implements', () => {
    const keys = DEVICE_COLUMNS.map((column) => column.key)

    expect(keys).toEqual(Object.values(SortKey))
  })

  it('has no duplicate columns', () => {
    const keys = DEVICE_COLUMNS.map((column) => column.key)

    expect(new Set(keys).size).toBe(keys.length)
  })

  /*
    The design right-aligns and monospaces the statistics so the table is
    scannable down a column; the three identifying columns stay text.
  */
  it('marks the statistics numeric and the identifiers not', () => {
    const numeric = DEVICE_COLUMNS.filter((column) => column.isNumeric).map((c) => c.key)

    expect(numeric).toEqual([
      SortKey.Mean,
      SortKey.Deviation,
      SortKey.Sd,
      SortKey.OutOfTolerance,
      SortKey.Readings,
    ])
  })

  it('gives every column a visible label', () => {
    expect(DEVICE_COLUMNS.every((column) => column.label.trim().length > 0)).toBe(true)
  })
})

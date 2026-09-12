/** Types for the utility helpers. */

/**
 * One cell of a CSV row.
 *
 * `null` is distinct from an empty string: it is written as an empty field and
 * means "no value here", which is what a device with no reference deviation
 * needs. A number is kept as a number so callers do not format it twice.
 */
export type CsvCell = string | number | null

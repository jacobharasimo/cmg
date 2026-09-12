import type { BatchReport } from '@/lib'

/** Types for `useDeviceReport`. */

/**
 * The hook returns the library's report unchanged.
 *
 * Aliased rather than re-exported so components name the hook's contract rather
 * than the library's, which is what lets the two diverge if a server ever
 * returns a different shape.
 */
export type UseDeviceReportResult = BatchReport

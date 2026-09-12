/** Types for `useVirtualRows`. */

export interface UseVirtualRowsOptions {
  /** How many rows the full list has. */
  readonly count: number
  /**
   * Height to assume before a real row has been measured. Only affects the
   * first paint; the measured value replaces it immediately after.
   */
  readonly estimatedRowHeight: number
  /** Rows rendered beyond each edge of the viewport. */
  readonly overscan?: number | undefined
}

export interface UseVirtualRowsResult {
  /** First row to render. */
  readonly startIndex: number
  /** One past the last row to render. */
  readonly endIndex: number
  /** Spacer height standing in for the rows above the window. */
  readonly paddingTop: number
  /** Spacer height standing in for the rows below it. */
  readonly paddingBottom: number
  /** Attach to the scrolling container. */
  readonly scrollRef: (node: HTMLElement | null) => void
  /** Attach to any rendered row; its height drives the window. */
  readonly rowRef: (node: HTMLElement | null) => void
}

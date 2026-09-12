import { useCallback, useEffect, useMemo, useState } from 'react'
import type { UseVirtualRowsOptions, UseVirtualRowsResult } from './types'

/** Rows kept beyond each edge, so scrolling does not reveal blank space. */
const DEFAULT_OVERSCAN = 8

/**
 * Windows a long, uniform-height list down to the rows actually on screen.
 *
 * Returns the slice to render plus the two spacer heights that stand in for
 * everything above and below it, so the scrollbar still reflects the full list.
 * The caller renders those as empty rows: a `tbody` cannot take padding, and
 * this has to stay a real `<table>` for its semantics to survive.
 *
 * **Row height is measured, never assumed.** `estimatedRowHeight` is used for
 * one paint and then replaced by the real height of a rendered row, watched
 * with a `ResizeObserver`. That is what keeps the window correct at 200% zoom
 * and under increased text spacing (WCAG 1.4.4 and 1.4.12), where a hard-coded
 * height would drift further out of position the further you scrolled.
 *
 * **A short list is not windowed.** When everything fits, the arithmetic
 * returns the whole range and both spacers are zero, so there is no separate
 * code path to keep working.
 */
export const useVirtualRows = ({
  count,
  estimatedRowHeight,
  overscan = DEFAULT_OVERSCAN,
}: UseVirtualRowsOptions): UseVirtualRowsResult => {
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const [rowHeight, setRowHeight] = useState(estimatedRowHeight)
  /*
    State, not a ref. The effect below has to run *after* the node exists, and
    a ref would not re-trigger it — the listener would then attach only when
    React happens to commit the ref before the effect, and silently never
    attach if the container mounted later.
  */
  const [scrollNode, setScrollNode] = useState<HTMLElement | null>(null)

  const scrollRef = useCallback((node: HTMLElement | null) => {
    setScrollNode(node)
  }, [])

  const rowRef = useCallback((node: HTMLElement | null) => {
    if (!node) return
    const measured = node.getBoundingClientRect().height
    // Zero while the row is still laying out; taking it would window to nothing.
    if (measured > 0) setRowHeight(measured)
  }, [])

  useEffect(() => {
    const node = scrollNode
    if (!node) return

    const sync = (): void => {
      setViewportHeight(node.clientHeight)
      setScrollTop(node.scrollTop)
    }

    node.addEventListener('scroll', sync, { passive: true })

    /*
      The container is a grid track, so it resizes with the window rather than
      only at mount. `observe` also fires the callback once straight away,
      which is where the first measurement comes from — measuring here in the
      effect body instead would be a synchronous `setState` during an effect.
    */
    const observer = new ResizeObserver(sync)
    observer.observe(node)

    return () => {
      node.removeEventListener('scroll', sync)
      observer.disconnect()
    }
  }, [scrollNode])

  return useMemo(() => {
    const safeHeight = rowHeight > 0 ? rowHeight : estimatedRowHeight
    const first = Math.max(0, Math.floor(scrollTop / safeHeight) - overscan)
    const visible = Math.ceil(viewportHeight / safeHeight) + overscan * 2
    const last = Math.min(count, first + visible + 1)

    return {
      startIndex: first,
      endIndex: last,
      paddingTop: first * safeHeight,
      paddingBottom: Math.max(0, (count - last) * safeHeight),
      scrollRef,
      rowRef,
    }
  }, [count, estimatedRowHeight, overscan, rowHeight, rowRef, scrollRef, scrollTop, viewportHeight])
}

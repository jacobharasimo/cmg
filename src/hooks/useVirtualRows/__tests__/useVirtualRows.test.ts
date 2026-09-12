import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useVirtualRows } from '../useVirtualRows'

const ROW = 40

/**
 * A stand-in for the scroll container.
 *
 * jsdom has no layout, so `clientHeight` is always 0 and a real element would
 * window to nothing. Defining the two values the hook reads is what makes the
 * arithmetic testable without a browser.
 */
const container = (viewportHeight: number): HTMLElement => {
  const node = document.createElement('div')
  Object.defineProperty(node, 'clientHeight', { value: viewportHeight, configurable: true })
  Object.defineProperty(node, 'scrollTop', { value: 0, writable: true, configurable: true })
  return node
}

/** A row of a known height, since jsdom measures everything as zero. */
const row = (height: number): HTMLElement => {
  const node = document.createElement('tr')
  node.getBoundingClientRect = () => ({ height }) as DOMRect
  return node
}

const scrollTo = (node: HTMLElement, top: number): void => {
  Object.defineProperty(node, 'scrollTop', { value: top, writable: true, configurable: true })
  node.dispatchEvent(new Event('scroll'))
}

/** Mount the hook attached to a container and a measured row. */
const setup = (count: number, viewportHeight = 400, overscan = 2) => {
  const node = container(viewportHeight)
  const rendered = renderHook(() =>
    useVirtualRows({ count, estimatedRowHeight: ROW, overscan }),
  )
  act(() => {
    rendered.result.current.scrollRef(node)
    rendered.result.current.rowRef(row(ROW))
  })
  return { ...rendered, node }
}

describe('useVirtualRows', () => {
  it('starts at the top', () => {
    const { result } = setup(100)

    expect(result.current.startIndex).toBe(0)
    expect(result.current.paddingTop).toBe(0)
  })

  it('renders only the rows near the viewport', () => {
    const { result } = setup(100)

    // 400px viewport / 40px rows = 10 visible, plus overscan on both sides.
    expect(result.current.endIndex - result.current.startIndex).toBeLessThan(20)
  })

  /*
    The scrollbar has to measure the whole batch, not the window — otherwise it
    would jump as rows mount and unmount.
  */
  it('pads to the full height of the list', () => {
    const { result } = setup(100)
    const { startIndex, endIndex, paddingTop, paddingBottom } = result.current

    const rendered = (endIndex - startIndex) * ROW
    expect(paddingTop + rendered + paddingBottom).toBe(100 * ROW)
  })

  it('moves the window as the container scrolls', () => {
    const { result, node } = setup(100)

    act(() => {
      scrollTo(node, 40 * ROW)
    })

    expect(result.current.startIndex).toBe(38) // 40 - overscan
    expect(result.current.paddingTop).toBe(38 * ROW)
  })

  it('keeps overscan rows above the viewport, so scrolling up is not blank', () => {
    const { result, node } = setup(100, 400, 5)

    act(() => {
      scrollTo(node, 40 * ROW)
    })

    expect(result.current.startIndex).toBe(35)
  })

  it('never starts before the first row or ends past the last', () => {
    const { result, node } = setup(20)

    act(() => {
      scrollTo(node, 10_000)
    })

    expect(result.current.startIndex).toBeGreaterThanOrEqual(0)
    expect(result.current.endIndex).toBeLessThanOrEqual(20)
    expect(result.current.paddingBottom).toBeGreaterThanOrEqual(0)
  })

  /*
    A list that fits needs no window, and the arithmetic has to reach that on
    its own — a separate branch for short lists is a branch that rots.
  */
  it('renders a short list whole, with no spacers', () => {
    const { result } = setup(4)

    expect(result.current.startIndex).toBe(0)
    expect(result.current.endIndex).toBe(4)
    expect(result.current.paddingTop).toBe(0)
    expect(result.current.paddingBottom).toBe(0)
  })

  it('handles an empty list', () => {
    const { result } = setup(0)

    expect(result.current.startIndex).toBe(0)
    expect(result.current.endIndex).toBe(0)
    expect(result.current.paddingBottom).toBe(0)
  })

  /*
    Row height is measured rather than assumed, which is what keeps the window
    correct at 200% zoom and under increased text spacing (WCAG 1.4.4, 1.4.12).
  */
  it('re-windows when the measured row height changes', () => {
    const { result, node } = setup(100)
    act(() => {
      scrollTo(node, 40 * ROW)
    })
    const beforeZoom = result.current.startIndex

    act(() => {
      result.current.rowRef(row(ROW * 2))
    })

    expect(result.current.startIndex).toBeLessThan(beforeZoom)
    expect(result.current.paddingTop + result.current.paddingBottom).toBeGreaterThan(0)
  })

  it('ignores a row that has not laid out yet, rather than windowing to nothing', () => {
    const { result } = setup(100)

    act(() => {
      result.current.rowRef(row(0))
    })

    expect(result.current.endIndex).toBeGreaterThan(0)
  })
})

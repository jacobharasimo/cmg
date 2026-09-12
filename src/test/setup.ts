/**
 * Vitest setup for the `ui` project.
 *
 * Adds the jest-dom matchers, stubs the one browser API jsdom lacks that our
 * code uses, and unmounts anything a test rendered so no test inherits
 * another's DOM.
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/*
  jsdom implements no `ResizeObserver`, and `useVirtualRows` watches the table's
  scroll container with one. jsdom has no layout, so this reports no sizes — but
  it does reproduce the one behaviour callers depend on, the callback firing
  once on `observe`. The windowing arithmetic is tested in that hook's own test,
  and its real behaviour in Playwright.
*/
class StubResizeObserver implements ResizeObserver {
  private readonly callback: ResizeObserverCallback

  public constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }

  // The real API invokes the callback once on observe, and code relies on that
  // for its first measurement. jsdom reports no size, so the entries are empty
  // — callers here read the node directly.
  public observe(): void {
    this.callback([], this)
  }

  public unobserve(): void {
    // Nothing to stop observing.
  }

  public disconnect(): void {
    // Nothing to disconnect.
  }
}

globalThis.ResizeObserver ??= StubResizeObserver

afterEach(() => {
  cleanup()
})

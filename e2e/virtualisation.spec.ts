import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test, uploadSampleBatch } from './fixtures'

/**
 * The device table is windowed: only the rows near the viewport are in the DOM.
 *
 * The sample batch is 46 devices, which is enough to prove the mechanism. The
 * reason it exists is the 2,300-device case, where the unwindowed table is
 * ~18,400 cells on first render.
 */
const container = (page: Page) => page.locator('.MuiTableContainer-root')
const renderedNames = (page: Page) =>
  page.locator('tbody tr[aria-rowindex] th button').allTextContents()

test.describe('the windowed device table', () => {
  test.beforeEach(async ({ console: page }) => {
    await uploadSampleBatch(page)
  })

  test('renders fewer rows than the batch holds', async ({ console: page }) => {
    const rendered = await renderedNames(page)

    expect(rendered.length).toBeGreaterThan(0)
    expect(rendered.length).toBeLessThan(46)
  })

  /*
    The count a screen reader is given has to be the batch, not the window, or
    it reports a fleet of twenty. The header is row 1, so the count is 46 + 1.
  */
  test('declares the full batch size, not the rendered slice', async ({ console: page }) => {
    await expect(page.locator('table[aria-rowcount]')).toHaveAttribute('aria-rowcount', '47')
  })

  test('numbers each row by its place in the batch', async ({ console: page }) => {
    const first = page.locator('tbody tr[aria-rowindex]').first()

    // Row 1 is the header, so the first body row is 2.
    await expect(first).toHaveAttribute('aria-rowindex', '2')
  })

  /*
    The spacers standing in for windowed-out rows must total the full list, or
    the scrollbar would shrink as you scrolled and the thumb would jump.
  */
  test('keeps the scrollbar measuring the whole batch', async ({ console: page }) => {
    const { scrollH, clientH } = await container(page).evaluate((node) => ({
      scrollH: node.scrollHeight,
      clientH: node.clientHeight,
    }))

    expect(scrollH).toBeGreaterThan(clientH * 4)
  })

  test('swaps in later devices as it scrolls', async ({ console: page }) => {
    const atTop = await renderedNames(page)

    await container(page).evaluate((node) => {
      node.scrollTop = node.scrollHeight
    })
    await expect
      .poll(async () => (await renderedNames(page))[0])
      .not.toBe(atTop[0])

    const atBottom = await renderedNames(page)
    expect(atBottom).not.toEqual(atTop)
    // The last device alphabetically is only reachable by scrolling.
    expect(atBottom.at(-1)).not.toBe(atTop.at(-1))
  })

  test('still selects a device from a scrolled row', async ({ console: page }) => {
    await container(page).evaluate((node) => {
      node.scrollTop = node.scrollHeight
    })
    // Let the window settle: the rows at the very edge are the ones it swaps.
    await expect.poll(async () => (await renderedNames(page))[0]).not.toBe('hum-1')
    const names = await renderedNames(page)
    const target = names[Math.floor(names.length / 2)] ?? ''

    await page.getByRole('button', { name: target, exact: true }).click()

    await expect(page.getByRole('combobox', { name: /device/i }).first()).toHaveText(
      new RegExp(target),
    )
  })

  test('passes an axe scan while scrolled', async ({ console: page }) => {
    await container(page).evaluate((node) => {
      node.scrollTop = node.scrollHeight
    })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })
})

import { expect, test, uploadSampleBatch } from './fixtures'

/**
 * WCAG 2.4.11 Focus Not Obscured (Minimum).
 *
 * The device table has a sticky header. A row focused while scrolled can end
 * up underneath it, which is invisible to any test without layout — and is the
 * single most likely way this UI fails.
 */
test.describe('focus not obscured', () => {
  test('a row focused far down the table is not hidden by the sticky header', async ({
    console: page,
  }) => {
    await uploadSampleBatch(page)
    const region = page.getByRole('region', { name: /Device evaluation table/ })
    const rowButtons = page.locator('tbody button')

    // Somewhere well past the first screenful of rows.
    const target = rowButtons.nth(12)
    await target.focus()
    await target.scrollIntoViewIfNeeded()

    const header = page.locator('thead').first()
    const headerBox = await header.boundingBox()
    const targetBox = await target.boundingBox()

    expect(targetBox, 'the focused row has no box — it is not rendered').not.toBeNull()
    expect(headerBox).not.toBeNull()

    // The focused control must start below where the sticky header ends.
    expect(
      targetBox?.y ?? 0,
      'the focused row is underneath the sticky header',
    ).toBeGreaterThanOrEqual((headerBox?.y ?? 0) + (headerBox?.height ?? 0) - 1)

    // And it must still be inside the scroll region, not clipped away.
    const regionBox = await region.boundingBox()
    expect((targetBox?.y ?? 0) + (targetBox?.height ?? 0)).toBeLessThanOrEqual(
      (regionBox?.y ?? 0) + (regionBox?.height ?? 0) + 1,
    )
  })

  test('tabbing through rows keeps each one visible', async ({ console: page }) => {
    await uploadSampleBatch(page)
    const first = page.locator('tbody button').first()
    await first.focus()

    for (let i = 0; i < 15; i += 1) {
      await page.keyboard.press('Tab')
      const active = page.locator('tbody button:focus')
      if ((await active.count()) === 0) break

      const box = await active.boundingBox()
      const headerBox = await page.locator('thead').first().boundingBox()

      expect(
        box?.y ?? 0,
        `row ${String(i)} is under the sticky header`,
      ).toBeGreaterThanOrEqual((headerBox?.y ?? 0) + (headerBox?.height ?? 0) - 1)
    }
  })
})

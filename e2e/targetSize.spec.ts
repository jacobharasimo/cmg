import { expect, MIN_TARGET_PX, test } from './fixtures'

/**
 * WCAG 2.5.8 Target Size (Minimum), measured from computed layout — the one
 * thing a unit test genuinely cannot do.
 */
test.describe('target size', () => {
  const cases = [
    ['buttons', 'button'],
    ['filter pills', '[role="radiogroup"] label'],
    ['sort labels', 'th [role="button"], th .MuiTableSortLabel-root'],
    ['slider thumbs', '.MuiSlider-thumb'],
    ['the clock switch', '[role="switch"]'],
    /*
      The upload control is a styled label wrapping a 1x1 clipped file input.
      The label is the pointer target — clicking it is what opens the dialog —
      so the label is what 2.5.8 applies to, and the `button` selector above
      does not reach it.
    */
    ['the upload control', 'label:has(input[type="file"])'],
  ] as const

  for (const [name, selector] of cases) {
    test(`${name} are at least ${String(MIN_TARGET_PX)}x${String(MIN_TARGET_PX)}`, async ({
      console: page,
    }) => {
      const targets = page.locator(selector)
      const count = await targets.count()
      expect(count, `no ${name} found — the selector is probably stale`).toBeGreaterThan(0)

      for (let i = 0; i < count; i += 1) {
        const target = targets.nth(i)
        if (!(await target.isVisible())) continue

        const box = await target.boundingBox()
        const label = (await target.textContent())?.trim() ?? selector
        expect(box?.width ?? 0, `${label} is too narrow`).toBeGreaterThanOrEqual(MIN_TARGET_PX)
        expect(box?.height ?? 0, `${label} is too short`).toBeGreaterThanOrEqual(MIN_TARGET_PX)
      }
    })
  }
})

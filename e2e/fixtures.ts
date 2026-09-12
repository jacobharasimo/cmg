import { expect, test as base } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

/** WCAG 2.5.8 Target Size (Minimum). */
export const MIN_TARGET_PX = 24

/** Loads the console and waits for the charts, which render after the data. */
export const test = base.extend<{ console: Page }>({
  console: async ({ page }, use) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: 'Sensor QC Console' })).toBeVisible()
    // Highcharts renders into SVG; the ranking chart is the last to appear.
    await expect(page.locator('svg.highcharts-root').first()).toBeVisible()
    await use(page)
  },
})

/** The element that currently has focus. */
export const focused = (page: Page): Locator => page.locator(':focus')

/**
 * Load the 46-device batch through the UI's own file input.
 *
 * The app opens on the spec's six-device example, which is too small to scroll.
 * Uploading the committed batch is both how a reader would try a real log and
 * how these tests get enough rows to check scrolling behaviour.
 */
export const uploadSampleBatch = async (page: Page): Promise<void> => {
  await page.locator('input[type="file"]').setInputFiles('synthetic_log_test.txt')
  await expect(page.getByText(/synthetic_log_test\.txt/)).toBeVisible()
}

/**
 * Wait for a CSS transition to finish.
 *
 * `toBeVisible()` resolves the moment an element is displayed, which for
 * anything MUI grows or fades in is the *start* of the animation. Measuring
 * then is measuring the animation: a 30px button mid-`Grow` reports 22.5px
 * because the parent is still at `scale(0.75)`, and a filled surface still
 * blending toward its colour fails a contrast check it passes when settled.
 *
 * Any assertion about geometry or colour has to come after this.
 */
export const settled = async (locator: Locator): Promise<void> => {
  await expect
    .poll(async () =>
      locator.evaluate((node) => {
        const style = getComputedStyle(node)
        return `${style.opacity}|${style.transform}`
      }),
    )
    .toMatch(/^1\|(none|matrix\(1, 0, 0, 1, 0, 0\))$/)
}

/**
 * Click a sensor-type filter.
 *
 * The radio input is visually hidden, so the label is the click surface — for
 * a real user as much as for the test. Keyboard users reach it with arrow keys
 * instead, which `keyboard.spec.ts` covers.
 */
export const filterBy = async (page: Page, label: string): Promise<void> => {
  await page.locator('label').filter({ hasText: label }).click()
  await expect(page.getByRole('radio', { name: label })).toBeChecked()
}

export { expect }

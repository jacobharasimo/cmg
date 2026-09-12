import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, MIN_TARGET_PX, settled, test } from './fixtures'

/**
 * Rejecting a file the console cannot use.
 *
 * The parser accepts a damaged log on purpose, so the failure that has to be
 * reported is the whole-file one: the user picked something that is not a
 * sensor log at all.
 *
 * The same file the repo keeps for testing this by hand, so the automated and
 * manual paths cannot drift — see the pair at the repo root.
 */
const NOT_A_LOG = 'synthetic_log_failure_test.txt'

/** Upload a file and wait for the banner to finish growing in. */
const upload = async (page: Page, path: string): Promise<void> => {
  await page.locator('input[type="file"]').setInputFiles(path)
  const alert = page.getByRole('alert')
  await expect(alert).toBeVisible()
  await settled(alert)
}

test.describe('the error banner', () => {
  test('is absent until something fails', async ({ console: page }) => {
    await expect(page.getByRole('alert')).toBeHidden()
  })

  test('reports a file that is not a sensor log', async ({ console: page }) => {
    await upload(page, NOT_A_LOG)

    const alert = page.getByRole('alert')
    await expect(alert).toContainText('Log file parsing failed')
    await expect(alert).toContainText('synthetic_log_failure_test.txt')
  })

  /*
    The invariant behind keeping the previous log: a rejected file must not
    leave an empty console, which would be indistinguishable from a log that
    genuinely has no devices.
  */
  test('leaves the previous log and its verdicts on screen', async ({ console: page }) => {
    await upload(page, NOT_A_LOG)

    await expect(page.getByText(/spec example log/)).toBeVisible()
    await expect(page.getByText(/6 devices/)).toBeVisible()
    await expect(page.getByRole('region', { name: /JSON output/ })).toContainText(
      '"temp-1": "precise"',
    )
  })

  test('is dismissed by its close button', async ({ console: page }) => {
    await upload(page, NOT_A_LOG)

    await page.getByRole('button', { name: /close/i }).click()

    await expect(page.getByRole('alert')).toBeHidden()
  })

  /*
    The Snackbar renders in a Portal, which puts its close button last in the
    tab order. Escape is what makes it dismissable without tabbing the page.
  */
  test('is dismissed by Escape', async ({ console: page }) => {
    await upload(page, NOT_A_LOG)

    await page.keyboard.press('Escape')

    await expect(page.getByRole('alert')).toBeHidden()
  })

  test('survives a click elsewhere, so it cannot be lost by accident', async ({ console: page }) => {
    await upload(page, NOT_A_LOG)

    await page.getByRole('heading', { level: 1 }).click()

    await expect(page.getByRole('alert')).toBeVisible()
  })

  test('clears itself when a good log is loaded', async ({ console: page }) => {
    await upload(page, NOT_A_LOG)

    await page.getByRole('button', { name: 'Spec example log' }).click()

    await expect(page.getByRole('alert')).toBeHidden()
  })

  /*
    Measured after the Grow settles — mid-animation the parent is at
    `scale(0.75)` and this same 30px control reports 22.5px.
  */
  test('has a dismiss target of at least 24x24 (WCAG 2.5.8)', async ({ console: page }) => {
    await upload(page, NOT_A_LOG)

    const box = await page.getByRole('button', { name: /close/i }).boundingBox()

    expect(box?.width ?? 0).toBeGreaterThanOrEqual(MIN_TARGET_PX)
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(MIN_TARGET_PX)
  })

  test('passes an axe scan while open', async ({ console: page }) => {
    await upload(page, NOT_A_LOG)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })
})

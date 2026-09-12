import { expect, test, uploadSampleBatch } from './fixtures'

/**
 * Where a log comes from. The app ships with one bundled log and one file to
 * upload, and both routes have to reach the same place.
 */
test.describe('log source', () => {
  test("opens on the spec's example log, so its stated verdicts are on screen", async ({
    console: page,
  }) => {
    await expect(page.getByText(/spec example log/)).toBeVisible()

    // The six devices and verdicts the assignment specifies (p.6).
    await expect(page.getByRole('region', { name: /JSON output/ })).toContainText(
      '"temp-1": "precise"',
    )
    await expect(page.getByRole('region', { name: /JSON output/ })).toContainText(
      '"mon-2": "discard"',
    )
  })

  test('accepts an uploaded log and re-evaluates the batch', async ({ console: page }) => {
    await expect(page.getByText(/6 devices/)).toBeVisible()

    await uploadSampleBatch(page)

    await expect(page.getByText(/46 devices/)).toBeVisible()
    await expect(page.getByText(/2,441 lines/)).toBeVisible()
  })

  test('returns to the example log afterwards', async ({ console: page }) => {
    await uploadSampleBatch(page)
    await page.getByRole('button', { name: 'Spec example log' }).click()

    await expect(page.getByText(/spec example log/)).toBeVisible()
    await expect(page.getByText(/6 devices/)).toBeVisible()
  })

  test('never makes dragging the only way in (WCAG 2.5.7)', async ({ console: page }) => {
    await expect(page.getByRole('button', { name: 'Spec example log' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Upload log…' })).toBeVisible()
  })
})

import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

/**
 * The ranking chart is a second way to select a device, alongside the table.
 *
 * The detail panel's device picker is the readout: it names whatever is
 * currently selected, so it is how a selection made anywhere is observed.
 */
const selectedDevice = (page: Page) =>
  page.getByRole('combobox', { name: /device/i }).first()

/** Bars of the ranking chart, which is the first chart on the page. */
const bars = (page: Page) =>
  page.locator('svg.highcharts-root').first().locator('.highcharts-series .highcharts-point')

test.describe('the ranking chart', () => {
  test('selects a device when its bar is clicked', async ({ console: page }) => {
    await expect(selectedDevice(page)).toHaveText(/hum-1/)

    await bars(page).nth(1).click({ force: true })

    await expect(selectedDevice(page)).toHaveText(/hum-2/)
  })

  test('drives the same selection the table does', async ({ console: page }) => {
    await bars(page).nth(1).click({ force: true })

    // The row the table marks selected is the one the chart just chose.
    await expect(page.getByRole('button', { name: 'hum-2', exact: true })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  /*
    Selection is marked across the whole row — a band, an accent border and a
    caret on the category label — because a bar outline is invisible on a short
    bar. The caret is also what identifies the row without relying on colour
    (WCAG 1.4.1).
  */
  test('marks the selected row with a caret, not colour alone', async ({ console: page }) => {
    await bars(page).nth(1).click({ force: true })

    const labels = page.locator('svg.highcharts-root').first().locator('.highcharts-xaxis-labels')
    await expect(labels).toContainText('▸ hum-2')
  })
})

import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, filterBy, test } from './fixtures'

/** The conformance target. `best-practice` is deliberately excluded. */
const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const scan = (page: Page) => new AxeBuilder({ page }).withTags(WCAG_AA).analyze()

test.describe('axe', () => {
  test('the console has no violations on load', async ({ console: page }) => {
    const { violations } = await scan(page)

    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
  })

  test('no violations after filtering to one sensor type', async ({ console: page }) => {
    await filterBy(page, 'Thermometer')
    const { violations } = await scan(page)

    expect(violations.map((v) => v.id)).toEqual([])
  })

  test('no violations after selecting a different device', async ({ console: page }) => {
    await page.getByRole('button', { name: 'temp-1', exact: true }).click()
    const { violations } = await scan(page)

    expect(violations.map((v) => v.id)).toEqual([])
  })

  test('no violations after moving a threshold', async ({ console: page }) => {
    const slider = page.getByRole('slider', { name: 'Humidity tolerance' })
    await slider.focus()
    await slider.press('Home')
    const { violations } = await scan(page)

    expect(violations.map((v) => v.id)).toEqual([])
  })
})

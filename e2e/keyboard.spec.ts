import { expect, focused, test } from './fixtures'

/**
 * WCAG 2.1.1 and 2.4.7. None of this can be checked in jsdom: it has no focus
 * ring to paint and no layout to tab through.
 */
test.describe('keyboard', () => {
  test('every control is reachable by tabbing, and focus is always visible', async ({
    console: page,
  }) => {
    const seen: string[] = []

    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab')
      const element = focused(page)
      if ((await element.count()) === 0) break

      const described = await element.evaluate((node) => {
        const text = (node.getAttribute('aria-label') ?? node.textContent ?? '').trim().slice(0, 40)
        return `${node.tagName} "${text}"`
      })

      // Highcharts draws its own focus border into the SVG rather than with
      // CSS. Its accessibility module owns that, and is asserted separately.
      const isSvg = await element.evaluate((node) => node.namespaceURI?.includes('svg') === true)
      if (isSvg) {
        seen.push(described)
        continue
      }

      /*
        WCAG 2.4.7 — focus must be visible, but not every control paints it the
        same way. Buttons draw an `outline`; MUI's Select leaves its own box
        bare and recolours the notched `fieldset` it renders alongside; and a
        deliberately hidden control — the file input inside the upload label —
        is clipped to 1x1, so its own outline is painted but invisible and the
        ring has to land on the visible ancestor instead. All three count.

        The style is read while focused rather than compared against a blurred
        snapshot: the ring hangs off MUI's `Mui-focusVisible` class, which React
        strips a tick after the blur event, so the two snapshots would match.
      */
      const isVisiblyFocused = await element.evaluate((node: HTMLElement) => {
        const isPainted = (target: Element): boolean => {
          const s = getComputedStyle(target)
          return (
            (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) ||
            s.boxShadow !== 'none'
          )
        }

        // Big enough for a ring drawn on it to actually be seen.
        const isVisibleBox = (target: Element): boolean => {
          const { width, height } = target.getBoundingClientRect()
          return width >= 2 && height >= 2
        }

        if (isVisibleBox(node)) {
          if (isPainted(node)) return true
          return node.closest('.MuiInputBase-root')?.classList.contains('Mui-focused') === true
        }

        // A visually hidden control. Its own outline is clipped away with it,
        // so the indicator is only real if a visible ancestor carries it.
        for (let parent = node.parentElement; parent; parent = parent.parentElement) {
          if (isVisibleBox(parent)) return isPainted(parent)
        }
        return false
      })

      expect(isVisiblyFocused, `nothing marks focus on ${described}`).toBe(true)
      seen.push(described)
    }

    expect(seen.length).toBeGreaterThan(15)
  })

  test('the filter group is one tab stop, with arrows moving inside it', async ({
    console: page,
  }) => {
    const all = page.getByRole('radio', { name: 'All' })
    await all.focus()
    await page.keyboard.press('ArrowRight')

    // Native radio behaviour: focus moves and selection follows.
    await expect(page.getByRole('radio', { name: 'Thermometer' })).toBeChecked()

    await page.keyboard.press('Tab')
    await expect(focused(page)).not.toHaveAttribute('type', 'radio')
  })

  test('a device row is selected by its button, with Enter', async ({ console: page }) => {
    const row = page.getByRole('button', { name: 'temp-2', exact: true })
    await row.focus()
    await row.press('Enter')

    await expect(row).toHaveAttribute('aria-current', 'true')
  })

  test('thresholds are operable by arrow keys, as WCAG 2.5.7 requires', async ({
    console: page,
  }) => {
    const slider = page.getByRole('slider', { name: 'CO tolerance' })
    await slider.focus()
    const before = await slider.getAttribute('aria-valuenow')

    await slider.press('ArrowRight')

    await expect(slider).not.toHaveAttribute('aria-valuenow', before ?? '')
  })

  test('scroll regions are reachable, so their overflow is not trapped', async ({
    console: page,
  }) => {
    await expect(page.getByRole('region', { name: /Device evaluation table/ })).toHaveAttribute(
      'tabindex',
      '0',
    )
    await expect(page.getByRole('region', { name: /JSON output/ })).toHaveAttribute('tabindex', '0')
  })
})

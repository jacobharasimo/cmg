import { describe, expect, it } from 'vitest'
import { renderWithTheme, screen } from '@/test/renderWithTheme'
import { VisuallyHiddenInput } from '../VisuallyHiddenInput'

describe('VisuallyHiddenInput', () => {
  /*
    The whole point of the component. `display: none` and the `hidden`
    attribute both hide an element from the accessibility tree and the tab
    order; clipping hides it from sight only.
  */
  it('is invisible but still focusable', () => {
    renderWithTheme(<VisuallyHiddenInput type="file" aria-label="pick" />)
    const input = screen.getByLabelText('pick')

    const style = getComputedStyle(input)
    expect(style.clipPath).toBe('inset(50%)')
    expect(style.position).toBe('absolute')
    expect(style.display).not.toBe('none')

    input.focus()
    expect(input).toHaveFocus()
  })

  it('occupies no layout space', () => {
    renderWithTheme(<VisuallyHiddenInput type="file" aria-label="pick" />)

    const style = getComputedStyle(screen.getByLabelText('pick'))
    expect(style.width).toBe('1px')
    expect(style.height).toBe('1px')
    expect(style.overflow).not.toBe('visible')
  })
})

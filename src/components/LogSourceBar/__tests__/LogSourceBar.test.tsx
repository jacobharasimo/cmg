import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithTheme, screen, userEvent } from '@/test/renderWithTheme'
import LogSourceBar from '../LogSourceBar'

// Isolation: statsLine has its own test; stub it so this file tests the controls.
vi.mock('../statsLine', () => ({ statsLine: vi.fn(() => 'stats line') }))

const handlers = { onLoadExample: vi.fn(), onLoadFile: vi.fn() }

function setup() {
  return renderWithTheme(<LogSourceBar source={null} deviceCount={0} {...handlers} />)
}

describe('LogSourceBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('is a labelled region', () => {
    setup()

    expect(screen.getByRole('region', { name: 'Log source' })).toBeInTheDocument()
  })

  it("loads the spec's example log", async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('button', { name: 'Spec example log' }))

    expect(handlers.onLoadExample).toHaveBeenCalledOnce()
  })

  it('offers keyboard-reachable alternatives to dropping a file (WCAG 2.5.7)', () => {
    setup()

    expect(screen.getByRole('button', { name: 'Spec example log' })).toBeInTheDocument()
    expect(screen.getByLabelText('Upload log…')).toBeInTheDocument()
  })

  it('announces the stats line politely', () => {
    setup()

    expect(screen.getByText('stats line')).toHaveAttribute('aria-live', 'polite')
  })

  it('passes a chosen file up', async () => {
    const user = userEvent.setup()
    setup()
    const file = new File(['reference 70.0 45.0 6'], 'batch.log', { type: 'text/plain' })

    await user.upload(screen.getByLabelText('Upload log…'), file)

    expect(handlers.onLoadFile).toHaveBeenCalledExactlyOnceWith(file)
  })

  it('accepts the same file twice in a row', async () => {
    const user = userEvent.setup()
    setup()
    const input = screen.getByLabelText('Upload log…')
    const file = new File(['reference 70.0 45.0 6'], 'batch.log', { type: 'text/plain' })

    await user.upload(input, file)
    await user.upload(input, file)

    expect(handlers.onLoadFile).toHaveBeenCalledTimes(2)
  })

  describe('the upload control', () => {
    /*
      `ButtonBase` turns any non-`button` component into a focusable
      `role="button"`, which would leave this control with two tab stops — the
      label and the file input inside it — and a label claiming a role it cannot
      fulfil. Both are undone in the component; this is the regression test.
    */
    it('is the file input itself, not a label pretending to be a button', () => {
      setup()
      const input = screen.getByLabelText('Upload log…')
      const label = input.closest('label')

      expect(input).toHaveAttribute('type', 'file')
      expect(label).not.toHaveAttribute('role')
      expect(label).toHaveAttribute('tabindex', '-1')
    })

    /*
      Visually hidden, but never `hidden`: the attribute would drop it from the
      tab order and the accessibility tree, and there is no other focusable
      element here to take its place.
    */
    it('stays in the tab order', () => {
      setup()
      const input = screen.getByLabelText('Upload log…')

      expect(input).not.toHaveAttribute('hidden')
      expect(input).not.toHaveAttribute('tabindex')
      input.focus()
      expect(input).toHaveFocus()
    })
  })

  it('passes a dropped file up', () => {
    setup()
    const file = new File(['reference 70.0 45.0 6'], 'dropped.log', { type: 'text/plain' })
    const region = screen.getByRole('region', { name: 'Log source' })

    const event = new Event('drop', { bubbles: true })
    Object.defineProperty(event, 'dataTransfer', { value: { files: [file] } })
    region.dispatchEvent(event)

    expect(handlers.onLoadFile).toHaveBeenCalledExactlyOnceWith(file)
  })
})

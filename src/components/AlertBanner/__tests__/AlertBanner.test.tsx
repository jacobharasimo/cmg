import { describe, expect, it, vi } from 'vitest'
import { renderWithTheme, screen, userEvent } from '@/test/renderWithTheme'
import AlertBanner from '../AlertBanner'

/*
  Only what this file decides. Snackbar's positioning and Alert's role, icon
  and close button are MUI's, and are covered where they matter — the axe scan
  and keyboard pass in `e2e/errorBanner.spec.ts`.
*/
describe('AlertBanner', () => {
  it('renders nothing when there is no message', () => {
    renderWithTheme(<AlertBanner message={null} severity="error" onDismiss={vi.fn()} />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows the message it is given', () => {
    renderWithTheme(
      <AlertBanner message="Log file upload failed" severity="error" onDismiss={vi.fn()} />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Log file upload failed')
  })

  it('reports dismissal from the close button', async () => {
    const onDismiss = vi.fn()
    renderWithTheme(<AlertBanner message="failed" severity="error" onDismiss={onDismiss} />)

    await userEvent.setup().click(screen.getByRole('button', { name: /close/i }))

    expect(onDismiss).toHaveBeenCalledOnce()
  })

  /*
    The one piece of Snackbar behaviour this component overrides. Left alone,
    a click anywhere would dismiss the bar — letting an unrelated click discard
    the only report that a file was rejected.
  */
  it('ignores a clickaway, so it cannot be lost by accident', async () => {
    const onDismiss = vi.fn()
    renderWithTheme(
      <>
        <button type="button">elsewhere</button>
        <AlertBanner message="failed" severity="error" onDismiss={onDismiss} />
      </>,
    )

    await userEvent.setup().click(screen.getByRole('button', { name: 'elsewhere' }))

    expect(onDismiss).not.toHaveBeenCalled()
  })
})

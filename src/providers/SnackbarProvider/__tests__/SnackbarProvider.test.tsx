import { use } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithTheme, screen, userEvent } from '@/test/renderWithTheme'
import { SnackbarContext } from '../context'
import SnackbarProvider from '../SnackbarProvider'

/*
  Isolation: the bar itself is `AlertBanner`, which has its own test. Stubbing
  it to print its props is what makes this file about the provider's job —
  holding one message, defaulting its severity, and handing down a channel.
*/
vi.mock('@/components/AlertBanner', () => ({
  default: ({ message, severity }: { message: string | null; severity: string }) => (
    <div data-severity={severity}>banner: {message ?? 'none'}</div>
  ),
}))

/** Drives the provider the way a real consumer would. */
const Consumer = () => {
  const snackbar = use(SnackbarContext)
  if (snackbar === null) throw new Error('no provider')

  return (
    <>
      <button type="button" onClick={() => { snackbar.setMessage({ message: 'first' }) }}>
        raise
      </button>
      <button
        type="button"
        onClick={() => { snackbar.setMessage({ message: 'second', severity: 'success' }) }}
      >
        raise success
      </button>
      <button type="button" onClick={snackbar.clearMessage}>
        clear
      </button>
    </>
  )
}

const setup = () =>
  renderWithTheme(
    <SnackbarProvider>
      <Consumer />
    </SnackbarProvider>,
  )

const banner = () => screen.getByText(/^banner:/)

describe('SnackbarProvider', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
  })

  it('renders children, and shows nothing until a message is raised', () => {
    setup()

    expect(screen.getByRole('button', { name: 'raise' })).toBeInTheDocument()
    expect(banner()).toHaveTextContent('banner: none')
  })

  it('shows a raised message', async () => {
    setup()

    await user.click(screen.getByRole('button', { name: 'raise' }))

    expect(banner()).toHaveTextContent('banner: first')
  })

  it('defaults severity to error, since that is all anything currently raises', async () => {
    setup()

    await user.click(screen.getByRole('button', { name: 'raise' }))

    expect(banner()).toHaveAttribute('data-severity', 'error')
  })

  it('uses a severity when one is given', async () => {
    setup()

    await user.click(screen.getByRole('button', { name: 'raise success' }))

    expect(banner()).toHaveAttribute('data-severity', 'success')
  })

  /*
    One bar, not a queue: a second failure while the first is up describes the
    same broken attempt, and stacking them would bury the page.
  */
  it('replaces the current message rather than stacking', async () => {
    setup()

    await user.click(screen.getByRole('button', { name: 'raise' }))
    await user.click(screen.getByRole('button', { name: 'raise success' }))

    expect(screen.getAllByText(/^banner:/)).toHaveLength(1)
    expect(banner()).toHaveTextContent('banner: second')
  })

  it('clears the message', async () => {
    setup()
    await user.click(screen.getByRole('button', { name: 'raise' }))

    await user.click(screen.getByRole('button', { name: 'clear' }))

    expect(banner()).toHaveTextContent('banner: none')
  })
})

/*
  Raising a message must not re-render the page underneath. Two things make
  that true and both are deliberate: the context carries only the callbacks, so
  its value never changes, and `children` is passed straight through, so its
  element identity survives the provider's own re-render.
*/
describe('the channel it provides', () => {
  it('does not re-render consumers when a message comes and goes', async () => {
    const seen: unknown[] = []
    const Recorder = () => {
      const snackbar = use(SnackbarContext)
      seen.push(snackbar)
      return (
        <button type="button" onClick={() => { snackbar?.setMessage({ message: 'x' }) }}>
          raise
        </button>
      )
    }

    renderWithTheme(
      <SnackbarProvider>
        <Recorder />
      </SnackbarProvider>,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'raise' }))
    await user.click(screen.getByRole('button', { name: 'raise' }))

    // The bar did open — this is not passing because nothing happened.
    expect(banner()).toHaveTextContent('banner: x')
    expect(seen).toHaveLength(1)
  })
})

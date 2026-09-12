import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { reportError } from '@/utils'
import AppErrorBoundary from '../AppErrorBoundary'

// Isolation: where a failure is sent is `reportError`'s decision, not this
// component's. Mocked, so this asserts only that it is told.
vi.mock('@/utils', () => ({ reportError: vi.fn() }))

const Boom = ({ message = 'kaboom' }: { message?: string }) => {
  throw new Error(message)
}

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // React logs every caught error; keep the test output readable.
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('renders its children when nothing throws', () => {
    render(
      <AppErrorBoundary>
        <p>console</p>
      </AppErrorBoundary>,
    )

    expect(screen.getByText('console')).toBeInTheDocument()
  })

  it('renders a fallback when a child throws', () => {
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    )

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
  })

  it('announces the failure as an alert', () => {
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('surfaces the error message rather than swallowing it', () => {
    render(
      <AppErrorBoundary>
        <Boom message="theme failed to build" />
      </AppErrorBoundary>,
    )

    expect(screen.getByText('theme failed to build')).toBeInTheDocument()
  })

  /*
    Never `console`: that reaches no dashboard in production. The boundary both
    renders a fallback and reports, because a user seeing a message and an
    operator seeing the failure are different needs.
  */
  it('reports the error, so it is never silent', () => {
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    )

    expect(reportError).toHaveBeenCalledOnce()
  })

  it('reports the component stack, which a stack trace does not carry', () => {
    render(
      <AppErrorBoundary>
        <Boom message="kaboom" />
      </AppErrorBoundary>,
    )

    const [error, context] = vi.mocked(reportError).mock.calls[0] ?? []
    expect((error as Error).message).toBe('kaboom')
    expect(String(context)).toContain('Unhandled error in the React tree')
    expect(String(context)).toContain('Boom')
  })

  it('offers a reload, which is the only recovery available this high up', async () => {
    const reload = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload },
      writable: true,
    })
    const user = userEvent.setup()

    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    )
    await user.click(screen.getByRole('button', { name: 'Reload' }))

    expect(reload).toHaveBeenCalledOnce()
  })

  it('renders without a theme provider above it', () => {
    // The point of sitting outside AppThemeProvider: no MUI context here.
    expect(() =>
      render(
        <AppErrorBoundary>
          <Boom />
        </AppErrorBoundary>,
      ),
    ).not.toThrow()
  })
})

import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithTheme, screen, userEvent } from '@/test/renderWithTheme'
import RouteError from '../RouteError'

/** Mount RouteError as a real errorElement, which is the only way it gets an error. */
const renderWithError = (thrown: unknown) => {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        errorElement: <RouteError />,
        loader: () => {
          throw thrown
        },
        element: <p>never rendered</p>,
      },
    ],
    { initialEntries: ['/'] },
  )
  return renderWithTheme(<RouterProvider router={router} />)
}

describe('RouteError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // React Router logs every caught error; keep the output readable.
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('shows the message of a thrown Error', async () => {
    renderWithError(new Error('loader exploded'))

    expect(await screen.findByText('loader exploded')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
  })

  it('shows status and text for a thrown Response', async () => {
    renderWithError(new Response('not found', { status: 404, statusText: 'Not Found' }))

    expect(await screen.findByRole('heading', { name: '404 Not Found' })).toBeInTheDocument()
  })

  it('renders without detail when the thrown value carries none', async () => {
    renderWithError('just a string')

    expect(await screen.findByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
  })

  it('offers a reload', async () => {
    const user = userEvent.setup()
    renderWithError(new Error('boom'))

    await user.click(await screen.findByRole('button', { name: 'Reload' }))

    // navigate(0) re-runs the route rather than changing location.
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
  })
})

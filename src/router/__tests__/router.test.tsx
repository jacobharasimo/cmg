import { describe, expect, it, vi } from 'vitest'
import { paths } from '../paths'
import { routes } from '../router'

vi.mock('@/components/AppLayout', () => ({ default: () => <div>layout</div> }))

describe('routes', () => {
  const [root] = routes

  it('wraps everything in the app shell', () => {
    expect(root?.element).toBeDefined()
  })

  it('guards the shell itself, not only the pages inside it', () => {
    // Without this, an error in AppLayout escapes to React Router's fallback.
    expect(root?.errorElement).toBeDefined()
  })

  it('guards the pages with a boundary nested inside the shell', () => {
    const boundary = root?.children?.[0]

    expect(boundary?.errorElement).toBeDefined()
    expect(boundary?.path).toBeUndefined()
  })

  it('serves the dashboard at the root path', () => {
    const pages = routes[0]?.children?.[0]?.children ?? []

    expect(pages.some((route) => route.path === paths.dashboard)).toBe(true)
  })

  it('loads the dashboard lazily, so its chunk is not in the entry bundle', () => {
    const dashboard = routes[0]?.children?.[0]?.children?.find((r) => r.path === paths.dashboard)

    expect(dashboard?.lazy).toBeTypeOf('function')
  })

  it('sends an unknown URL back to the dashboard rather than to a dead end', () => {
    const pages = routes[0]?.children?.[0]?.children ?? []

    expect(pages.at(-1)?.path).toBe('*')
  })
})

import { describe, expect, it, vi } from 'vitest'
import { browserRouter } from '../browserRouter'

vi.mock('@/components/AppLayout', () => ({ default: () => null }))

describe('browserRouter', () => {
  it('is built from the app route table', () => {
    expect(browserRouter.routes).toHaveLength(1)
  })

  it('starts at the dashboard', () => {
    expect(browserRouter.state.location.pathname).toBe('/')
  })
})

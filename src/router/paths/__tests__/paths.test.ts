import { describe, expect, it } from 'vitest'
import { paths } from '../paths'

describe('paths', () => {
  it('puts the dashboard at the root', () => {
    expect(paths.dashboard).toBe('/')
  })

  it('starts every path with a slash, so none is accidentally relative', () => {
    for (const path of Object.values(paths)) {
      expect(path.startsWith('/')).toBe(true)
    }
  })
})

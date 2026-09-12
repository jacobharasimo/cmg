import { describe, expect, it } from 'vitest'
import { createAppTheme } from '@/theme'
import { baseline } from '../baseline'
import { buttons } from '../buttons'
import { dataDisplay } from '../dataDisplay'
import { getComponents } from '../getComponents'
import { inputs } from '../inputs'
import { surfaces } from '../surfaces'

const theme = createAppTheme()
const GROUPS = [baseline, buttons, surfaces, inputs, dataDisplay]

describe('getComponents', () => {
  it('merges every group into one override map', () => {
    const merged = getComponents(theme)

    for (const group of GROUPS) {
      for (const key of Object.keys(group(theme))) {
        expect(merged).toHaveProperty(key)
      }
    }
  })

  it('has no key claimed by two groups, which would silently drop one', () => {
    const keys = GROUPS.flatMap((group) => Object.keys(group(theme)))

    expect(new Set(keys).size).toBe(keys.length)
  })
})

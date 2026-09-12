import type { Components, Theme } from '@mui/material/styles'
import { baseline } from './baseline'
import { buttons } from './buttons'
import { dataDisplay } from './dataDisplay'
import { feedback } from './feedback'
import { inputs } from './inputs'
import { surfaces } from './surfaces'

const GROUPS = [baseline, buttons, surfaces, inputs, dataDisplay, feedback] as const

/**
 * Global component defaults and overrides.
 *
 * Each group is a function of the assembled base theme, so it can read resolved
 * palette and spacing values. Anything that should look the same everywhere
 * belongs here rather than in a repeated `sx` prop.
 */
export function getComponents(theme: Theme): Components<Theme> {
  return GROUPS.reduce<Components<Theme>>((merged, group) => ({ ...merged, ...group(theme) }), {})
}

import type { Theme } from '@mui/material'
import type { SystemStyleObject } from '@mui/system'
import type { ReactNode } from 'react'

export interface FillCardProps {
  readonly children: ReactNode
  /** Stretch to fill its grid track and let inner content scroll. */
  readonly isFilled?: boolean | undefined
  /**
   * Layout-only overrides. Typed as a plain style object rather
   * than `SxProps` so it can be merged without an unsafe spread.
   */
  readonly sx?: SystemStyleObject<Theme> | undefined
}

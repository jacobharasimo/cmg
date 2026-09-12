import type { AlertColor } from '@mui/material'

export interface AlertBannerProps {
  /** The message to show. `null` keeps the banner closed. */
  readonly message: string | null
  readonly severity: AlertColor
  readonly onDismiss: () => void
}

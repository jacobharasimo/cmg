import type { AlertColor } from '@mui/material'
import type { ReactNode } from 'react'

/** What to show in the app's snackbar. */
export interface SnackbarMessage {
  readonly message: string
  /** Defaults to `error` — the only severity anything currently raises. */
  readonly severity?: AlertColor | undefined
}

/** What `useSnackbar` hands back. */
export interface SnackbarContextValue {
  readonly setMessage: (next: SnackbarMessage) => void
  readonly clearMessage: () => void
}

export interface SnackbarProviderProps {
  readonly children: ReactNode
}

import { Alert, Snackbar } from '@mui/material'
import type { SnackbarCloseReason } from '@mui/material'
import { useCallback } from 'react'
import type { AlertBannerProps } from './types'

/**
 * A full-width message bar pinned to the top of the viewport.
 *
 * Presentational: it renders whatever it is handed and reports dismissal.
 * `SnackbarProvider` owns the state and is the only thing that mounts it.
 *
 * Renders through MUI's Snackbar, which means a Portal — so the bar appears at
 * the top of the *page* regardless of where the provider sits in the tree.
 *
 * It never auto-hides. A message that clears itself can be missed entirely, and
 * a rejected upload leaves the previous log on screen looking current — so this
 * bar is the only thing saying otherwise, and it waits to be dismissed. Escape
 * dismisses it as well as the close button, because the Portal puts that button
 * last in the tab order and reaching it otherwise means tabbing the whole page.
 *
 * A click elsewhere does *not* dismiss it. Snackbar's default clickaway suits a
 * transient confirmation, but here it would let an unrelated click silently
 * discard the only report that a file was rejected.
 *
 * `Alert` carries `role="alert"`, announcing the message without moving focus.
 * That is a deliberate exception to this app's "no new live regions" rule: it
 * is the one state change with no other visual anchor.
 *
 * Unmounting when there is no message — rather than holding the last one for
 * the exit transition — is what keeps the text from blanking out mid-fade.
 */
const AlertBanner = ({ message, severity, onDismiss }: AlertBannerProps) => {
  const handleClose = useCallback(
    (_event: unknown, reason: SnackbarCloseReason) => {
      if (reason !== 'clickaway') onDismiss()
    },
    [onDismiss],
  )

  if (message === null) return null

  return (
    <Snackbar open onClose={handleClose}>
      <Alert severity={severity} onClose={onDismiss}>
        {message}
      </Alert>
    </Snackbar>
  )
}

export default AlertBanner

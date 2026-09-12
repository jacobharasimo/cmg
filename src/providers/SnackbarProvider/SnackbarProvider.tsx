import { useCallback, useMemo, useState } from 'react'
import AlertBanner from '@/components/AlertBanner'
import { SnackbarContext } from './context'
import type { SnackbarMessage, SnackbarProviderProps } from './types'

/** Severity when a caller does not name one. */
const DEFAULT_SEVERITY = 'error'

/**
 * Owns the one snackbar the app shows, and the channel for raising it.
 *
 * Mounted once at the root so any component can report something without
 * threading a callback down to it, and so two reports cannot produce two
 * overlapping bars — the newest message replaces the current one.
 *
 * The context value is only `setMessage` and `clearMessage`, never the message
 * itself. Callers raise messages; they do not read them. Keeping the state out
 * of the context is what stops every consumer re-rendering each time a bar
 * opens or closes.
 */
const SnackbarProvider = ({ children }: SnackbarProviderProps) => {
  const [current, setCurrent] = useState<SnackbarMessage | null>(null)

  const clearMessage = useCallback(() => {
    setCurrent(null)
  }, [])

  const setMessage = useCallback((next: SnackbarMessage) => {
    setCurrent(next)
  }, [])

  // Stable, because neither callback changes — so a consumer of `useSnackbar`
  // never re-renders on account of the snackbar itself.
  const value = useMemo(() => ({ setMessage, clearMessage }), [setMessage, clearMessage])

  return (
    <SnackbarContext value={value}>
      {children}
      <AlertBanner
        message={current?.message ?? null}
        severity={current?.severity ?? DEFAULT_SEVERITY}
        onDismiss={clearMessage}
      />
    </SnackbarContext>
  )
}

export default SnackbarProvider

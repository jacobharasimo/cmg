import { createContext } from 'react'
import type { SnackbarContextValue } from './types'

/**
 * The app's snackbar channel.
 *
 * `null` rather than a no-op default, so `useSnackbar` can tell "no provider
 * above me" apart from "a provider that does nothing" and throw instead of
 * silently swallowing every message.
 */
export const SnackbarContext = createContext<SnackbarContextValue | null>(null)

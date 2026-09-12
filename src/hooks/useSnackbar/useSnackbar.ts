import { use } from 'react'
import { SnackbarContext } from '@/providers/SnackbarProvider'
import type { SnackbarContextValue } from '@/providers/SnackbarProvider'

/**
 * Raise or clear the app's snackbar from anywhere below `SnackbarProvider`.
 *
 * ```ts
 * const { setMessage } = useSnackbar()
 * loadFile(file).catch((cause: unknown) => {
 *   setMessage({ message: cause instanceof Error ? cause.message : 'Upload failed.' })
 * })
 * ```
 *
 * `severity` is optional and defaults to `error`. The returned callbacks are
 * stable for the life of the provider, so they are safe in a dependency array
 * and using this hook never re-renders the caller when a bar opens or closes.
 *
 * Throws when there is no provider above it. A snackbar that silently discards
 * messages is worse than one that fails loudly at mount: the whole point is to
 * be the thing that tells someone what happened.
 */
export const useSnackbar = (): SnackbarContextValue => {
  const context = use(SnackbarContext)
  if (context === null) throw new Error('useSnackbar must be used within a SnackbarProvider')
  return context
}

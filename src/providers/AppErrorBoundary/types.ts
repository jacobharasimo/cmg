/** Props and state for the root error boundary. */
import type { ReactNode } from 'react'

export interface AppErrorBoundaryProps {
  readonly children: ReactNode
}

export interface AppErrorBoundaryState {
  readonly error: Error | null
}

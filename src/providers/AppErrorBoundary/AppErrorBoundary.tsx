import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { grey } from '@/theme'
import { reportError } from '@/utils'
import type { AppErrorBoundaryProps, AppErrorBoundaryState } from './types'

/**
 * The last line of defence.
 *
 * React Router's `errorElement` covers the routed tree, but nothing above it —
 * a failure while building the theme, or in the router itself, would otherwise
 * leave a blank page. This sits outside `AppThemeProvider` so it catches that
 * too, which is also why its own styling is inline: it cannot depend on the
 * theme it is there to survive.
 *
 * A class, because React has no hook equivalent for `componentDidCatch`. It is
 * the only class component in the app.
 *
 * It does **not** catch errors in event handlers, in async callbacks, or
 * thrown by itself — React boundaries never do.
 */
class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  override state: AppErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // `reportError` dispatches this to the platform, which is where an
    // error-tracking SDK listens. The component stack is the part React knows
    // and a stack trace does not, so it goes in the message.
    reportError(error, `Unhandled error in the React tree:${info.componentStack ?? ''}`)
  }

  override render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: 16,
          padding: 32,
          backgroundColor: grey[900],
          color: grey[50],
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24 }}>Something went wrong</h1>
        <p style={{ margin: 0, color: grey[300] }}>
          The console could not start. Reloading may clear it; if not, the log below is the place
          to start.
        </p>
        <pre
          style={{
            margin: 0,
            maxWidth: '100%',
            overflow: 'auto',
            padding: 16,
            backgroundColor: grey[800],
            border: `1px solid ${grey[500]}`,
            borderRadius: 6,
            color: grey[100],
            fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
            fontSize: 12,
          }}
        >
          {error.message}
        </pre>
        <button
          type="button"
          onClick={() => {
            window.location.reload()
          }}
          style={{
            minHeight: 32,
            padding: '0 16px',
            backgroundColor: 'transparent',
            color: grey[50],
            border: `1px solid ${grey[500]}`,
            borderRadius: 6,
            font: 'inherit',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </div>
    )
  }
}

export default AppErrorBoundary

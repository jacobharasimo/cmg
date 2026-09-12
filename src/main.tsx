/**
 * Application entry point, and the whole composition root: error boundary →
 * theme → snackbar → router. Anything mounted for the life of the app belongs
 * here.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AppErrorBoundary, AppThemeProvider, SnackbarProvider } from './providers'
import { browserRouter } from './router'

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root is missing from index.html')

createRoot(container).render(
  <StrictMode>
    {/* Outside the theme provider, so a failure building the theme is caught too. */}
    <AppErrorBoundary>
      <AppThemeProvider>
        {/* Inside the theme, since the bar it renders is themed. */}
        <SnackbarProvider>
          <RouterProvider router={browserRouter} />
        </SnackbarProvider>
      </AppThemeProvider>
    </AppErrorBoundary>
  </StrictMode>,
)

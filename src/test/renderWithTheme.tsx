import { render } from '@testing-library/react'
import type { RenderOptions, RenderResult } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { AppThemeProvider } from '@/providers'

/**
 * Render a component inside the app's theme.
 *
 * The theme is the only real wrapper a component test gets — it is
 * configuration, not logic. Hooks and child components are mocked per test, so
 * each file is exercised on its own.
 */
export const renderWithTheme = (ui: ReactElement, options?: RenderOptions): RenderResult => {
  function Wrapper({ children }: { children: ReactNode }) {
    return <AppThemeProvider>{children}</AppThemeProvider>
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

import { CssBaseline, ThemeProvider } from '@mui/material'
import { useMemo } from 'react'
import { createAppTheme } from '@/theme'
import type { AppThemeProviderProps } from './types'

/** Applies the app's single theme. No colour mode: the design has one. */
const AppThemeProvider = ({ children }: AppThemeProviderProps) => {
  const theme = useMemo(() => createAppTheme(), [])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  )
}

export default AppThemeProvider

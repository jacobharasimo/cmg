import { useTheme } from '@mui/material'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Verdict } from '@/lib'
import AppThemeProvider from '../AppThemeProvider'

const ThemeProbe = () => {
  const theme = useTheme()
  return (
    <dl>
      <dt>mode</dt>
      <dd>{theme.palette.mode}</dd>
      <dt>verdict</dt>
      <dd>{theme.palette.verdict[Verdict.Keep]}</dd>
      <dt>outline</dt>
      <dd>{theme.palette.outline}</dd>
    </dl>
  )
}

describe('AppThemeProvider', () => {
  it('renders its children', () => {
    render(
      <AppThemeProvider>
        <p>console</p>
      </AppThemeProvider>,
    )

    expect(screen.getByText('console')).toBeInTheDocument()
  })

  it('supplies the app theme to everything below it', () => {
    render(
      <AppThemeProvider>
        <ThemeProbe />
      </AppThemeProvider>,
    )

    expect(screen.getByText('dark')).toBeInTheDocument()
  })

  it('includes the custom palette entries components rely on', () => {
    render(
      <AppThemeProvider>
        <ThemeProbe />
      </AppThemeProvider>,
    )

    expect(screen.getByText('#4ade80')).toBeInTheDocument()
    expect(screen.getByText('#6b7785')).toBeInTheDocument()
  })

  it('applies CssBaseline, which is what paints the page background', () => {
    render(
      <AppThemeProvider>
        <p>console</p>
      </AppThemeProvider>,
    )

    expect(document.head.querySelector('style')).toBeInTheDocument()
  })
})

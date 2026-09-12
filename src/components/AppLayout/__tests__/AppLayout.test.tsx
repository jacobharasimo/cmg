import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { renderWithTheme, screen } from '@/test/renderWithTheme'
import AppLayout from '../AppLayout'

const renderLayout = () =>
  renderWithTheme(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<p>routed page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

describe('AppLayout', () => {
  it('renders the routed page through its outlet', () => {
    renderLayout()

    expect(screen.getByText('routed page')).toBeInTheDocument()
  })

  it('is the main landmark', () => {
    renderLayout()

    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('caps the content width rather than letting it stretch', () => {
    const { container } = renderLayout()

    expect(container.querySelector('.MuiContainer-maxWidthXl')).toBeInTheDocument()
  })
})

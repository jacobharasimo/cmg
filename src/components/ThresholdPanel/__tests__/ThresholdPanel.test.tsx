import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_THRESHOLDS } from '@/lib'
import { renderWithTheme, screen, userEvent } from '@/test/renderWithTheme'
import ThresholdPanel from '../ThresholdPanel'

const handlers = { onChange: vi.fn(), onReset: vi.fn() }

const setup = (overrides: Partial<Parameters<typeof ThresholdPanel>[0]> = {}) =>
  renderWithTheme(
    <ThresholdPanel
      thresholds={DEFAULT_THRESHOLDS}
      isModified={false}
      {...handlers}
      {...overrides}
    />,
  )

describe('ThresholdPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders one slider per adjustable rule', () => {
    setup()

    expect(screen.getAllByRole('slider')).toHaveLength(5)
  })

  it('labels every slider, so none is an anonymous control', () => {
    setup()

    for (const slider of screen.getAllByRole('slider')) {
      expect(slider).toHaveAccessibleName()
    }
  })

  it('shows each threshold at its current value', () => {
    setup()

    expect(screen.getByRole('slider', { name: 'Humidity tolerance' })).toHaveAttribute(
      'aria-valuenow',
      String(DEFAULT_THRESHOLDS.humidity),
    )
  })

  it('reads out values with their unit, not as bare numbers', () => {
    setup()

    expect(screen.getByRole('slider', { name: 'Humidity tolerance' })).toHaveAttribute(
      'aria-valuetext',
      '1.0%',
    )
  })

  it('is operable by keyboard, which WCAG 2.5.7 requires of a drag control', async () => {
    const user = userEvent.setup()
    setup()

    screen.getByRole('slider', { name: 'CO tolerance' }).focus()
    await user.keyboard('{ArrowRight}')

    expect(handlers.onChange).toHaveBeenCalledWith('monoxide', DEFAULT_THRESHOLDS.monoxide + 1)
  })

  it('reports which threshold moved, not just the new value', async () => {
    const user = userEvent.setup()
    setup()

    screen.getByRole('slider', { name: 'Thermometer mean tolerance' }).focus()
    await user.keyboard('{ArrowLeft}')

    expect(handlers.onChange).toHaveBeenCalledWith('thermometerMean', expect.any(Number))
  })

  it('never disables reset, which would drop it out of the tab order', () => {
    setup()

    expect(screen.getByRole('button', { name: 'Reset to spec defaults' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Reset to spec defaults' })).not.toHaveAttribute(
      'aria-disabled',
    )
  })

  it('states whether anything differs from the spec, rather than blocking on it', () => {
    setup()
    expect(screen.getByText('Matching spec defaults')).toBeInTheDocument()
  })

  it('says so when a threshold has been moved', () => {
    setup({ isModified: true })

    expect(screen.getByText('Modified from spec defaults')).toBeInTheDocument()
  })

  it('announces that status politely, since it changes as sliders move', () => {
    setup()

    expect(screen.getByText('Matching spec defaults')).toHaveAttribute('aria-live', 'polite')
  })

  it('resets on request', async () => {
    const user = userEvent.setup()
    setup({ isModified: true })

    await user.click(screen.getByRole('button', { name: 'Reset to spec defaults' }))

    expect(handlers.onReset).toHaveBeenCalledOnce()
  })

  it('is still usable when nothing has changed, because resetting is idempotent', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('button', { name: 'Reset to spec defaults' }))

    expect(handlers.onReset).toHaveBeenCalledOnce()
  })

  it('explains that thresholds are configuration rather than code paths', () => {
    setup()

    expect(
      screen.getByRole('heading', { name: 'Thresholds are data, not branches' }),
    ).toBeInTheDocument()
  })

  it('marks each slider with the spec default, so the baseline stays visible', () => {
    const { container } = setup()
    const marks = container.querySelectorAll('.MuiSlider-mark')

    // min, spec default, max — per slider.
    expect(marks.length).toBe(15)
  })
})

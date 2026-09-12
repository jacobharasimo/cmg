import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FilterScope } from '@/hooks'
import { SensorType } from '@/lib'
import { renderWithTheme, screen, userEvent } from '@/test/renderWithTheme'
import DeviceFilters from '../DeviceFilters'

const options = [
  { value: FilterScope.All, label: 'All' },
  { value: SensorType.Humidity, label: 'Humidity' },
  { value: FilterScope.Unregistered, label: 'Unknown' },
]

const onChange = vi.fn()

function setup(value: (typeof options)[number]['value'] = FilterScope.All) {
  return renderWithTheme(<DeviceFilters options={options} value={value} onChange={onChange} />)
}

describe('DeviceFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('is a radio group, so the browser supplies the one-of-N semantics', () => {
    setup()

    expect(screen.getByRole('radiogroup', { name: 'Filter by sensor type' })).toBeInTheDocument()
  })

  it('renders a native radio input per option', () => {
    setup()

    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(3)
    expect(radios[0]).toHaveProperty('tagName', 'INPUT')
  })

  it('needs no ARIA state of its own — checked is native', () => {
    const { container } = setup(SensorType.Humidity)

    expect(container.querySelector('[aria-pressed]')).toBeNull()
    expect(container.querySelector('[aria-checked]')).toBeNull()
    expect(screen.getByRole('radio', { name: 'Humidity' })).toBeChecked()
  })

  it('checks All when no filter is applied', () => {
    setup()

    expect(screen.getByRole('radio', { name: 'All' })).toBeChecked()
  })

  it('groups the radios under one name, which is what makes them exclusive', () => {
    setup()

    const names = screen.getAllByRole('radio').map((radio) => radio.getAttribute('name'))
    expect(new Set(names).size).toBe(1)
  })

  it('reports the selected sensor type', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('radio', { name: 'Humidity' }))

    expect(onChange).toHaveBeenCalledExactlyOnceWith(SensorType.Humidity)
  })

  it('reports the unregistered filter', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('radio', { name: 'Unknown' }))

    expect(onChange).toHaveBeenCalledExactlyOnceWith(FilterScope.Unregistered)
  })

  it('reports the All scope', async () => {
    const user = userEvent.setup()
    setup(SensorType.Humidity)

    await user.click(screen.getByRole('radio', { name: 'All' }))

    expect(onChange).toHaveBeenCalledExactlyOnceWith(FilterScope.All)
  })

  it('moves between filters with arrow keys, as a radio group should', async () => {
    const user = userEvent.setup()
    setup()

    screen.getByRole('radio', { name: 'All' }).focus()
    await user.keyboard('{ArrowRight}')

    expect(onChange).toHaveBeenCalledExactlyOnceWith(SensorType.Humidity)
  })

  it('is a single tab stop — tabbing again leaves the group entirely', async () => {
    const user = userEvent.setup()
    const { container } = setup()

    await user.tab()
    expect(screen.getByRole('radio', { name: 'All' })).toHaveFocus()

    await user.tab()
    const group = container.querySelector('[role="radiogroup"]')
    expect(group?.contains(document.activeElement)).toBe(false)
  })

  it('names each radio by its visible pill text', () => {
    setup()

    expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual([
      FilterScope.All,
      SensorType.Humidity,
      FilterScope.Unregistered,
    ])
    expect(screen.getByRole('radio', { name: 'Unknown' })).toBeInTheDocument()
  })
})

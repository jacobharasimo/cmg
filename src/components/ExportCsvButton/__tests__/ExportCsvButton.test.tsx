import { beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadCsv } from '@/utils'
import { renderWithTheme, screen, userEvent } from '@/test/renderWithTheme'
import ExportCsvButton from '../ExportCsvButton'

// Isolation: csv assembly and the download itself have their own tests.
vi.mock('@/utils', () => ({ downloadCsv: vi.fn() }))
const mockedDownload = vi.mocked(downloadCsv)

const rows = [['device', 'verdict'], ['temp-1', 'precise']] as const

describe('ExportCsvButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads "Export CSV" but carries a distinct accessible name', () => {
    renderWithTheme(
      <ExportCsvButton filename="a.csv" rows={() => rows} label="Export device table as CSV" />,
    )

    const button = screen.getByRole('button', { name: 'Export device table as CSV' })
    expect(button).toHaveTextContent('Export CSV')
  })

  it('downloads the rows under the given filename', async () => {
    const user = userEvent.setup()
    renderWithTheme(<ExportCsvButton filename="devices.csv" rows={() => rows} label="Export" />)

    await user.click(screen.getByRole('button', { name: 'Export' }))

    expect(mockedDownload).toHaveBeenCalledExactlyOnceWith('devices.csv', rows)
  })

  it('builds the rows at click time, so the export reflects current state', async () => {
    const user = userEvent.setup()
    const build = vi.fn(() => rows)
    renderWithTheme(<ExportCsvButton filename="a.csv" rows={build} label="Export" />)

    expect(build).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Export' }))
    expect(build).toHaveBeenCalledOnce()
  })
})

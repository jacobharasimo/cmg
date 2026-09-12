import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Verdict } from '@/lib'
import { renderWithTheme, screen, userEvent, waitFor } from '@/test/renderWithTheme'
import JsonOutput from '../JsonOutput'

vi.mock('@/components/ExportCsvButton', () => ({
  default: ({ label }: { label: string }) => <button type="button">{label}</button>,
}))

const verdicts = { 'temp-1': Verdict.Precise, 'hum-2': Verdict.Discard }
const onExportCsv = vi.fn(() => [['device', 'verdict']] as const)

function setup() {
  return renderWithTheme(<JsonOutput verdicts={verdicts} onExportCsv={onExportCsv} />)
}

describe('JsonOutput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * userEvent.setup() installs its own clipboard stub, so the spy has to be
   * attached after it rather than before.
   */
  function setupWithClipboard() {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    return { user, writeText }
  }

  it('names the function whose output it shows', () => {
    setup()

    expect(screen.getByRole('heading', { name: 'evaluateLogFile() output' })).toBeInTheDocument()
  })

  it('pretty-prints the verdict map', () => {
    setup()

    expect(screen.getByRole('region', { name: /JSON output/ })).toHaveTextContent(
      '"temp-1": "precise"',
    )
  })

  it('makes the output a focusable scroll region', () => {
    setup()

    expect(screen.getByRole('region', { name: /JSON output/ })).toHaveAttribute('tabindex', '0')
  })

  it('copies the JSON to the clipboard', async () => {
    const { user, writeText } = setupWithClipboard()
    setup()

    await user.click(screen.getByRole('button', { name: 'Copy JSON' }))

    expect(writeText).toHaveBeenCalledExactlyOnceWith(JSON.stringify(verdicts, null, 2))
  })

  it('confirms the copy, then returns to its resting label', async () => {
    // Real timers: userEvent's clipboard stub deadlocks under fake ones.
    const { user } = setupWithClipboard()
    setup()

    await user.click(screen.getByRole('button', { name: 'Copy JSON' }))
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: 'Copy JSON' })).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it('gives its CSV export a distinct accessible name', () => {
    setup()

    expect(screen.getByRole('button', { name: 'Export evaluation results as CSV' })).toBeInTheDocument()
  })

  it('renders an empty object when there are no devices', () => {
    renderWithTheme(<JsonOutput verdicts={{}} onExportCsv={onExportCsv} />)

    expect(screen.getByRole('region', { name: /JSON output/ })).toHaveTextContent('{}')
  })
})

import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parseLog } from '@/lib'
import { EXAMPLE_LOG } from '@/lib/fixtures'
import { useSensorLog } from '../useSensorLog'

/*
  Isolation: this hook owns *where* a log comes from and whether it was
  accepted — not the grammar. `parseLog` is the boundary, so it is mocked and
  its verdict is what the tests drive.

  `isLogFormatError` is mocked to the real shape rather than a stub, because the
  hook's branch depends on it telling a format failure apart from a bug.
*/
vi.mock('@/lib', () => ({
  parseLog: vi.fn(),
  isLogFormatError: (value: unknown) => value instanceof Error && value.name === 'LogFormatError',
}))
vi.mock('@/lib/fixtures', () => ({ EXAMPLE_LOG: 'example\nlog' }))

const parseLogMock = vi.mocked(parseLog)

/** What the mocked parser returns for text it accepts. */
const accepts = (lines: number) => {
  parseLogMock.mockReturnValue({ reference: {}, devices: [], lines })
}

const rejects = () => {
  parseLogMock.mockImplementation(() => {
    const error = new Error('Not a sensor log')
    error.name = 'LogFormatError'
    throw error
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  accepts(2)
})

describe('useSensorLog', () => {
  it("opens on the spec's example log, so the graded verdicts are on screen", () => {
    const { result } = renderHook(() => useSensorLog())

    expect(result.current.text).toBe(EXAMPLE_LOG)
    expect(result.current.source?.label).toBe('spec example log')
  })

  it('measures the loaded log for the stats line', () => {
    accepts(7)
    const { result } = renderHook(() => useSensorLog())

    expect(result.current.source).toMatchObject({ lines: 7, bytes: EXAMPLE_LOG.length })
    expect(result.current.source?.parseMs).toBeGreaterThanOrEqual(0)
  })

  it('takes the line count from the parser rather than counting again', () => {
    accepts(41)
    const { result } = renderHook(() => useSensorLog())

    expect(result.current.source?.lines).toBe(41)
  })

  it('labels a loaded file by its name', async () => {
    const { result } = renderHook(() => useSensorLog())

    await act(async () => {
      await result.current.loadFile(new File(['some log'], 'batch-42.log'))
    })

    expect(result.current.source?.label).toBe('batch-42.log')
    expect(result.current.text).toBe('some log')
  })

  it('returns to the example log after a file has been loaded', async () => {
    const { result } = renderHook(() => useSensorLog())

    await act(async () => {
      await result.current.loadFile(new File(['x'], 'other.log'))
    })
    act(() => {
      result.current.loadExample()
    })

    expect(result.current.source?.label).toBe('spec example log')
    expect(result.current.text).toBe(EXAMPLE_LOG)
  })

  /*
    Failures are thrown, not stored. The hook's job is to say a load failed and
    why, in words a person can read; deciding where that lands is the caller's.
  */
  describe('when the file is not a sensor log', () => {
    it('rejects with a message naming the file', async () => {
      const { result } = renderHook(() => useSensorLog())
      rejects()

      await expect(
        act(async () => {
          await result.current.loadFile(new File(['junk'], 'holiday-photos.txt'))
        }),
      ).rejects.toThrow(/Log file parsing failed.*holiday-photos\.txt/)
    })

    it("keeps the library's error as the cause, so the detail is not lost", async () => {
      const { result } = renderHook(() => useSensorLog())
      rejects()

      const thrown = await act(async () =>
        result.current.loadFile(new File(['junk'], 'junk.txt')).catch((error: unknown) => error),
      )

      expect((thrown as Error).cause).toMatchObject({ name: 'LogFormatError' })
    })

    /*
      The invariant: a rejected file must not blank the console. Showing an
      empty batch would be indistinguishable from a log that has no devices.
    */
    it('keeps the previous log on screen', async () => {
      const { result } = renderHook(() => useSensorLog())
      rejects()

      await act(async () => {
        await result.current.loadFile(new File(['junk'], 'junk.txt')).catch(() => undefined)
      })

      expect(result.current.text).toBe(EXAMPLE_LOG)
      expect(result.current.source?.label).toBe('spec example log')
    })
  })

  describe('when the file cannot be read', () => {
    /** A `File` whose `text()` rejects — a moved file, or revoked permission. */
    const unreadable = (name: string): File => {
      const file = new File(['x'], name)
      vi.spyOn(file, 'text').mockRejectedValue(new DOMException('NotReadableError'))
      return file
    }

    it('rejects with an upload message, not a parsing one', async () => {
      const { result } = renderHook(() => useSensorLog())

      await expect(
        act(async () => {
          await result.current.loadFile(unreadable('gone.log'))
        }),
      ).rejects.toThrow(/Log file upload failed.*gone\.log/)
    })

    it('never reaches the parser', async () => {
      const { result } = renderHook(() => useSensorLog())
      parseLogMock.mockClear()

      await act(async () => {
        await result.current.loadFile(unreadable('gone.log')).catch(() => undefined)
      })

      expect(parseLogMock).not.toHaveBeenCalled()
    })
  })

  it('rethrows a failure that is not a format error, rather than mislabelling it', () => {
    const { result } = renderHook(() => useSensorLog())
    parseLogMock.mockImplementation(() => {
      throw new TypeError('a genuine bug in the parser')
    })

    expect(() => {
      act(() => {
        result.current.loadText('anything', 'manual')
      })
    }).toThrow(TypeError)
  })
})

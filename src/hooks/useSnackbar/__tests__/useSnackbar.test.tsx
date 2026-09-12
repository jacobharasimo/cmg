import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SnackbarContext } from '@/providers/SnackbarProvider'
import { useSnackbar } from '../useSnackbar'

const channel = { setMessage: vi.fn(), clearMessage: vi.fn() }

const withProvider = ({ children }: { children: ReactNode }) => (
  <SnackbarContext value={channel}>{children}</SnackbarContext>
)

describe('useSnackbar', () => {
  it('hands back the channel the provider published', () => {
    const { result } = renderHook(() => useSnackbar(), { wrapper: withProvider })

    expect(result.current).toBe(channel)
  })

  /*
    Loudly, not silently. Returning no-ops would make a component that reports
    failures look like it works while discarding every message — the one
    outcome a snackbar must never have.
  */
  it('throws when there is no provider above it', () => {
    expect(() => renderHook(() => useSnackbar())).toThrow(/within a SnackbarProvider/)
  })
})

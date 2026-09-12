import { render, screen } from '@testing-library/react'
import { use } from 'react'
import { describe, expect, it } from 'vitest'
import { SnackbarContext } from '../context'

const Probe = () => <span>{use(SnackbarContext) === null ? 'no provider' : 'provided'}</span>

describe('SnackbarContext', () => {
  /*
    `null`, not a no-op channel. It is the whole mechanism behind `useSnackbar`
    throwing: a default that quietly accepted messages would make a component
    that reports failures look like it works while discarding every one.
  */
  it('defaults to null, so a missing provider is detectable', () => {
    render(<Probe />)

    expect(screen.getByText('no provider')).toBeInTheDocument()
  })

  it('carries the value a provider publishes', () => {
    render(
      <SnackbarContext value={{ setMessage: () => undefined, clearMessage: () => undefined }}>
        <Probe />
      </SnackbarContext>,
    )

    expect(screen.getByText('provided')).toBeInTheDocument()
  })
})

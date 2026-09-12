import { describe, expect, it } from 'vitest'
import { Verdict } from '@/lib'
import { renderWithTheme, screen } from '@/test/renderWithTheme'
import { verdict as verdictColors } from '@/theme'
import VerdictChip from '../VerdictChip'

describe('VerdictChip', () => {
  it.each(Object.values(Verdict))('labels the %s verdict in text, never colour alone', (verdict) => {
    renderWithTheme(<VerdictChip verdict={verdict} />)

    expect(screen.getByText(verdict)).toBeInTheDocument()
  })

  it('outlines in the verdict colour by default', () => {
    renderWithTheme(<VerdictChip verdict={Verdict.Discard} />)

    expect(screen.getByText(Verdict.Discard).closest('.MuiChip-root')).toHaveStyle({
      border: `1px solid ${verdictColors.discard}`,
    })
  })

  it('fills with the verdict colour when used as a headline', () => {
    renderWithTheme(<VerdictChip verdict={Verdict.Keep} isFilled />)

    expect(screen.getByText(Verdict.Keep).closest('.MuiChip-root')).toHaveStyle({
      backgroundColor: verdictColors.keep,
    })
  })
})

import { FormControl, FormLabel, Radio, RadioGroup, styled } from '@mui/material'
import { visuallyHidden } from '@mui/utils'
import { FilterScope } from '@/hooks'
import type { DeviceFiltersProps } from './types'

/**
 * A segmented control styled as a label around a native radio.
 *
 * The input stays in the DOM and focusable — `visuallyHidden` clips it rather
 * than removing it — so the browser supplies selection, arrow-key navigation
 * and roving tab order. The focus ring moves to the pill via `:focus-within`.
 */
const LABEL_ID = 'sensor-type-filter-label'

const FilterPill = styled('label')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  // WCAG 2.5.8 — the smallest interactive target on the page.
  minHeight: 24,
  paddingInline: theme.spacing(1),
  ...theme.typography.caption,
  color: theme.palette.text.secondary,
  border: `1px solid ${theme.palette.outline}`,
  // A pill, matching the Chips these replace — a square one reads as a button.
  borderRadius: 999,
  cursor: 'pointer',
  userSelect: 'none',
  '&:hover': { backgroundColor: theme.palette.action.hover },
  '&:has(input:checked)': {
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
  },
  '&:focus-within': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
}))

/**
 * Sensor-type filter.
 *
 * A one-of-N choice, so it is a radio group rather than the design's toggle
 * chips: the native element already carries the semantics, which means no ARIA
 * attributes of our own and a screen reader that announces "3 of 6".
 */
const DeviceFilters = ({ options, value, onChange }: DeviceFiltersProps) => {
  return (
    <FormControl variant="standard">
      {/*
        The design shows no visible label here, so the name is clipped rather
        than absent. `aria-labelledby` points the radiogroup at a real label
        element — MUI's documented pattern, and the only ARIA in this component.
      */}
      <FormLabel id={LABEL_ID} sx={visuallyHidden}>
        Filter by sensor type
      </FormLabel>
      <RadioGroup
        row
        aria-labelledby={LABEL_ID}
        name="sensor-type-filter"
        value={value}
        onChange={(_event, next) => {
          // The DOM hands values back as strings, so the match is made on the
          // string form and the typed enum member is what travels onward.
          const selected = options.find((option) => String(option.value) === next)
          onChange(selected?.value ?? FilterScope.All)
        }}
        sx={{ gap: 1, flexWrap: 'wrap' }}
      >
        {options.map((option) => (
          <FilterPill key={option.value}>
            <Radio value={option.value} sx={visuallyHidden} />
            {option.label}
          </FilterPill>
        ))}
      </RadioGroup>
    </FormControl>
  )
}

export default DeviceFilters

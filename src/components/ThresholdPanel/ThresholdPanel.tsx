import { Box, Button, Slider, Typography } from '@mui/material'
import FillCard from '@/components/FillCard'
import { DEFAULT_THRESHOLDS } from '@/lib'
import type { ThresholdPanelProps, ThresholdSlider } from './types'

/** Every rule the library applies, as a range a reader can move. */
const SLIDERS: readonly ThresholdSlider[] = [
  { key: 'thermometerMean', label: 'Thermometer mean tolerance', min: 0.1, max: 2, step: 0.1, unit: '°' },
  { key: 'thermometerSdUltra', label: 'σ ceiling — ultra precise', min: 0.5, max: 6, step: 0.5, unit: '' },
  { key: 'thermometerSdVery', label: 'σ ceiling — very precise', min: 1, max: 10, step: 0.5, unit: '' },
  { key: 'humidity', label: 'Humidity tolerance', min: 0.2, max: 4, step: 0.2, unit: '%' },
  { key: 'monoxide', label: 'CO tolerance', min: 1, max: 10, step: 1, unit: ' ppm' },
]

const format = (value: number, slider: ThresholdSlider): string =>
  `${slider.step < 1 ? value.toFixed(1): String(value)}${slider.unit}`

/**
 * The adjustable classification rules, one slider per threshold.
 *
 * Each slider hands a different config to the same strategies and the whole
 * batch re-evaluates — the library's central claim, made visible rather than
 * asserted. Nothing here knows what a rule does; it edits numbers.
 *
 * Every slider marks its spec default, so the baseline stays on screen however
 * far a reader moves it.
 *
 * Reset is never disabled. A disabled button leaves the tab order, so a
 * keyboard or screen-reader user cannot reach it to discover it exists or learn
 * what would enable it. Resetting is idempotent, so the state is *stated*
 * beside the button instead of being used to block it.
 */
const ThresholdPanel = ({
  thresholds,
  isModified,
  onChange,
  onReset,
}: ThresholdPanelProps) => {
  return (
    <FillCard isFilled>
      <Typography variant="h2" component="h2">
        Thresholds are data, not branches
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        Every rule is a config value on a registered sensor strategy — move one and the whole batch
        re-evaluates.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {SLIDERS.map((slider) => {
          const labelId = `threshold-${slider.key}`
          return (
            <Box key={slider.key} sx={{ px: 2 }}>
              <Typography id={labelId} component="span" variant="body2" color="text.secondary">
                {slider.label}
              </Typography>
              <Slider
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={thresholds[slider.key]}
                valueLabelDisplay="on"
                valueLabelFormat={(value: number) => format(value, slider)}
                getAriaValueText={(value: number) => format(value, slider)}
                aria-labelledby={labelId}
                marks={[
                  { value: slider.min, label: format(slider.min, slider) },
                  { value: DEFAULT_THRESHOLDS[slider.key] },
                  { value: slider.max, label: format(slider.max, slider) },
                ]}
                onChange={(_event, value) => {
                  onChange(slider.key, value)
                }}
              />
            </Box>
          )
        })}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
        <Button onClick={onReset}>Reset to spec defaults</Button>
        <Typography aria-live="polite" variant="body2" color="text.secondary">
          {isModified ? 'Modified from spec defaults' : 'Matching spec defaults'}
        </Typography>
      </Box>
    </FillCard>
  )
}

export default ThresholdPanel

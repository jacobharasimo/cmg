import {
  Box,
  Divider,
  FormControlLabel,
  MenuItem,
  Switch,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { useCallback, useMemo } from 'react'
import Chart from '@/components/Chart'
import { VerdictChip } from '@/components/DeviceTable'
import ExportCsvButton from '@/components/ExportCsvButton'
import FillCard from '@/components/FillCard'
import type { CsvCell } from '@/utils'
import { bins, distributionOptions } from './distributionOptions'
import { readingsOptions } from './readingsOptions'
import type { DeviceDetailPanelProps } from './types'

/**
 * One device in full: its readings over time, how they are distributed, and the
 * trace of checks that produced its verdict.
 *
 * The rule trace is the point of the panel — every verdict on screen can be
 * followed back to the checks behind it, which is what makes the library's
 * rules auditable rather than merely applied.
 *
 * A device with no registered strategy gets an explanation instead of a trace:
 * its readings are parsed and summarised, but deliberately left unjudged rather
 * than measured against another sensor type's rules.
 */
const DeviceDetailPanel = ({
  device,
  devices,
  is12HourClock,
  onSelect,
  onClockChange,
}: DeviceDetailPanelProps) => {
  const theme = useTheme()

  const readingsChart = useMemo(
    () => (device === null ? null : readingsOptions(device, theme, is12HourClock)),
    [is12HourClock, device, theme],
  )
  const distributionChart = useMemo(
    () => (device === null ? null : distributionOptions(device, theme)),
    [device, theme],
  )

  const readingsCsv = useCallback(
    (): readonly (readonly CsvCell[])[] =>
      device === null
        ? []
        : [
            ['timestamp', 'value', 'reference', 'deviation', 'within_tolerance'],
            ...device.readings.map((reading): CsvCell[] => [
              reading.at,
              reading.value,
              device.reference ?? 'n/a',
              device.reference === null ? 'n/a' : (reading.value - device.reference).toFixed(3),
              device.reference === null || !device.strategy.isPerReading
                ? 'n/a'
                : String(Math.abs(reading.value - device.reference) <= device.tolerance),
            ]),
          ],
    [device],
  )

  const distributionCsv = useCallback(
    (): readonly (readonly CsvCell[])[] =>
      device === null
        ? []
        : [
            ['bin_midpoint', 'count', 'unit'],
            ...bins(device).map((bin): CsvCell[] => [
              bin.midpoint,
              bin.count,
              device.strategy.unit.trim() || 'units',
            ]),
          ],
    [device],
  )

  if (device === null || readingsChart === null || distributionChart === null) {
    return (
      <FillCard isFilled>
        <Typography variant="body2" color="text.secondary">
          No device selected.
        </Typography>
      </FillCard>
    )
  }

  const { strategy, stats, checks, isRegistered } = device

  return (
    <FillCard isFilled>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            select
            label="Device"
            value={device.name}
            onChange={(event) => {
              onSelect(event.target.value)
            }}
          >
            {devices.map((option) => (
              <MenuItem key={option.name} value={option.name}>
                {`${option.name} · ${option.strategy.label}`}
              </MenuItem>
            ))}
          </TextField>
          <Box aria-live="polite" sx={{ display: 'inline-flex', alignItems: 'center' }}>
            <VerdictChip verdict={device.verdict} isFilled />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={is12HourClock}
                onChange={(event) => {
                  onClockChange(event.target.checked)
                }}
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
                12-hour clock
              </Typography>
            }
          />
          <ExportCsvButton
            filename={`${device.name}-readings.csv`}
            rows={readingsCsv}
            label={`Export ${device.name} readings as CSV`}
          />
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {isRegistered
          ? `${strategy.label} — judged on ${strategy.judgedOn}.`
          : `No strategy is registered for sensor type "${device.type}" — its readings are parsed and reported, but deliberately left unclassified rather than judged by another type's rules.`}
      </Typography>

      <Chart options={readingsChart} height={280} />

      <Divider sx={{ mt: 2 }} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mt: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
            <Typography variant="overline" component="h3" color="text.secondary">
              Distribution of readings
            </Typography>
            <ExportCsvButton
              filename={`${device.name}-distribution.csv`}
              rows={distributionCsv}
              label={`Export ${device.name} distribution as CSV`}
            />
          </Box>
          <Chart options={distributionChart} height={268} />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" component="h3" color="text.secondary">
            {isRegistered ? 'Rule trace' : 'Unsupported sensor type'}
          </Typography>

          <Box component="ul" sx={{ listStyle: 'none', m: 0, mt: 1, p: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {checks.map((check) => (
              <Box component="li" key={check.text} sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
                <Typography
                  aria-hidden
                  variant="mono"
                  color={check.didPass ? 'verdict.keep' : 'verdict.discard'}
                >
                  {check.didPass ? '✓' : '✗'}
                </Typography>
                <Typography variant="mono" color="text.secondary">
                  {/* The mark is decorative; the pass/fail state is in the text. */}
                  {check.text}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: 1, m: 0, mt: 2 }}>
            {[
              ['mean', `${stats.mean.toFixed(2)}${strategy.unit}`],
              ['σ', stats.sd.toFixed(2)],
              ['range', `${stats.min.toFixed(strategy.decimals)} – ${stats.max.toFixed(strategy.decimals)}`],
              ['worst |Δ ref|', stats.worstDeviation === null ? 'n/a — no reference' : `${stats.worstDeviation.toFixed(2)}${strategy.unit}`],
              ['readings', String(stats.count)],
              ['out of tolerance', device.outOfTolerance === null ? `n/a — ${strategy.judgedOn}` : `${String(device.outOfTolerance)} / ${String(stats.count)}`],
            ].map(([term, value]) => (
              <Box key={term} sx={{ display: 'contents' }}>
                <Typography component="dt" variant="mono" color="text.secondary">
                  {term}
                </Typography>
                <Typography component="dd" variant="mono" sx={{ m: 0, textAlign: 'right' }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </FillCard>
  )
}

export default DeviceDetailPanel

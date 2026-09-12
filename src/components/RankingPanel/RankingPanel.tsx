import { Box, MenuItem, TextField, Typography, useTheme } from '@mui/material'
import { useCallback, useMemo } from 'react'
import ExportCsvButton from '@/components/ExportCsvButton'
import FillCard from '@/components/FillCard'
import { isSensorType } from '@/lib'
import type { CsvCell } from '@/utils'
import { describe } from './describe'
import { UnclassifiedRanking } from './rankingCharts'
import { RANKING_CHARTS } from './rankingRegistry'
import type { RankingPanelProps } from './types'

/**
 * Ranks one sensor type against the rule that governs it.
 *
 * Which chart is drawn comes from the registry rather than a branch here, so a
 * new sensor type brings its own chart with it.
 */
const RankingPanel = ({
  devices,
  thresholds,
  sensorType,
  sensorTypeOptions,
  selectedName,
  onSensorTypeChange,
  onSelect,
}: RankingPanelProps) => {
  const theme = useTheme()
  const shown = useMemo(
    () => devices.filter((device) => device.type === sensorType),
    [devices, sensorType],
  )

  const strategy = shown[0]?.strategy
  const RankingChart = isSensorType(sensorType) ? RANKING_CHARTS[sensorType] : UnclassifiedRanking

  const { title, blurb, legend } = useMemo(
    () => describe(sensorType, strategy?.label, strategy?.type ?? null, thresholds, theme.palette.verdict),
    [sensorType, strategy?.label, strategy?.type, theme.palette.verdict, thresholds],
  )

  const csvRows = useCallback(
    (): readonly (readonly CsvCell[])[] => [
        ['device', 'mean', 'deviation_from_reference', 'worst_deviation', 'sigma', 'out_of_tolerance', 'readings', 'verdict'],
        ...shown.map((device): CsvCell[] => [
          device.name,
          device.stats.mean.toFixed(3),
          device.stats.meanDeviation?.toFixed(3) ?? 'n/a',
          device.stats.worstDeviation?.toFixed(3) ?? 'n/a',
          device.stats.sd.toFixed(3),
          device.outOfTolerance ?? 'n/a',
          device.stats.count,
      ]),
    ],
    [shown],
  )

  return (
    <FillCard>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <TextField
          select
          label="Sensor type"
          value={sensorType}
          onChange={(event) => {
            onSensorTypeChange(event.target.value)
          }}
        >
          {sensorTypeOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <ExportCsvButton
          filename={`${sensorType}-ranking.csv`}
          rows={csvRows}
          label={`Export ${strategy?.label ?? sensorType} ranking as CSV`}
        />
      </Box>

      <Typography variant="h2" component="h2" sx={{ mt: 2 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {blurb}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
        {legend.map((entry) => (
          <Box key={entry.label} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
            <Box
              aria-hidden
              sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: entry.color }}
            />
            <Typography variant="caption" color="text.secondary">
              {entry.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {shown.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This log contains no devices of the selected sensor type.
        </Typography>
      ) : (
        <RankingChart
          devices={shown}
          thresholds={thresholds}
          selectedName={selectedName}
          onSelect={onSelect}
        />
      )}
    </FillCard>
  )
}

export default RankingPanel

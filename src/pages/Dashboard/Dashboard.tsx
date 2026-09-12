import { Box, Stack, Typography } from '@mui/material'
import { useCallback, useMemo, useState } from 'react'
import DeviceDetailPanel from '@/components/DeviceDetailPanel'
import { filterOptions } from '@/components/DeviceFilters'
import DeviceTable from '@/components/DeviceTable'
import JsonOutput from '@/components/JsonOutput'
import LogSourceBar from '@/components/LogSourceBar'
import RankingPanel from '@/components/RankingPanel'
import ThresholdPanel from '@/components/ThresholdPanel'
import VerdictSummary from '@/components/VerdictSummary'
import {
  useDeviceReport,
  useDeviceSelection,
  useSensorLog,
  useSnackbar,
  useThresholds,
} from '@/hooks'
import { isSensorType, ReferenceKey } from '@/lib'
import type { CsvCell } from '@/utils'

/** Fallback for a rejection that is somehow not an `Error`. */
const FALLBACK_MESSAGE = 'Log file upload failed.'

/** The reference values, and how each is written. */
const REFERENCE_DISPLAY = [
  { key: ReferenceKey.Temperature, label: 'Reference temp', format: (v: number) => `${v.toFixed(1)}°` },
  { key: ReferenceKey.Humidity, label: 'Humidity', format: (v: number) => `${v.toFixed(1)}%` },
  { key: ReferenceKey.Monoxide, label: 'CO', format: (v: number) => `${v.toFixed(0)} ppm` },
  { key: ReferenceKey.Noise, label: 'Noise (ext.)', format: (v: number) => `${v.toFixed(1)} dB` },
] as const

/**
 * The dashboard.
 *
 * Owns the hooks and passes plain data down; every component below is
 * presentational, which is what keeps them reusable and testable in isolation.
 */
const Dashboard = () => {
  const { text, source, loadExample, loadFile } = useSensorLog()
  const { setMessage, clearMessage } = useSnackbar()
  const { thresholds, isModified, set, reset } = useThresholds()
  const { reference, devices, counts } = useDeviceReport(text, thresholds)
  const selection = useDeviceSelection(devices)
  const [is12HourClock, setIs12HourClock] = useState(false)
  const [rankType, setRankType] = useState<string | null>(null)

  const options = useMemo(() => filterOptions(devices), [devices])

  /** Sensor types present in this log, with how many devices each has. */
  const sensorTypeOptions = useMemo(() => {
    const counted = new Map<string, { label: string; count: number }>()
    for (const device of devices) {
      const existing = counted.get(device.type)
      const label = isSensorType(device.type) ? device.strategy.label : `${device.type} (unrecognised)`
      counted.set(device.type, { label, count: (existing?.count ?? 0) + 1 })
    }
    return [...counted].map(([value, { label, count }]) => ({
      value,
      label: `${label} (${String(count)})`,
    }))
  }, [devices])

  /**
   * The stored type is a preference, not a fact: a newly loaded log may not
   * contain it, so fall back to whatever the selected device is.
   */
  const sensorType =
    rankType !== null && devices.some((device) => device.type === rankType)
      ? rankType
      : (selection.selected?.type ?? sensorTypeOptions[0]?.value ?? '')

  const verdicts = useMemo(
    () => Object.fromEntries(devices.map((device) => [device.name, device.verdict])),
    [devices],
  )

  /**
   * Uploads report failure by throwing, so the page is what turns a rejection
   * into something on screen. Keeping the copy in the hook and the display
   * here is what lets the snackbar stay generic.
   *
   * A load that works clears the bar: whatever it was reporting was about a
   * log that is no longer the one on screen, and a stale failure next to a
   * healthy batch is worse than no message at all.
   *
   * Two callbacks rather than `.then().catch()`, so a throw from
   * `clearMessage` could never be reported as an upload failure.
   */
  const handleLoadFile = useCallback(
    (file: File) => {
      loadFile(file).then(clearMessage, (cause: unknown) => {
        setMessage({ message: cause instanceof Error ? cause.message : FALLBACK_MESSAGE })
      })
    },
    [loadFile, setMessage, clearMessage],
  )

  /** Same reasoning: switching back to a log that works clears the bar. */
  const handleLoadExample = useCallback(() => {
    loadExample()
    clearMessage()
  }, [loadExample, clearMessage])

  const csvRows = useCallback(
    (): readonly (readonly CsvCell[])[] => [
      ['device', 'verdict'],
      ...devices.map((device): CsvCell[] => [device.name, device.verdict]),
    ],
    [devices],
  )

  return (
    <Stack spacing={3}>
      <Box
        component="header"
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="h1">Sensor QC Console</Typography>
          <Typography variant="body2" color="text.secondary">
            Demo harness over{' '}
            <Typography variant="mono" component="code" color="primary.main">
              evaluateLogFile()
            </Typography>{' '}
            — the library is the deliverable; this UI exists to make its rules auditable.
          </Typography>
        </Box>

        <Box component="dl" sx={{ m: 0, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {REFERENCE_DISPLAY.map(({ key, label, format }) => (
            <Box
              key={key}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                px: 2,
                py: 1,
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: (theme) => `${String(theme.shape.borderRadius)}px`,
              }}
            >
              <Typography component="dt" variant="overline" color="text.secondary">
                {label}
              </Typography>
              <Typography component="dd" variant="monoLarge" sx={{ m: 0 }}>
                {format(reference[key])}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <LogSourceBar
        source={source}
        deviceCount={devices.length}
        onLoadExample={handleLoadExample}
        onLoadFile={handleLoadFile}
      />

      <VerdictSummary counts={counts} total={devices.length} />

      <Box
        sx={{
          display: 'grid',
          /*
            `minmax(0, …)` rather than a bare `2fr`: a grid track's automatic
            minimum is its content, so the device table's eight columns would
            otherwise widen the track, break the 2:1 ratio and push the page
            into horizontal scroll. Setting the minimum explicitly lets the
            table scroll inside its own card instead.
          */
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(0, 1fr)' },
          gridTemplateRows: { lg: 'minmax(0, 520px)' },
          gap: 3,
        }}
      >
        <DeviceTable
          devices={selection.devices}
          selectedName={selection.selected?.name ?? null}
          sortKey={selection.sortKey}
          sortDirection={selection.sortDirection}
          filter={selection.filter}
          filterOptions={options}
          onSelect={selection.select}
          onSort={selection.sortBy}
          onFilter={selection.filterBy}
        />
        <JsonOutput verdicts={verdicts} onExportCsv={csvRows} />
      </Box>

      <RankingPanel
        devices={devices}
        thresholds={thresholds}
        sensorType={sensorType}
        sensorTypeOptions={sensorTypeOptions}
        selectedName={selection.selected?.name ?? null}
        onSensorTypeChange={setRankType}
        onSelect={selection.select}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' },
          gap: 3,
        }}
      >
        <ThresholdPanel
          thresholds={thresholds}
          isModified={isModified}
          onChange={set}
          onReset={reset}
        />
        <DeviceDetailPanel
          device={selection.selected}
          devices={devices}
          is12HourClock={is12HourClock}
          onSelect={selection.select}
          onClockChange={setIs12HourClock}
        />
      </Box>
    </Stack>
  )
}

export default Dashboard

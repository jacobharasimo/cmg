import { useTheme } from '@mui/material'
import { useMemo } from 'react'
import Chart from '@/components/Chart'
import { tint } from '@/components/Chart/chartTheme'
import { Verdict } from '@/lib'
import { barRanking, rankingHeight } from './rankingOptions'
import type { RankingChartProps } from './types'

/**
 * Thermometers: bar length is σ, with the two σ ceilings drawn as zones.
 * The bar label is the device's mean deviation, because failing the mean check
 * caps a device at `precise` however tight its σ is — the chart would otherwise
 * look like it contradicted the verdict.
 */
export const SigmaBandsRanking = ({
  devices,
  thresholds,
  selectedName,
  onSelect,
}: RankingChartProps) => {
  const theme = useTheme()
  const { thermometerMean, thermometerSdUltra, thermometerSdVery } = thresholds
  const verdict = theme.palette.verdict

  const options = useMemo(
    () =>
      barRanking({
        devices,
        theme,
        selectedName,
        onSelect,
        valueOf: (device) => device.stats.sd,
        axisLabel: 'σ — standard deviation of readings',
        labelOf: (device) => {
          const deviation = device.stats.meanDeviation ?? 0
          const failed = deviation > thermometerMean ? '✗ ' : ''
          return `${failed}Δ${deviation.toFixed(2)}° · ${device.verdict}`
        },
        labelColorOf: (device) =>
          (device.stats.meanDeviation ?? 0) > thermometerMean
            ? verdict[Verdict.Discard]
            : theme.palette.text.secondary,
        describe: (device) =>
          `${device.name}: standard deviation ${device.stats.sd.toFixed(2)}, mean deviation ` +
          `${(device.stats.meanDeviation ?? 0).toFixed(2)} degrees against a limit of ` +
          `${thermometerMean.toFixed(1)}, classified ${device.verdict}.`,
        accessibilityDescription:
          'Thermometers ranked by standard deviation, lowest first. Shaded zones mark the σ ' +
          'ceilings for the ultra precise and very precise classifications. Each bar is labelled ' +
          "with that device's mean deviation from the reference temperature.",
        bands: {
          plotBands: [
            { from: 0, to: thermometerSdUltra, color: tint(verdict[Verdict.UltraPrecise], 0.16) },
            { from: thermometerSdUltra, to: thermometerSdVery, color: tint(verdict[Verdict.VeryPrecise], 0.15) },
            { from: thermometerSdVery, to: 9999, color: tint(verdict[Verdict.Precise], 0.1) },
          ],
          plotLines: [
            { value: thermometerSdUltra, color: verdict[Verdict.UltraPrecise] },
            { value: thermometerSdVery, color: verdict[Verdict.VeryPrecise], dashStyle: 'Dash' },
          ],
        },
      }),
    [devices, onSelect, selectedName, theme, thermometerMean, thermometerSdUltra, thermometerSdVery, verdict],
  )

  return <Chart options={options} height={rankingHeight(devices.length)} />
}

/**
 * Per-reading sensors: bar length is the worst single reading's distance from
 * reference, with the tolerance drawn as a line. Anything past it is discarded,
 * so the label is how many readings missed.
 */
export const ToleranceRanking = ({
  devices,
  thresholds,
  selectedName,
  onSelect,
}: RankingChartProps) => {
  const theme = useTheme()
  const verdict = theme.palette.verdict
  const strategy = devices[0]?.strategy
  const limit = strategy?.tolerance(thresholds) ?? 0
  const unit = strategy?.unit.trim() ?? ''

  const options = useMemo(
    () =>
      barRanking({
        devices,
        theme,
        selectedName,
        onSelect,
        valueOf: (device) => device.stats.worstDeviation ?? 0,
        axisLabel: `worst |reading − reference| (${unit || 'units'})`,
        labelOf: (device) => `${String(device.outOfTolerance ?? 0)}/${String(device.stats.count)} out`,
        labelColorOf: (device) =>
          (device.outOfTolerance ?? 0) > 0 ? verdict[Verdict.Discard] : theme.palette.text.secondary,
        describe: (device) =>
          `${device.name}: worst deviation ${(device.stats.worstDeviation ?? 0).toFixed(2)} ${unit} ` +
          `against a limit of ${limit.toFixed(2)}, ${String(device.outOfTolerance ?? 0)} of ` +
          `${String(device.stats.count)} readings out of tolerance, classified ${device.verdict}.`,
        accessibilityDescription:
          `${strategy?.label ?? 'Devices'} ranked by worst deviation. Anything at or below the ` +
          `limit of ${limit.toFixed(2)} ${unit} is kept; beyond it the device is discarded, ` +
          'because one reading outside tolerance is enough.',
        bands: {
          plotBands: [
            { from: 0, to: limit, color: tint(verdict[Verdict.Keep], 0.15) },
            { from: limit, to: 99999, color: tint(verdict[Verdict.Discard], 0.12) },
          ],
          plotLines: [{ value: limit, color: verdict[Verdict.Keep] }],
        },
      }),
    [devices, limit, onSelect, selectedName, strategy?.label, theme, unit, verdict],
  )

  return <Chart options={options} height={rankingHeight(devices.length)} />
}

/**
 * A type with no registered rule. Readings are summarised so they can still be
 * compared, but no threshold is drawn — there is none to draw.
 */
export const UnclassifiedRanking = ({ devices, selectedName, onSelect }: RankingChartProps) => {
  const theme = useTheme()

  const options = useMemo(
    () =>
      barRanking({
        devices,
        theme,
        selectedName,
        onSelect,
        valueOf: (device) => device.stats.sd,
        axisLabel: 'σ — standard deviation of readings',
        labelOf: () => 'unclassified',
        labelColorOf: () => theme.palette.text.secondary,
        describe: (device) =>
          `${device.name}: standard deviation ${device.stats.sd.toFixed(2)}. No classification ` +
          'rule is registered for this sensor type, so it is reported rather than judged.',
        accessibilityDescription:
          'Devices of an unrecognised sensor type, showing the spread of their readings. No ' +
          'classification rule is registered, so no thresholds are drawn.',
      }),
    [devices, onSelect, selectedName, theme],
  )

  return <Chart options={options} height={rankingHeight(devices.length)} />
}

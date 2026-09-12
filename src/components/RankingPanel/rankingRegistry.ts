import type { ComponentType } from 'react'
import { SensorType } from '@/lib'
import { SigmaBandsRanking, ToleranceRanking } from './rankingCharts'
import type { RankingChartProps } from './types'

/**
 * Sensor type → its ranking chart.
 *
 * Typed as a total record, so adding a member to `SensorType` fails to compile
 * until it has a chart here as well as a strategy. Three of the four share one
 * component today; giving a sensor a bespoke chart is a one-line change.
 */
export const RANKING_CHARTS: Readonly<Record<SensorType, ComponentType<RankingChartProps>>> =
  Object.freeze({
    [SensorType.Thermometer]: SigmaBandsRanking,
    [SensorType.Humidity]: ToleranceRanking,
    [SensorType.Monoxide]: ToleranceRanking,
    [SensorType.Noise]: ToleranceRanking,
  })

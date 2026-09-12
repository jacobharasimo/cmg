import type { LogSource } from '@/hooks'
import { formatCount, formatKilobytes, formatMilliseconds } from '@/utils'

/** The one-line summary of what is currently loaded. */
export function statsLine(source: LogSource | null, deviceCount: number): string {
  if (source === null) return 'no log loaded'

  return [
    source.label,
    `${formatCount(source.lines)} lines`,
    formatKilobytes(source.bytes),
    `parsed in ${formatMilliseconds(source.parseMs)}`,
    `${formatCount(deviceCount)} devices`,
  ].join(' · ')
}

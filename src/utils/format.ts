/** Shared number and size formatting. Pure, UI-free helpers. */

const NUMBER = new Intl.NumberFormat('en-US')

export function formatCount(value: number): string {
  return NUMBER.format(value)
}

export function formatKilobytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`
}

export function formatMilliseconds(ms: number): string {
  return `${ms.toFixed(1)} ms`
}

/** Signed or unsigned fixed-point, with an em dash for a missing value. */
export function formatFixed(value: number | null, decimals: number): string {
  return value === null ? '—' : value.toFixed(decimals)
}

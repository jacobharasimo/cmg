export interface StatCardProps {
  /** Eyebrow label, rendered uppercase by the theme. */
  readonly label: string
  /** The number itself, shown in the monospace variant. */
  readonly value: string
  /** Optional supporting line, e.g. "18% of batch". */
  readonly caption?: string | undefined
  /** Colour of the left accent bar. Omit for no bar. */
  readonly accent?: string | undefined
}

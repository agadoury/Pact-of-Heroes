/**
 * <BuffChip>
 *
 * Wider rectangular chip for card-applied buffs. Wraps a label + duration
 * suffix tag.
 *
 * Bible reference: Part 4.5.
 */

import { clsx } from '@/ui/util/clsx'
import s from './BuffChip.module.css'

export type BuffChipVariant = 'defensive' | 'beneficial' | 'signature'
export type BuffDuration =
  | { kind: 'turns';     remaining: number }
  | { kind: 'upkeeps';   remaining: number }
  | { kind: 'persistent' }

export interface BuffChipProps {
  label:      string
  variant:    BuffChipVariant
  duration:   BuffDuration
  className?: string
}

export function BuffChip({
  label,
  variant,
  duration,
  className,
}: BuffChipProps): JSX.Element {
  const suffix = formatDuration(duration)
  return (
    <span className={clsx(s.chip, s[variant], className)}>
      <span className={s.label}>{label}</span>
      <span className={s.duration}>{suffix}</span>
    </span>
  )
}

function formatDuration(d: BuffDuration): string {
  switch (d.kind) {
    case 'turns':      return `${d.remaining}T`
    case 'upkeeps':    return `${d.remaining}U`
    case 'persistent': return '∞'
  }
}

export default BuffChip

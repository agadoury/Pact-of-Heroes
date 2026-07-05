/**
 * <AbilityValueBadge>
 *
 * The 24×24 (default) or 56×56 (large) badge on the left of every ability
 * row. Damage/heal/utility variants with color-coded fill.
 *
 * Bible reference: Part 3.3.
 */

import { clsx } from '@/ui/util/clsx'
import type { AbilityValue } from '@/ui/types/ability'
import s from './AbilityValueBadge.module.css'

export type AbilityValueBadgeVariant =
  | 'default'
  | 'eligible'
  | 'ultimate-eligible'
  | 'lethal'

export interface AbilityValueBadgeProps {
  value:     AbilityValue
  variant?:  AbilityValueBadgeVariant
  size?:     'default' | 'large'
  scalingPulse?: boolean
  className?: string
}

const UTILITY_GLYPH: Record<string, string> = {
  strip:   '⊘',
  draw:    '◇',
  lock:    '⌂',
  cleanse: '✦',
  buff:    '↑',
  control: '⊙',
}

export function AbilityValueBadge({
  value,
  variant = 'default',
  size = 'default',
  scalingPulse,
  className,
}: AbilityValueBadgeProps): JSX.Element {
  const kind = value.kind
  return (
    <div
      className={clsx(
        s.badge,
        s[`kind-${kind}`],
        s[`variant-${variant}`],
        s[`size-${size}`],
        scalingPulse && s.scalingPulse,
        className,
      )}
      data-kind={kind}
      data-variant={variant}
    >
      {value.kind === 'damage' ? (
        <span className={s.value}>{value.amount}</span>
      ) : value.kind === 'heal' ? (
        <span className={s.value}>+{value.amount}</span>
      ) : (
        <span className={s.glyph}>{UTILITY_GLYPH[value.glyph] ?? '?'}</span>
      )}
    </div>
  )
}

export default AbilityValueBadge

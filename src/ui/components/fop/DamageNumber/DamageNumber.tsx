/**
 * <DamageNumber>
 *
 * The scaled damage number at the center of the FOP. Overshoot scale-in
 * on damage-in phase; scale-out + drift on fade-out.
 *
 * Bible reference: Part 5.3.
 */

import { clsx } from '@/ui/util/clsx'
import type { ResolutionPhase } from '@/ui/types/fop'
import s from './DamageNumber.module.css'

export type DamageNumberVariant =
  | 'damage'
  | 'heal'
  | 'resource'
  | 'ultimate'
  | 'crimson'

export type DamageNumberSize = 'standard' | 'small' | 'ultimate'

export interface DamageNumberProps {
  value:     number
  variant?:  DamageNumberVariant
  size?:     DamageNumberSize
  phase:     ResolutionPhase
  className?: string
}

const HIDE_BEFORE: ResolutionPhase[] = ['idle', 'preconfirm', 'fade-in', 'name-in']

export function DamageNumber({
  value,
  variant = 'damage',
  size = 'standard',
  phase,
  className,
}: DamageNumberProps): JSX.Element {
  const hidden = HIDE_BEFORE.includes(phase)
  const fading = phase === 'fade-out'
  const prefix = variant === 'heal' || variant === 'resource' ? '+' : ''
  return (
    <div
      className={clsx(
        s.damage,
        s[`variant-${variant}`],
        s[`size-${size}`],
        hidden && s.hidden,
        fading && s.fading,
        !hidden && !fading && s.visible,
        className,
      )}
    >
      {prefix}{Math.abs(value)}
    </div>
  )
}

export default DamageNumber

/**
 * <UltimateTakeover>
 *
 * Full-screen cinematic when a T4 ultimate fires. Hero portrait +
 * ultimate name + bark + oversized damage number. ~3500ms sequence.
 *
 * Bible reference: Part 5.8.
 */

import { useEffect } from 'react'
import { clsx } from '@/ui/util/clsx'
import type { HeroId } from '@/game/types'
import { DURATION } from '@/ui/util/duration'
import { DamageNumber } from '../DamageNumber'
import s from './UltimateTakeover.module.css'

export interface UltimateTakeoverData {
  heroId:       HeroId
  ultimateName: string
  tierLabel:    string
  bark:         string
  damage:       number
}

export interface UltimateTakeoverProps {
  active:      boolean
  data:        UltimateTakeoverData
  onComplete?: () => void
  className?:  string
}

export function UltimateTakeover({
  active,
  data,
  onComplete,
  className,
}: UltimateTakeoverProps): JSX.Element | null {
  useEffect(() => {
    if (!active || !onComplete) return
    const t = window.setTimeout(onComplete,
      DURATION.ultimateTakeoverIn + DURATION.ultimateHold + DURATION.ultimateTakeoverOut,
    )
    return () => window.clearTimeout(t)
  }, [active, onComplete])

  if (!active) return null
  return (
    <div className={clsx(s.takeover, className)}>
      <div className={s.rays} aria-hidden="true" />
      <div className={s.portrait} aria-hidden="true">
        <span className={s.initial}>{data.heroId.charAt(0).toUpperCase()}</span>
      </div>
      <div className={s.name}>{data.ultimateName}</div>
      <div className={s.tier}>{data.tierLabel}</div>
      <div className={s.bark}>&ldquo;{data.bark}&rdquo;</div>
      <DamageNumber value={data.damage} variant="ultimate" size="ultimate" phase="damage-in" />
    </div>
  )
}

export default UltimateTakeover

/**
 * <MatchIntro>
 *
 * ~1800ms opening cinematic played once per match. Tap-to-skip.
 *
 * Bible reference: Part 7.2.
 */

import { useEffect } from 'react'
import { clsx } from '@/ui/util/clsx'
import type { HeroId } from '@/game/types'
import { DURATION } from '@/ui/util/duration'
import s from './MatchIntro.module.css'

export interface MatchIntroProps {
  active:      boolean
  playerHero:  HeroId
  opponentHero: HeroId
  onComplete?: () => void
  className?:  string
}

export function MatchIntro({
  active,
  playerHero,
  opponentHero,
  onComplete,
  className,
}: MatchIntroProps): JSX.Element | null {
  useEffect(() => {
    if (!active || !onComplete) return
    const t = window.setTimeout(onComplete, DURATION.matchIntro)
    return () => window.clearTimeout(t)
  }, [active, onComplete])

  if (!active) return null

  return (
    <div className={clsx(s.overlay, className)} onClick={onComplete}>
      <div className={s.split}>
        <div className={s.side} data-side="player">
          <div className={s.portrait}>{playerHero.charAt(0).toUpperCase()}</div>
          <div className={s.name}>{playerHero}</div>
        </div>
        <div className={s.separator} aria-hidden="true">◆</div>
        <div className={s.side} data-side="opponent">
          <div className={s.portrait}>{opponentHero.charAt(0).toUpperCase()}</div>
          <div className={s.name}>{opponentHero}</div>
        </div>
      </div>
      <div className={s.beginText}>Match begins…</div>
    </div>
  )
}

export default MatchIntro

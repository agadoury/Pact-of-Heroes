/**
 * <MatchIntro>
 *
 * ~1800ms opening cinematic played once per match. Tap-to-skip. Uses
 * hero silhouettes and an animated split-screen reveal.
 *
 * Bible reference: Part 7.2.
 */

import { useEffect } from 'react'
import { clsx } from '@/ui/util/clsx'
import type { HeroId } from '@/game/types'
import { DURATION } from '@/ui/util/duration'
import { HeroSilhouette } from '@/ui/components/shared/HeroSilhouette'
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
        <div className={clsx(s.side, s.player)} data-side="player">
          <div className={s.silhouetteHolder}>
            <HeroSilhouette heroId={playerHero} size={100} variant="portrait" />
          </div>
          <div className={s.name}>{capName(playerHero)}</div>
          <div className={s.role}>Challenger</div>
        </div>
        <div className={s.separator} aria-hidden="true">
          <div className={s.vsGlyph}>VS</div>
          <div className={s.rays} />
        </div>
        <div className={clsx(s.side, s.opponent)} data-side="opponent">
          <div className={s.silhouetteHolder}>
            <HeroSilhouette heroId={opponentHero} size={100} variant="portrait" />
          </div>
          <div className={s.name}>{capName(opponentHero)}</div>
          <div className={s.role}>Rival</div>
        </div>
      </div>
      <div className={s.beginText}>Match begins…</div>
      <div className={s.skipHint}>tap to skip</div>
    </div>
  )
}

function capName(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1)
}

export default MatchIntro

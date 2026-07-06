/**
 * <MatchIntro>
 *
 * ~1800ms opening cinematic played once per match. Tap-to-skip. Uses
 * hero silhouettes and an animated split-screen reveal.
 *
 * Bible reference: Part 7.2.
 */

import { useEffect, useRef } from 'react'
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
  // Timer keys on `active` only. Parents pass inline onComplete closures
  // (fresh identity every render) and MatchScreen re-renders constantly
  // while the AI opens the match — keying on onComplete restarted the
  // timer forever, so the full-screen intro sat on top of the AI's whole
  // first turn (including the viewer's own defense prompt) until tapped.
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  useEffect(() => {
    if (!active) return
    const t = window.setTimeout(() => onCompleteRef.current?.(), DURATION.matchIntro)
    return () => window.clearTimeout(t)
  }, [active])

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

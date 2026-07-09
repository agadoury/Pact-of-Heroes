/**
 * <KillingBlowTakeover>
 *
 * The produced ending. When the hit that ends the match lands, the screen
 * is hijacked in two acts:
 *
 *   Act 1 — THE BLOW: darkened, desaturated freeze; the killing ability's
 *   name and an oversized crimson damage number slam in with a shake.
 *   Act 2 — THE STINGER: a gold VICTORY (or ashen DEFEAT) wipe carrying
 *   the match descriptor — CLUTCH appears over the corpse, not on the
 *   next screen.
 *
 * Ends by calling onComplete (the parent navigates to the summary).
 * Concessions / status-tick deaths have no blow to show — they skip
 * straight to the stinger.
 *
 * Bible reference: Part 5.9 (Killing Blow, fun-audit Wave 3).
 */

import { useEffect, useRef, useState } from 'react'
import { clsx } from '@/ui/util/clsx'
import type { HeroId } from '@/game/types'
import { DURATION } from '@/ui/util/duration'
import { HeroSilhouette } from '@/ui/components/shared/HeroSilhouette'
import s from './KillingBlowTakeover.module.css'

export interface KillingBlowData {
  outcome:      'victory' | 'defeat' | 'draw'
  /** Named finish from the match summary — CLUTCH, FLAWLESS, … */
  descriptor:   string
  blurb:        string
  /** The final hit. 0 when the match ended without a blow (concede). */
  damage:       number
  abilityLabel: string | null
  winnerHero:   HeroId | null
}

export interface KillingBlowTakeoverProps {
  active:      boolean
  data:        KillingBlowData | null
  onComplete?: () => void
}

export function KillingBlowTakeover({ active, data, onComplete }: KillingBlowTakeoverProps): JSX.Element | null {
  const [act, setAct] = useState<'blow' | 'stinger'>('blow')
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const hasBlow = (data?.damage ?? 0) > 0

  useEffect(() => {
    if (!active) { setAct('blow'); return }
    const timers: number[] = []
    const blowMs = hasBlow ? DURATION.killingBlowIn + DURATION.killingBlowHold : 0
    if (hasBlow) {
      setAct('blow')
      timers.push(window.setTimeout(() => setAct('stinger'), blowMs))
    } else {
      setAct('stinger')
    }
    timers.push(window.setTimeout(() => onCompleteRef.current?.(), blowMs + DURATION.killingBlowStinger))
    return () => { for (const t of timers) window.clearTimeout(t) }
  }, [active, hasBlow])

  if (!active || !data) return null

  const stingerWord =
    data.outcome === 'victory' ? 'VICTORY'
    : data.outcome === 'defeat' ? 'DEFEAT'
    : 'BOTH FALL'
  const showDescriptor =
    data.outcome === 'victory' && data.descriptor !== 'VICTORY'

  return (
    <div className={clsx(s.takeover, s[`outcome-${data.outcome}`])}>
      {act === 'blow' ? (
        <div className={s.blow}>
          {data.abilityLabel ? <div className={s.abilityName}>{data.abilityLabel}</div> : null}
          <div className={s.damage}>−{data.damage}</div>
          <div className={s.finalLabel}>Killing Blow</div>
        </div>
      ) : (
        <div className={s.stinger}>
          {data.winnerHero ? (
            <div className={s.portrait} aria-hidden="true">
              <HeroSilhouette heroId={data.winnerHero} size={120} variant="portrait" />
            </div>
          ) : null}
          <div className={s.word}>{stingerWord}</div>
          {showDescriptor ? <div className={s.descriptor}>{data.descriptor}</div> : null}
          <div className={s.blurb}>{data.blurb}</div>
        </div>
      )}
    </div>
  )
}

export default KillingBlowTakeover

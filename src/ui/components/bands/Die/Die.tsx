/**
 * <Die>
 *
 * Single die renderer — face glyph (via DieFace.label) + number badge +
 * lock badge.
 *
 * Tumble choreography: each rising edge of `rollSignal` throws the die —
 * it hops and spins in 3D while cycling through random faces from its
 * own face list, then lands on the real (engine-resolved) face with an
 * overshoot bounce and an impact ring. Dice settle sequentially via
 * `rollDelay`, so the tray reads as a cascade of landings.
 *
 * Bible reference: Part 2.7.
 */

import { useEffect, useRef, useState } from 'react'
import { clsx } from '@/ui/util/clsx'
import { Icon } from '@/ui/components/atoms/Icon'
import { Sigil } from '@/ui/components/atoms/Sigil'
import { useReducedMotion } from '@/ui/hooks/useReducedMotion'
import type { DieFace, HeroId } from '@/game/types'
import { HERO_ELEMENT } from '@/ui/types/ui'
import s from './Die.module.css'

export interface DieProps {
  face:          DieFace
  /** Full face list — cycled through visually while tumbling. */
  faces?:        readonly DieFace[]
  locked:        boolean
  /** Increment to throw the die. A counter, not a boolean: AI rerolls can
   *  land inside the previous tumble window and still need a fresh throw. */
  rollSignal?:   number
  /** Stagger (ms) added to this die's air time so the tray settles left→right. */
  rollDelay?:    number
  interactable?: boolean
  heroId?:       HeroId
  onTap?:        () => void
}

type TumblePhase = 'idle' | 'tumbling' | 'settling'

/** Base air time before the first die lands. */
const TUMBLE_MS = 460
/** Overshoot-bounce landing duration (matches die-land keyframes). */
const SETTLE_MS = 280
/** Face-swap cadence while airborne. */
const CYCLE_MS = 80

export function Die({
  face,
  faces,
  locked,
  rollSignal = 0,
  rollDelay = 0,
  interactable = true,
  heroId,
  onTap,
}: DieProps): JSX.Element {
  const element = heroId ? HERO_ELEMENT[heroId] : 'frost'
  const reduced = useReducedMotion()

  const [phase, setPhase] = useState<TumblePhase>('idle')
  const [airFace, setAirFace] = useState<DieFace | null>(null)

  // Snapshot-changing props read inside the throw effect via refs so the
  // effect keys on rollSignal alone — a lock/selector re-render mid-air
  // must not cancel the timers and strand the die in `tumbling`.
  const lockedRef = useRef(locked);   lockedRef.current = locked
  const reducedRef = useRef(reduced); reducedRef.current = reduced
  const facesRef = useRef(faces);     facesRef.current = faces
  const delayRef = useRef(rollDelay); delayRef.current = rollDelay
  const firstSignal = useRef(true)

  useEffect(() => {
    if (firstSignal.current) { firstSignal.current = false; return }
    if (lockedRef.current) return

    if (reducedRef.current) {
      // Reduced motion: no spin, no face cycling — just a brief landed
      // pulse so the reroll still registers visually.
      setPhase('settling')
      const t = window.setTimeout(() => setPhase('idle'), SETTLE_MS)
      return () => window.clearTimeout(t)
    }

    setPhase('tumbling')
    const airMs = TUMBLE_MS + delayRef.current

    // Cycle through this die's real faces while airborne, never repeating
    // the face currently shown. Visual-only randomness — the engine has
    // already resolved the roll.
    let shownIdx = -1
    const spin = () => {
      const pool = facesRef.current
      if (!pool || pool.length < 2) return
      let next = Math.floor(Math.random() * pool.length)
      if (next === shownIdx) next = (next + 1) % pool.length
      shownIdx = next
      setAirFace(pool[next]!)
    }
    spin()
    const cycle = window.setInterval(spin, CYCLE_MS)

    const land = window.setTimeout(() => {
      window.clearInterval(cycle)
      setAirFace(null)
      setPhase('settling')
    }, airMs)
    const rest = window.setTimeout(() => setPhase('idle'), airMs + SETTLE_MS)

    return () => {
      window.clearInterval(cycle)
      window.clearTimeout(land)
      window.clearTimeout(rest)
      setAirFace(null)
      setPhase('idle')
    }
  }, [rollSignal])

  const inMotion  = phase !== 'idle'
  const shownFace = phase === 'tumbling' && airFace ? airFace : face

  return (
    <button
      type="button"
      className={clsx(
        s.die,
        locked && s.locked,
        phase === 'tumbling' && s.tumbling,
        phase === 'settling' && s.settling,
        !interactable && s.readonly,
        s[`element-${element}`],
      )}
      style={
        phase === 'tumbling'
          // Negative delay desyncs the spin cycles so the tray doesn't
          // tumble in lockstep; each die also spins slightly off-tempo.
          ? { animationDelay: `-${rollDelay * 1.7}ms`, animationDuration: `${420 + rollDelay * 0.6}ms` }
          : undefined
      }
      onClick={interactable && !inMotion ? onTap : undefined}
      disabled={!interactable || inMotion}
      aria-label={`Die showing ${face.label}${locked ? ' (locked)' : ''}`}
      aria-pressed={locked}
    >
      <span className={s.number}>{shownFace.faceValue}</span>
      <span className={s.glyph}><Sigil symbol={shownFace.symbol} size={22} /></span>
      {locked ? (
        <span className={s.lockBadge} aria-hidden="true">
          <Icon name="lock" size={8} />
        </span>
      ) : null}
    </button>
  )
}

export default Die

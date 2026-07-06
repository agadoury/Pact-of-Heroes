/**
 * <MatchSummary>
 *
 * Post-match screen. Shows outcome + bark + stats grid + action buttons.
 *
 * Bible reference: Part 7.7.
 */

import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { HeroId } from '@/game/types'
import { useGameStore } from '@/store/gameStore'
import { useUIStore } from '@/ui/store/uiStore'
import { clearMatchState } from '@/ui/store/matchPersistence'
import { Button } from '@/ui/components/atoms/Button'
import { AmbientBackdrop } from '@/ui/components/shared/AmbientBackdrop'
import { HeroSilhouette } from '@/ui/components/shared/HeroSilhouette'
import { clsx } from '@/ui/util/clsx'
import { HERO_ELEMENT } from '@/ui/types/ui'
import s from './MatchSummary.module.css'

const VICTORY_BARKS: Record<HeroId, string[]> = {
  berserker:   ['The wound is the door.', 'For the pack.', 'Cold ground, warm blood.'],
  pyromancer:  ['The mountain remembers.', 'Ash to ash.', 'Nothing survives fire.'],
  lightbearer: ['Dawn breaks always.', 'Judgment given.', 'The light holds.'],
}

const DEFEAT_BARKS = [
  'The dawn will return.',
  'Not this day.',
  'Steel remembers.',
]

export function MatchSummary(): JSX.Element {
  const navigate = useNavigate()
  const state    = useGameStore(g => g.state)
  const viewerId = useUIStore(u => u.viewerId)
  const reset    = useGameStore(g => g.reset)
  const startMatch = useGameStore(g => g.startMatch)

  // Snapshot the hero pair BEFORE the match state is reset by Rematch/New Hero.
  const heroPair = useRef<{ p1: HeroId; p2: HeroId } | null>(null)
  useEffect(() => {
    if (state && !heroPair.current) {
      heroPair.current = {
        p1: state.players.p1.hero,
        p2: state.players.p2.hero,
      }
    }
  }, [state])

  const outcome = useMemo(() => {
    if (!state?.winner) return 'draw' as const
    if (state.winner === 'draw') return 'draw' as const
    return state.winner === viewerId ? 'victory' as const : 'defeat' as const
  }, [state?.winner, viewerId])

  const bark = useMemo(() => {
    if (!heroPair.current) return 'Both stand.'
    const myHero = viewerId === 'p1' ? heroPair.current.p1 : heroPair.current.p2
    const opHero = viewerId === 'p1' ? heroPair.current.p2 : heroPair.current.p1
    if (outcome === 'victory') {
      const pool = VICTORY_BARKS[myHero] ?? ['Victory.']
      return pool[state?.turn ? state.turn % pool.length : 0]!
    }
    if (outcome === 'defeat') {
      void opHero
      return DEFEAT_BARKS[state?.turn ? state.turn % DEFEAT_BARKS.length : 0]!
    }
    return 'Both stand, neither yields.'
  }, [outcome, viewerId, state?.turn])

  useEffect(() => {
    if (!state || state.phase !== 'match-end') {
      navigate('/')
    }
  }, [state, navigate])

  if (!state) return <div className={s.container} />

  const myHp   = state.players[viewerId].hp
  const oppHp  = state.players[viewerId === 'p1' ? 'p2' : 'p1'].hp
  const stats = [
    { label: 'Turns',           value: String(state.turn),                                 highlight: false },
    { label: 'Your HP',         value: `${Math.max(0, myHp)}`,                             highlight: outcome === 'victory' },
    { label: 'Opponent HP',     value: `${Math.max(0, oppHp)}`,                            highlight: outcome === 'defeat' },
    { label: 'Your Hero',       value: humanizeHero(state.players[viewerId].hero),         highlight: false },
    { label: 'Opponent Hero',   value: humanizeHero(state.players[viewerId === 'p1' ? 'p2' : 'p1'].hero), highlight: false },
    { label: 'Element',         value: capitalize(HERO_ELEMENT[state.players[viewerId].hero] ?? '—'), highlight: false },
  ]

  const goHome = () => {
    clearMatchState()
    reset()
    heroPair.current = null
    navigate('/')
  }
  const rematch = () => {
    const pair = heroPair.current
    if (!pair) { goHome(); return }
    clearMatchState()
    reset()
    heroPair.current = null
    startMatch({ p1: pair.p1, p2: pair.p2, mode: 'vs-ai' })
    navigate('/play')
  }
  const newHero = () => {
    clearMatchState()
    reset()
    heroPair.current = null
    navigate('/heroes')
  }

  const myHero = state.players[viewerId].hero
  const backdropTone = outcome === 'victory' ? 'gold' : outcome === 'defeat' ? 'crimson' : 'frost'

  return (
    <div className={s.container}>
      <AmbientBackdrop
        tone={backdropTone}
        intensity={outcome === 'victory' ? 'high' : 'low'}
      />
      <div className={s.eyebrow}>— Match Resolved —</div>
      <div className={s.heroPodium}>
        <HeroSilhouette heroId={myHero} size={92} variant="portrait" />
      </div>
      <div className={clsx(s.result, s[outcome])}>
        {outcome === 'victory' ? 'VICTORY' : outcome === 'defeat' ? 'DEFEAT' : 'DRAW'}
      </div>
      <div className={s.divider} />
      <div className={s.bark}>&ldquo;{bark}&rdquo;</div>
      <div className={s.stats}>
        {stats.map(st => (
          <div key={st.label} className={s.stat}>
            <div className={s.statLabel}>{st.label}</div>
            <div className={clsx(s.statValue, st.highlight && s.highlight)}>{st.value}</div>
          </div>
        ))}
      </div>
      <div className={s.actions}>
        <Button variant="primary" onClick={rematch} iconRight="chevron-right">Rematch</Button>
        <Button variant="default" onClick={newHero}>New Hero</Button>
        <Button variant="default" onClick={goHome}>Return Home</Button>
      </div>
    </div>
  )
}

function humanizeHero(id: HeroId): string {
  return id.charAt(0).toUpperCase() + id.slice(1)
}
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default MatchSummary

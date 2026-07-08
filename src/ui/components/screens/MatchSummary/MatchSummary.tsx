/**
 * <MatchSummary>
 *
 * Post-match screen. Shows outcome + bark + stats grid + action buttons.
 *
 * Bible reference: Part 7.7.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { HeroId } from '@/game/types'
import { STARTING_HP } from '@/game/types'
import { buildMatchSummary } from '@/game/match-summary'
import { useGameStore } from '@/store/gameStore'
import { useUIStore } from '@/ui/store/uiStore'
import { clearMatchState } from '@/ui/store/matchPersistence'
import { awardMatchRenown, computeRenownAward, hasAffordableUnlock, type RenownAward } from '@/store/collectionStorage'
import { Button } from '@/ui/components/atoms/Button'
import { AmbientBackdrop } from '@/ui/components/shared/AmbientBackdrop'
import { HeroSilhouette } from '@/ui/components/shared/HeroSilhouette'
import { clsx } from '@/ui/util/clsx'
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
  const matchLog = useGameStore(g => g.matchLog)
  const viewerId = useUIStore(u => u.viewerId)
  const reset    = useGameStore(g => g.reset)
  const startMatch = useGameStore(g => g.startMatch)

  // Rich stats + the §10 descriptor (CLUTCH / FLAWLESS / COMEBACK / …)
  // computed from the full event log.
  const summary = useMemo(() => {
    if (!state?.winner) return null
    return buildMatchSummary(matchLog, {
      winner:     state.winner,
      turns:      state.turn,
      startingHp: STARTING_HP,
    })
  }, [matchLog, state?.winner, state?.turn])

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
    // Read the hero from live state first — the heroPair ref fills in a
    // useEffect (after this memo's first run) and mutating a ref never
    // re-renders, so relying on it alone froze the fallback bark.
    const myHero = state
      ? state.players[viewerId].hero
      : viewerId === 'p1' ? heroPair.current?.p1 : heroPair.current?.p2
    if (!myHero) return 'Both stand.'
    if (outcome === 'victory') {
      // The descriptor blurb ("That was close." / "Untouchable.") beats a
      // random bark when we earned a named finish.
      if (summary && summary.descriptor !== 'VICTORY') return summary.descriptorBlurb
      const pool = VICTORY_BARKS[myHero] ?? ['Victory.']
      return pool[state?.turn ? state.turn % pool.length : 0]!
    }
    if (outcome === 'defeat') {
      return DEFEAT_BARKS[state?.turn ? state.turn % DEFEAT_BARKS.length : 0]!
    }
    return 'Both stand, neither yields.'
  }, [outcome, viewerId, state, summary])

  useEffect(() => {
    if (!state || state.phase !== 'match-end') {
      navigate('/')
    }
  }, [state, navigate])

  // Renown award — once per match (idempotent by seed+winner key), to the
  // hero the viewer played. Named finishes (Flawless, Clutch, ...) and a
  // fired ultimate pay bonuses; the breakdown renders below the stats.
  const [renownAward, setRenownAward] = useState<RenownAward | null>(null)
  const [unlockReady, setUnlockReady] = useState(false)
  useEffect(() => {
    if (!state?.winner || state.winner === 'draw') return
    const myHeroId = state.players[viewerId].hero
    const key = `${state.rngSeed}:${state.turn}:${state.winner}`
    const won = state.winner === viewerId
    const award = computeRenownAward(won, {
      descriptor: won ? summary?.descriptor : undefined,
      ultimatesFired: summary?.ultimatesFired[viewerId] ?? 0,
    })
    const gained = awardMatchRenown(myHeroId, award.total, key)
    if (gained > 0) setRenownAward(award)
    setUnlockReady(hasAffordableUnlock(myHeroId))
  }, [state, viewerId, summary])

  if (!state) return <div className={s.container} />

  const myHp   = state.players[viewerId].hp
  const oppId  = viewerId === 'p1' ? 'p2' as const : 'p1' as const
  const oppHp  = state.players[oppId].hp
  const stats = summary
    ? [
        { label: 'Turns',        value: String(summary.turns),                       highlight: false },
        { label: 'Damage Dealt', value: String(summary.totalDamage[viewerId]),       highlight: summary.totalDamage[viewerId] >= summary.totalDamage[oppId] },
        { label: 'Damage Taken', value: String(summary.totalDamage[oppId]),          highlight: false },
        { label: 'Biggest Hit',  value: String(summary.biggestHit[viewerId]),        highlight: summary.biggestHit[viewerId] >= 10 },
        { label: 'Ultimates',    value: String(summary.ultimatesFired[viewerId]),    highlight: summary.ultimatesFired[viewerId] > 0 },
        { label: 'Dice Rolled',  value: String(summary.diceRolled[viewerId]),        highlight: false },
      ]
    : [
        { label: 'Turns',        value: String(state.turn),        highlight: false },
        { label: 'Your HP',      value: `${Math.max(0, myHp)}`,    highlight: outcome === 'victory' },
        { label: 'Opponent HP',  value: `${Math.max(0, oppHp)}`,   highlight: outcome === 'defeat' },
      ]

  const goHome = () => {
    clearMatchState()
    reset()
    useUIStore.getState().resetForMatch()
    heroPair.current = null
    navigate('/')
  }
  const rematch = () => {
    const pair = heroPair.current
    if (!pair) { goHome(); return }
    clearMatchState()
    reset()
    useUIStore.getState().resetForMatch()
    heroPair.current = null
    startMatch({ p1: pair.p1, p2: pair.p2, mode: 'vs-ai' })
    navigate('/play')
  }
  const newHero = () => {
    clearMatchState()
    reset()
    useUIStore.getState().resetForMatch()
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
        {outcome === 'victory'
          ? (summary?.descriptor ?? 'VICTORY')
          : outcome === 'defeat' ? 'DEFEAT' : 'DRAW'}
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
      {renownAward ? (
        <div className={s.renownRow}>
          <span className={s.renownGain}>+{renownAward.total} Renown</span>
          <span className={s.renownBreakdown}>
            {renownAward.breakdown.map(b => `${b.label} +${b.amount}`).join(' · ')}
          </span>
        </div>
      ) : null}
      <div className={s.actions}>
        {unlockReady ? (
          <Button variant="primary" onClick={() => { clearMatchState(); reset(); useUIStore.getState().resetForMatch(); heroPair.current = null; navigate(`/heroes/${myHero}/customize`) }} iconRight="chevron-right">
            Collection · unlock ready
          </Button>
        ) : null}
        <Button variant={unlockReady ? 'default' : 'primary'} onClick={rematch} iconRight="chevron-right">Rematch</Button>
        <Button variant="default" onClick={newHero}>New Hero</Button>
        <Button variant="default" onClick={goHome}>Return Home</Button>
      </div>
    </div>
  )
}

export default MatchSummary

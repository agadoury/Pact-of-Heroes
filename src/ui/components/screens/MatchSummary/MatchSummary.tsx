/**
 * <MatchSummary>
 *
 * Post-match screen. Shows outcome + bark + stats grid + action buttons.
 *
 * Bible reference: Part 7.7.
 */

import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/store/gameStore'
import { useUIStore } from '@/ui/store/uiStore'
import { clearMatchState } from '@/ui/store/matchPersistence'
import { Button } from '@/ui/components/atoms/Button'
import { clsx } from '@/ui/util/clsx'
import s from './MatchSummary.module.css'

export function MatchSummary(): JSX.Element {
  const navigate = useNavigate()
  const state    = useGameStore(g => g.state)
  const viewerId = useUIStore(u => u.viewerId)
  const reset    = useGameStore(g => g.reset)

  const outcome = useMemo(() => {
    if (!state?.winner) return 'draw' as const
    if (state.winner === 'draw') return 'draw' as const
    return state.winner === viewerId ? 'victory' as const : 'defeat' as const
  }, [state?.winner, viewerId])

  useEffect(() => {
    if (!state || state.phase !== 'match-end') {
      navigate('/')
    }
  }, [state, navigate])

  if (!state) return <div className={s.container} />

  const winner = state.winner === 'draw' ? null : state.players[state.winner ?? 'p1']
  const stats = [
    { label: 'Turns',       value: String(state.turn),              highlight: false },
    { label: 'Winner HP',   value: `${winner?.hp ?? 0}`,            highlight: outcome === 'victory' },
    { label: 'You Hero',    value: state.players[viewerId].hero,    highlight: false },
    { label: 'Opponent',    value: state.players[viewerId === 'p1' ? 'p2' : 'p1'].hero, highlight: false },
  ]

  const bark =
    outcome === 'victory' ? 'The pact holds.' :
    outcome === 'defeat'  ? 'The dawn will return.' :
                            'Both stand, neither yields.'

  const goHome = () => {
    clearMatchState()
    reset()
    navigate('/')
  }
  const rematch = () => {
    clearMatchState()
    reset()
    navigate('/heroes')
  }
  const newHero = () => {
    clearMatchState()
    reset()
    navigate('/heroes')
  }

  return (
    <div className={s.container}>
      <div className={s.eyebrow}>— Match Resolved —</div>
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

export default MatchSummary

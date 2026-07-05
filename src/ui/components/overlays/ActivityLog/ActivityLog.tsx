/**
 * <ActivityLog>
 *
 * Right-side drawer of match events, grouped by turn. Reads from
 * gameStore.matchLog (rich GameEvent[] stream), converts to display rows.
 *
 * Bible reference: Part 6.5.5.
 */

import { useMemo } from 'react'
import { clsx } from '@/ui/util/clsx'
import { useGameStore } from '@/store/gameStore'
import { useUIStore } from '@/ui/store/uiStore'
import type { GameEvent } from '@/game/types'
import s from './ActivityLog.module.css'

export function ActivityLog(): JSX.Element | null {
  const isOpen  = useUIStore(u => u.activeOverlay === 'log')
  const close   = useUIStore(u => u.setOverlay)
  const events  = useGameStore(g => g.matchLog)

  const grouped = useMemo(() => groupByTurn(events), [events])

  if (!isOpen) return null
  return (
    <div className={s.drawerWrap}>
      <div className={s.scrim} onClick={() => close('none')} />
      <aside className={s.drawer}>
        <header className={s.header}>
          <h2 className={s.title}>Match Log</h2>
          <button className={s.closeBtn} onClick={() => close('none')}>×</button>
        </header>
        <div className={s.entries}>
          {grouped.length === 0 ? (
            <div className={s.empty}>No events yet.</div>
          ) : (
            grouped.map(group => (
              <div key={group.turn} className={s.group}>
                <div className={s.turnHeader}>Round {group.turn}</div>
                {group.events.map((ev, i) => (
                  <div key={i} className={clsx(s.entry, s[`kind-${ev.t}`])}>
                    {formatEvent(ev)}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  )
}

interface TurnGroup { turn: number; events: GameEvent[] }

function groupByTurn(events: GameEvent[]): TurnGroup[] {
  const groups: TurnGroup[] = []
  let currentTurn = 0
  let currentGroup: TurnGroup | null = null
  for (const ev of events) {
    if (ev.t === 'turn-started') {
      currentTurn = ev.turn
      currentGroup = { turn: currentTurn, events: [ev] }
      groups.push(currentGroup)
    } else if (currentGroup) {
      currentGroup.events.push(ev)
    } else {
      // Pre-turn events (match-started etc.)
      if (groups.length === 0) {
        groups.push({ turn: 0, events: [] })
      }
      groups[0]!.events.push(ev)
    }
  }
  return groups.reverse()
}

function formatEvent(ev: GameEvent): string {
  switch (ev.t) {
    case 'turn-started':      return `${ev.player}'s turn`
    case 'ability-triggered': return `${ev.player} fires ${ev.abilityName} (T${ev.tier})`
    case 'card-played':       return `${ev.player} plays ${ev.cardId}`
    case 'damage-dealt':      return `${ev.from} → ${ev.to}: ${ev.amount} ${ev.type}`
    case 'heal-applied':      return `${ev.player} heals ${ev.amount}`
    case 'status-applied':    return `${ev.status} × ${ev.stacks} → ${ev.holder}`
    case 'status-ticked':     return `${ev.status} ticks on ${ev.holder}: ${ev.effect} ${ev.amount}`
    case 'status-removed':    return `${ev.status} removed from ${ev.holder} (${ev.reason})`
    case 'cp-changed':        return `${ev.player}: ${ev.delta > 0 ? '+' : ''}${ev.delta} CP → ${ev.total}`
    case 'hp-changed':        return `${ev.player}: ${ev.delta > 0 ? '+' : ''}${ev.delta} HP → ${ev.total}`
    case 'match-won':         return `${ev.winner === 'draw' ? 'Draw' : `${ev.winner} wins`}`
    default:                  return ev.t
  }
}

export default ActivityLog

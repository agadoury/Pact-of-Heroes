/**
 * <DamageFloaters>
 *
 * Absolutely-positioned floater numbers that rise + fade above each
 * strip when its hero takes damage / is healed / gains resource. Fires
 * on damage-dealt / heal-applied / cp-changed / passive-counter-changed
 * events by subscribing to gameStore.matchLog.
 *
 * Each floater is a distinct DOM node with a unique key so multiple
 * simultaneous hits stack cleanly.
 */

import { useEffect, useRef, useState } from 'react'
import { clsx } from '@/ui/util/clsx'
import { useGameStore } from '@/store/gameStore'
import { statusDisplayName } from '@/ui/types/statusInfo'
import type { PlayerId } from '@/game/types'
import s from './DamageFloaters.module.css'

interface Floater {
  id:      number
  player:  PlayerId
  text:    string
  variant: 'damage' | 'heal' | 'resource' | 'cp'
  /** Vertical stacking lane. Simultaneous floaters for the same player
   *  each take the next lane (offset + entrance delay) so "+2 CP" and
   *  "+1 Radiance" read as a list instead of overprinting each other. */
  lane:    number
}

let seq = 0

export function DamageFloaters(): JSX.Element {
  const lastIdx = useRef(0)
  const [floaters, setFloaters] = useState<Floater[]>([])

  useEffect(() => {
    // Skip the pre-mount backlog: startMatch fires ~15 events before this
    // screen mounts (and a resumed match restores hundreds) — replaying
    // them causes an SFX/banner burst on the first post-mount dispatch.
    lastIdx.current = useGameStore.getState().matchLog.length
    const unsub = useGameStore.subscribe((s) => {
      const log = s.matchLog
      if (log.length < lastIdx.current) lastIdx.current = 0
      if (log.length <= lastIdx.current) return
      const next: Omit<Floater, 'lane'>[] = []
      for (let i = lastIdx.current; i < log.length; i++) {
        const ev = log[i]
        if (!ev) continue
        if (ev.t === 'damage-dealt' && ev.amount > 0) {
          next.push({ id: ++seq, player: ev.to, text: `−${ev.amount}`, variant: 'damage' })
        } else if (ev.t === 'heal-applied' && ev.amount > 0) {
          next.push({ id: ++seq, player: ev.player, text: `+${ev.amount} HP`, variant: 'heal' })
        } else if (ev.t === 'cp-changed' && ev.delta > 0) {
          next.push({ id: ++seq, player: ev.player, text: `+${ev.delta} CP`, variant: 'cp' })
        } else if (ev.t === 'passive-counter-changed' && ev.delta !== 0) {
          next.push({
            id:      ++seq,
            player:  ev.player,
            text:    `${ev.delta > 0 ? '+' : ''}${ev.delta} ${statusDisplayName(ev.passiveKey)}`,
            variant: 'resource',
          })
        }
      }
      lastIdx.current = log.length
      if (next.length > 0) {
        setFloaters(prev => {
          // Lane = number of still-active floaters for that player, plus
          // this batch's earlier entries for the same player.
          const laneBase: Record<PlayerId, number> = {
            p1: prev.filter(f => f.player === 'p1').length,
            p2: prev.filter(f => f.player === 'p2').length,
          }
          const withLanes: Floater[] = next.map(f => ({ ...f, lane: laneBase[f.player]++ }))
          return [...prev, ...withLanes]
        })
        // Auto-cull; lifetime covers the lane's staggered entrance delay.
        next.forEach((f, i) => {
          window.setTimeout(() => {
            setFloaters(prev => prev.filter(x => x.id !== f.id))
          }, 1600 + (i + 4) * 200)
        })
      }
    })
    return unsub
  }, [])

  return (
    <>
      {floaters.map(f => (
        <div
          key={f.id}
          className={clsx(s.floater, s[f.variant], s[`player-${f.player}`])}
          style={{
            ['--lane' as string]: `${f.lane}`,
            animationDelay: `${f.lane * 200}ms`,
          }}
        >
          {f.text}
        </div>
      ))}
    </>
  )
}

export default DamageFloaters

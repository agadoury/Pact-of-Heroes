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
import type { PlayerId } from '@/game/types'
import s from './DamageFloaters.module.css'

interface Floater {
  id:      number
  player:  PlayerId
  text:    string
  variant: 'damage' | 'heal' | 'resource' | 'cp'
  xOffset: number
}

let seq = 0

export function DamageFloaters(): JSX.Element {
  const lastIdx = useRef(0)
  const [floaters, setFloaters] = useState<Floater[]>([])

  useEffect(() => {
    const unsub = useGameStore.subscribe((s) => {
      const log = s.matchLog
      if (log.length <= lastIdx.current) return
      const next: Floater[] = []
      for (let i = lastIdx.current; i < log.length; i++) {
        const ev = log[i]
        if (!ev) continue
        if (ev.t === 'damage-dealt' && ev.amount > 0) {
          next.push({
            id:      ++seq,
            player:  ev.to,
            text:    `−${ev.amount}`,
            variant: 'damage',
            xOffset: (seq % 5) * 6 - 12,
          })
        } else if (ev.t === 'heal-applied' && ev.amount > 0) {
          next.push({
            id:      ++seq,
            player:  ev.player,
            text:    `+${ev.amount}`,
            variant: 'heal',
            xOffset: (seq % 5) * 6 - 12,
          })
        } else if (ev.t === 'cp-changed' && ev.delta > 0) {
          next.push({
            id:      ++seq,
            player:  ev.player,
            text:    `+${ev.delta} CP`,
            variant: 'cp',
            xOffset: (seq % 3) * 5 - 8,
          })
        } else if (ev.t === 'passive-counter-changed' && ev.delta !== 0) {
          next.push({
            id:      ++seq,
            player:  ev.player,
            text:    `${ev.delta > 0 ? '+' : ''}${ev.delta} ${ev.passiveKey}`,
            variant: 'resource',
            xOffset: (seq % 3) * 5 - 8,
          })
        }
      }
      lastIdx.current = log.length
      if (next.length > 0) {
        setFloaters(prev => [...prev, ...next])
        // Auto-cull after 1600ms per floater.
        next.forEach(f => {
          window.setTimeout(() => {
            setFloaters(prev => prev.filter(x => x.id !== f.id))
          }, 1600)
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
          style={{ ['--x-offset' as string]: `${f.xOffset}px` }}
        >
          {f.text}
        </div>
      ))}
    </>
  )
}

export default DamageFloaters

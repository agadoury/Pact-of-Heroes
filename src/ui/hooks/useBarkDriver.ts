/**
 * useBarkDriver
 *
 * Watches gameStore.matchLog for bark-worthy moments and surfaces at most
 * one speech bubble per player per turn (the loudest moment wins by
 * arriving first). Clone of useJuice's matchLog-subscription pattern —
 * skips the pre-mount backlog so a resumed match doesn't replay history.
 *
 * Bible reference: Part 7.11 (Rival Layer).
 */

import { useEffect, useState, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { PlayerId } from '@/game/types'
import { barkFor, type BarkMoment } from '@/ui/util/barks'

export interface ActiveBark {
  id:     number
  player: PlayerId
  text:   string
}

const BUBBLE_MS = 2000

export function useBarkDriver(): ActiveBark | null {
  const [bark, setBark] = useState<ActiveBark | null>(null)
  const lastIdx = useRef(0)
  const lastBarkTurn = useRef<Record<PlayerId, number>>({ p1: -1, p2: -1 })
  const seq = useRef(0)
  const clearTimer = useRef<number | null>(null)
  const sawDamage = useRef(false)

  useEffect(() => {
    lastIdx.current = useGameStore.getState().matchLog.length
    // A resumed/mid-match mount must not treat the next hit as first blood.
    sawDamage.current = useGameStore.getState().matchLog.some(
      e => e.t === 'damage-dealt' && e.amount > 0,
    )

    const speak = (player: PlayerId, moment: BarkMoment, turn: number) => {
      if (lastBarkTurn.current[player] === turn) return   // one bark per turn each
      const g = useGameStore.getState()
      const hero = g.state?.players[player]?.hero
      if (!hero) return
      const text = barkFor(hero, moment, turn)
      if (!text) return
      lastBarkTurn.current[player] = turn
      if (clearTimer.current != null) window.clearTimeout(clearTimer.current)
      const id = ++seq.current
      setBark({ id, player, text })
      clearTimer.current = window.setTimeout(() => {
        setBark(prev => (prev?.id === id ? null : prev))
      }, BUBBLE_MS)
    }

    const unsub = useGameStore.subscribe((s) => {
      const log = s.matchLog
      if (log.length < lastIdx.current) lastIdx.current = 0
      if (log.length <= lastIdx.current) return
      const turn = s.state?.turn ?? 0
      for (let i = lastIdx.current; i < log.length; i++) {
        const ev = log[i]
        if (!ev) continue
        switch (ev.t) {
          case 'damage-dealt': {
            if (ev.amount <= 0) {
              if (ev.from !== ev.to) speak(ev.to, 'blocked', turn)
              break
            }
            if (!sawDamage.current) {
              sawDamage.current = true
              if (ev.from !== ev.to) speak(ev.from, 'first-blood', turn)
            } else if (ev.amount >= 10 && ev.from !== ev.to) {
              speak(ev.from, 'big-hit', turn)
            }
            break
          }
          case 'passive-counter-changed': {
            if (ev.passiveKey === 'frenzy' && ev.total >= 4 && ev.delta > 0) {
              speak(ev.player, 'frenzy-max', turn)
            }
            break
          }
          case 'status-applied': {
            if (ev.status === 'pyromancer:cinder' && ev.total >= 4) {
              speak(ev.applier, 'cinder-critical', turn)
            }
            break
          }
          case 'status-detonated': {
            speak(ev.holder === 'p1' ? 'p2' : 'p1', 'detonation', turn)
            break
          }
          case 'hero-state': {
            if (ev.state === 'low-hp-enter') speak(ev.player, 'low-hp', turn)
            break
          }
          case 'ultimate-fired': {
            speak(ev.player, 'ultimate', turn)
            break
          }
        }
      }
      lastIdx.current = log.length
    })
    return () => {
      unsub()
      if (clearTimer.current != null) window.clearTimeout(clearTimer.current)
    }
  }, [])

  return bark
}

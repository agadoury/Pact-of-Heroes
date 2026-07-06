/**
 * useJuice — screen shake + hit flash + hero portrait pop on damage events.
 *
 * Watches gameStore.matchLog for damage-dealt and drives a small store
 * that view layers subscribe to. Also fires ability-triggered pulses on
 * the attacker's side.
 *
 * "Juice" (design vocab): unnecessary but game-defining feedback — the
 * layer that makes the same underlying mechanic feel Blizzard-shipped
 * instead of Excel-simulated.
 */

import { useEffect, useRef } from 'react'
import { create } from 'zustand'
import { useGameStore } from '@/store/gameStore'
import type { PlayerId } from '@/game/types'

interface JuiceState {
  shakeMagnitude: number       // px, drives translate(random×N)
  shakeStartedAt: number       // performance.now() timestamp
  hitFlashPlayer: PlayerId | null
  hitFlashAt: number
  hitFlashAmount: number       // damage taken (drives flash intensity)

  triggerShake:    (magnitude: number) => void
  triggerHitFlash: (player: PlayerId, amount: number) => void
}

export const useJuiceStore = create<JuiceState>((set) => ({
  shakeMagnitude: 0,
  shakeStartedAt: 0,
  hitFlashPlayer: null,
  hitFlashAt:     0,
  hitFlashAmount: 0,

  triggerShake:    (magnitude) => set({ shakeMagnitude: magnitude, shakeStartedAt: performance.now() }),
  triggerHitFlash: (player, amount) => set({
    hitFlashPlayer: player,
    hitFlashAt:     performance.now(),
    hitFlashAmount: amount,
  }),
}))

/** Wire matchLog → juice triggers. */
export function useJuice(): void {
  const lastIdx = useRef(0)
  useEffect(() => {
    // Skip the pre-mount backlog: startMatch fires ~15 events before this
    // screen mounts (and a resumed match restores hundreds) — replaying
    // them causes an SFX/banner burst on the first post-mount dispatch.
    lastIdx.current = useGameStore.getState().matchLog.length
    const unsub = useGameStore.subscribe((s) => {
      const log = s.matchLog
      if (log.length < lastIdx.current) lastIdx.current = 0
      if (log.length <= lastIdx.current) return
      for (let i = lastIdx.current; i < log.length; i++) {
        const ev = log[i]
        if (!ev) continue
        if (ev.t === 'damage-dealt' && ev.amount > 0) {
          // Screen shake proportional to damage; clamped to 6–14px.
          const shake = Math.min(14, 4 + ev.amount * 0.7)
          useJuiceStore.getState().triggerShake(shake)
          useJuiceStore.getState().triggerHitFlash(ev.to, ev.amount)
        }
        if (ev.t === 'ultimate-fired') {
          useJuiceStore.getState().triggerShake(18)
        }
        if (ev.t === 'match-won') {
          useJuiceStore.getState().triggerShake(24)
        }
      }
      lastIdx.current = log.length
    })
    return unsub
  }, [])
}

/**
 * useAiDriver
 *
 * When it's the AI's turn (or a defensive/spend prompt targeting the AI is
 * pending), tick the engine forward by dispatching whatever the AI chooses.
 *
 * The driver paces itself: it waits until the resolution queue is idle
 * before firing the next action, so the viewer sees each cinematic play
 * before the AI moves again.
 *
 * Bible reference: Part 7.3.5 opponent turn.
 */

import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useUIStore } from '@/ui/store/uiStore'
import { nextAiAction } from '@/game/ai'
import type { PlayerId } from '@/game/types'

const TICK_MS = 350

export function useAiDriver(aiPlayer: PlayerId | null): void {
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!aiPlayer) return

    const clear = () => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    const tick = () => {
      const gs = useGameStore.getState()
      const us = useUIStore.getState()
      const state = gs.state
      if (!state || state.winner || state.phase === 'match-end') return

      // Wait until the resolution queue drains before dispatching more.
      if (us.currentResolution || us.resolutionQueue.length > 0) {
        timerRef.current = window.setTimeout(tick, TICK_MS)
        return
      }

      // Determine if it's the AI's turn to act.
      const aiShouldAct =
        state.activePlayer === aiPlayer
        || state.pendingAttack?.defender === aiPlayer
        || state.pendingBankSpend?.holder === aiPlayer
        || state.pendingOffensiveChoice?.attacker === aiPlayer
        || state.pendingStatusRemoval?.holder === aiPlayer
        || state.pendingCounter?.holder === aiPlayer

      if (!aiShouldAct) return

      try {
        const action = nextAiAction(state, aiPlayer)
        gs.dispatch(action)
      } catch (err) {
        // AI failed to produce an action — surface via console and stop.
        console.warn('[ai-driver] nextAiAction threw:', err)
        return
      }
      timerRef.current = window.setTimeout(tick, TICK_MS)
    }

    // Initial kick — subscribe to store changes so we tick when the AI's
    // turn begins, and also fire immediately in case we're already on it.
    const unsub = useGameStore.subscribe(() => {
      if (timerRef.current == null) tick()
    })
    tick()

    return () => {
      clear()
      unsub()
    }
  }, [aiPlayer])
}

/**
 * useAiDriver
 *
 * Drives the AI opponent. Whenever the engine is waiting on the AI — its
 * own turn, or a prompt targeting it (defense pick, bank spend, offensive
 * pick, status-removal window, counter window) — the driver asks
 * `nextAiAction` for a move and dispatches it.
 *
 * Pacing: the driver waits for the resolution queue to drain before each
 * move so the viewer sees every cinematic, and adds a small human-feeling
 * "thinking" delay between actions.
 *
 * Robustness invariants (each one fixed a real shipped stall):
 *   - The scheduled-timer handle is owned by this closure and cleared at
 *     the top of every tick, so a fired timer can never mask future
 *     re-kicks from the store subscriptions.
 *   - Both gameStore AND uiStore subscriptions re-kick the loop: game
 *     state changes wake the AI for its turn; resolution-queue drain wakes
 *     it after cinematics.
 *   - A no-progress watchdog detects dispatches the engine rejected
 *     (matchLog stopped growing) and stops the loop loudly instead of
 *     spinning forever.
 *
 * Bible reference: Part 7.3.5 opponent turn.
 */

import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useUIStore } from '@/ui/store/uiStore'
import { nextAiAction, pendingActorFor } from '@/game/ai'
import type { PlayerId } from '@/game/types'

/** Base delay between AI actions (ms) — reads as deliberate, not robotic. */
const THINK_MS = 650
/** Extra random jitter added to each think delay (ms). */
const THINK_JITTER_MS = 350
/** Poll interval while waiting for the resolution queue to drain. */
const DRAIN_POLL_MS = 200
/** Consecutive rejected dispatches before the watchdog halts the loop. */
const WATCHDOG_LIMIT = 5

export function useAiDriver(aiPlayer: PlayerId | null): void {
  useEffect(() => {
    if (!aiPlayer) return

    let timer: number | null = null
    let disposed = false
    let rejectedStreak = 0
    let halted = false

    const schedule = (ms: number) => {
      if (disposed || halted) return
      if (timer != null) window.clearTimeout(timer)
      timer = window.setTimeout(tick, ms)
    }

    const tick = () => {
      timer = null
      if (disposed || halted) return

      const gs = useGameStore.getState()
      const us = useUIStore.getState()
      const state = gs.state
      if (!state || state.winner || state.phase === 'match-end') return

      // Let queued cinematics finish before the AI moves again.
      if (us.currentResolution || us.resolutionQueue.length > 0) {
        schedule(DRAIN_POLL_MS)
        return
      }

      // Is the engine actually waiting on the AI?
      if (pendingActorFor(state) !== aiPlayer) return

      let action
      try {
        action = nextAiAction(state, aiPlayer)
      } catch (err) {
        console.error('[ai-driver] nextAiAction threw — AI halted:', err)
        halted = true
        return
      }
      if (!action) return

      const logLenBefore = gs.matchLog.length
      gs.dispatch(action)
      const after = useGameStore.getState()

      // Watchdog: a dispatch the engine silently rejected produces no
      // events. One rejection can be a benign race; a streak means the AI
      // and engine disagree about legal moves — stop and surface it.
      if (after.matchLog.length === logLenBefore) {
        rejectedStreak += 1
        if (rejectedStreak >= WATCHDOG_LIMIT) {
          console.error(
            '[ai-driver] engine rejected', rejectedStreak,
            'consecutive AI actions — halting. Last action:', action,
            'phase:', after.state?.phase,
          )
          halted = true
          return
        }
      } else {
        rejectedStreak = 0
      }

      // Swift Play: while the viewer holds fast-forward, the AI thinks 3×
      // faster — the pacing compression is matched in useResolutionDriver.
      const think = THINK_MS + Math.random() * THINK_JITTER_MS
      schedule(useUIStore.getState().fastForward ? think / 3 : think)
    }

    // Re-kick on any store change when no tick is already scheduled. The
    // schedule(0) indirection keeps dispatches out of the store's
    // notification stack.
    const kick = () => {
      if (timer == null) schedule(0)
    }
    const unsubGame = useGameStore.subscribe(kick)
    const unsubUi = useUIStore.subscribe(kick)
    schedule(0)

    return () => {
      disposed = true
      if (timer != null) window.clearTimeout(timer)
      unsubGame()
      unsubUi()
    }
  }, [aiPlayer])
}

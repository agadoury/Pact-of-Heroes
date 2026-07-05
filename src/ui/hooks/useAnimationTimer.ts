/**
 * Coordinated multi-phase animation timer.
 *
 * Used primarily by the resolution state machine to advance through
 * preconfirm → fade-in → name-in → damage-in → effects-in → holding →
 * fade-out → idle at bible-precise offsets.
 *
 * All timeouts are trackable and cancellable via the returned `cancel()`
 * so an interrupted resolution (app backgrounds, viewer disconnects)
 * doesn't leave dangling timers.
 *
 * Bible reference: Part 0.7.
 */

import { useCallback, useEffect, useRef } from 'react'

export interface AnimationStep<TPhase extends string> {
  atMs: number
  phase: TPhase
}

export interface AnimationController<TPhase extends string> {
  start:  (steps: AnimationStep<TPhase>[]) => void
  cancel: () => void
}

/**
 * Provides a stable controller. `onPhase(phase, elapsedMs)` is called for
 * each scheduled step. The final step conventionally advances the phase to
 * an "idle" or "done" value so the caller can react.
 */
export function useAnimationTimer<TPhase extends string>(
  onPhase: (phase: TPhase, elapsedMs: number) => void,
): AnimationController<TPhase> {
  const timersRef = useRef<number[]>([])

  const cancel = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id)
    timersRef.current = []
  }, [])

  const start = useCallback((steps: AnimationStep<TPhase>[]) => {
    cancel()
    const startedAt = performance.now()
    for (const step of steps) {
      const id = window.setTimeout(() => {
        onPhase(step.phase, performance.now() - startedAt)
      }, step.atMs)
      timersRef.current.push(id)
    }
  }, [onPhase, cancel])

  // Cleanup on unmount so a lingering resolution doesn't fire callbacks
  // after the parent left the tree.
  useEffect(() => cancel, [cancel])

  return { start, cancel }
}

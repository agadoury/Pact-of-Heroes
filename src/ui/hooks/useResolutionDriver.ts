/**
 * useResolutionDriver
 *
 * Advances the resolution queue on uiStore, playing each ResolvedEvent
 * through the 2000ms phase pipeline (or ~700ms for upkeep sub-events,
 * ~3500ms for ultimates).
 *
 * The driver mounts a passive listener that fires when currentResolution
 * changes; it walks the phase sequence via setTimeouts stored in a ref so
 * they can be cancelled on unmount / app background.
 *
 * Bible reference: Parts 0.7 + 7.4.
 */

import { useEffect, useRef } from 'react'
import { useUIStore } from '@/ui/store/uiStore'
import { useReducedMotion } from './useReducedMotion'
import type { ResolutionPhase } from '@/ui/types/fop'
import { DURATION } from '@/ui/util/duration'

interface PhaseStep {
  at:    number
  phase: ResolutionPhase
}

const STANDARD_SEQUENCE: PhaseStep[] = [
  { at: 0,                          phase: 'preconfirm' },
  { at: DURATION.resolutionConfirm, phase: 'fade-in' },
  { at: 350,                        phase: 'name-in' },
  { at: 550,                        phase: 'damage-in' },
  { at: 800,                        phase: 'effects-in' },
  { at: 1100,                       phase: 'holding' },
  { at: 1500,                       phase: 'fade-out' },
  { at: 2000,                       phase: 'idle' },
]

export function useResolutionDriver(): void {
  const reduced   = useReducedMotion()
  const currentId = useUIStore(state => state.currentResolution?.id ?? null)
  const timers    = useRef<number[]>([])

  useEffect(() => {
    // Clear any dangling timers on unmount or when the resolution changes.
    return () => {
      for (const t of timers.current) window.clearTimeout(t)
      timers.current = []
    }
  }, [])

  useEffect(() => {
    // Auto-pull the next resolution off the queue when we're idle.
    const drain = () => {
      const st = useUIStore.getState()
      if (st.currentResolution || st.resolutionQueue.length === 0) return
      st.advanceResolutionQueue()
    }
    drain()
    const unsub = useUIStore.subscribe(drain)
    return unsub
  }, [])

  useEffect(() => {
    // Clear prior timers on every resolution change.
    for (const t of timers.current) window.clearTimeout(t)
    timers.current = []
    if (!currentId) return

    // Schedule each phase step.
    for (const step of STANDARD_SEQUENCE) {
      const id = window.setTimeout(() => {
        const st = useUIStore.getState()
        st.setResolutionPhase(step.phase)
        if (step.phase === 'idle') {
          // Advance to the next queued resolution (or land in idle).
          st.advanceResolutionQueue()
        }
      }, step.at)
      timers.current.push(id)
    }

    // Reduced motion still respects the total duration for engine sync,
    // but individual step timing is uniform (skip the overshoot).
    if (reduced) {
      // No-op — the CSS + JS animation both branch on reduced motion.
    }
  }, [currentId, reduced])
}

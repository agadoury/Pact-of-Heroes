/**
 * useResolutionDriver
 *
 * Advances the resolution queue on uiStore, playing each ResolvedEvent
 * through a per-scene phase pipeline:
 *
 *   ability / detonation / consume / defense: 2000ms full cinematic
 *   sub-event (upkeep beats):                  700ms lightweight
 *   card-play:                                 1700ms card-lift beat
 *
 * The driver mounts a passive listener that fires when currentResolution
 * changes; it walks the phase sequence via setTimeouts stored in a ref so
 * they can be cancelled on unmount / app background.
 *
 * Bible references: Parts 0.7, 5.3.5, 7.4.
 */

import { useEffect, useRef } from 'react'
import { useUIStore } from '@/ui/store/uiStore'
import { useReducedMotion } from './useReducedMotion'
import type { FOPScene, ResolutionPhase } from '@/ui/types/fop'
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

const SUB_EVENT_SEQUENCE: PhaseStep[] = [
  { at: 0,   phase: 'preconfirm' },
  { at: 50,  phase: 'fade-in' },
  { at: 150, phase: 'holding' },
  { at: 600, phase: 'fade-out' },
  { at: 700, phase: 'idle' },
]

const CARD_PLAY_SEQUENCE: PhaseStep[] = [
  { at: 0,    phase: 'preconfirm' },
  { at: 100,  phase: 'fade-in' },
  { at: 300,  phase: 'holding' },
  { at: 1500, phase: 'fade-out' },
  { at: 1700, phase: 'idle' },
]

function sequenceFor(scene: FOPScene | null): PhaseStep[] {
  if (!scene) return STANDARD_SEQUENCE
  switch (scene.kind) {
    case 'sub-event': return SUB_EVENT_SEQUENCE
    case 'card-play': return CARD_PLAY_SEQUENCE
    default:          return STANDARD_SEQUENCE
  }
}

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

    // Select the timing sequence based on the current scene kind.
    const scene = useUIStore.getState().currentResolution?.scene ?? null
    const sequence = sequenceFor(scene)

    for (const step of sequence) {
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

    if (reduced) {
      // Reduced-motion mode still respects total duration for engine sync.
    }
  }, [currentId, reduced])
}

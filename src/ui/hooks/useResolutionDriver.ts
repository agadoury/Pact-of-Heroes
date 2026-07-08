/**
 * useResolutionDriver
 *
 * Advances the resolution queue on uiStore, playing each ResolvedEvent
 * through a per-scene phase pipeline:
 *
 *   ability / detonation / consume / defense: content-aware cinematic
 *     (~2.3s for a bare hit, +350ms per extra effect row — see
 *     standardSequence)
 *   sub-event (upkeep beats):                  950ms lightweight
 *   card-play:                                 2600ms card-read beat
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

const SUB_EVENT_SEQUENCE: PhaseStep[] = [
  { at: 0,                         phase: 'preconfirm' },
  { at: 50,                        phase: 'fade-in' },
  { at: 150,                       phase: 'holding' },
  { at: DURATION.upkeepBeat - 100, phase: 'fade-out' },
  { at: DURATION.upkeepBeat,       phase: 'idle' },
]

const CARD_PLAY_SEQUENCE: PhaseStep[] = [
  { at: 0,                          phase: 'preconfirm' },
  { at: 100,                        phase: 'fade-in' },
  { at: 300,                        phase: 'holding' },
  { at: DURATION.cardPlayBeat - 200, phase: 'fade-out' },
  { at: DURATION.cardPlayBeat,       phase: 'idle' },
]

/** Full-cinematic sequence, paced by content: the hold grows with the
 *  number of effect rows (and detonations get an extra beat) so players
 *  have time to read what actually happened. */
function standardSequence(scene: FOPScene | null): PhaseStep[] {
  const effectCount =
    scene?.kind === 'ability' ? scene.data.effects.length : 0
  const isUltimate   = scene?.kind === 'ability' && scene.data.tier === 4
  const isDetonation = scene?.kind === 'detonation'

  const effectsIn = 800
  // Holding begins once the last staggered row (100ms apiece) has landed.
  const holdStart = effectsIn + 150 + effectCount * 100
  const hold =
    DURATION.resolutionHold
    + Math.max(0, effectCount - 1) * DURATION.resolutionHoldPerRow
    + (isUltimate ? 600 : 0)
    + (isDetonation ? 500 : 0)
  const fadeOut = holdStart + hold

  return [
    { at: 0,                          phase: 'preconfirm' },
    { at: DURATION.resolutionConfirm, phase: 'fade-in' },
    { at: 350,                        phase: 'name-in' },
    { at: 550,                        phase: 'damage-in' },
    { at: effectsIn,                  phase: 'effects-in' },
    { at: holdStart,                  phase: 'holding' },
    { at: fadeOut,                    phase: 'fade-out' },
    { at: fadeOut + 400,              phase: 'idle' },
  ]
}

function sequenceFor(scene: FOPScene | null): PhaseStep[] {
  if (!scene) return standardSequence(null)
  switch (scene.kind) {
    case 'sub-event': return SUB_EVENT_SEQUENCE
    case 'card-play': return CARD_PLAY_SEQUENCE
    default:          return standardSequence(scene)
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

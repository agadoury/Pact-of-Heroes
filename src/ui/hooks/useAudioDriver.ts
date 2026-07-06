/**
 * useAudioDriver
 *
 * Subscribes to gameStore.matchLog and fires the appropriate SFX for
 * each engine GameEvent. Also wires match-end fanfare / defeat toll.
 *
 * Placed at the app root so audio plays regardless of which screen is
 * active (menu clicks still work on Home / HeroSelect / etc.).
 */

import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useUIStore } from '@/ui/store/uiStore'
import { audio } from '@/audio/manager'
import type { GameEvent } from '@/game/types'

export function useAudioDriver(): void {
  const lastIdx = useRef(0)

  useEffect(() => {
    const unsub = useGameStore.subscribe((s) => {
      const log = s.matchLog
      if (log.length <= lastIdx.current) return
      const viewer = useUIStore.getState().viewerId
      for (let i = lastIdx.current; i < log.length; i++) {
        const ev = log[i]
        if (ev) fireSfxFor(ev, viewer)
      }
      lastIdx.current = log.length
    })
    return unsub
  }, [])
}

function fireSfxFor(ev: GameEvent, _viewer: string): void {
  switch (ev.t) {
    case 'dice-rolled':        audio.play('die-throw'); break
    case 'die-locked':         audio.play(ev.locked ? 'die-lock' : 'ui-back'); break
    case 'ability-triggered':  audio.play(ev.tier >= 4 ? 'ult-sting' : 'ability-sting'); break
    case 'ultimate-fired':     audio.play('ult-sting'); break
    case 'damage-dealt':       if (ev.amount > 0) audio.play('damage-thud'); break
    case 'heal-applied':       audio.play('heal-shimmer'); break
    case 'status-applied':     audio.play('status-apply'); break
    case 'status-ticked':      audio.play('status-tick'); break
    case 'status-removed':     audio.play('status-shatter'); break
    case 'card-played':        audio.play('card-thud'); break
    case 'card-drawn':         audio.play('card-shuffle'); break
    case 'defense-resolved':   if (ev.landed && ev.reduction > 0) audio.play('shield-block'); break
    case 'match-won':          audio.play('victory-fanfare'); break
    case 'ladder-state-changed': {
      // Fire the ladder-firing chime the first time any row hits `firing`
      // (bibliotheca: this doesn't fire every render — only on transition).
      const anyFiring = ev.rows.some(r => r.kind === 'firing')
      if (anyFiring) audio.play('ladder-firing')
      const anyLethal = ev.rows.some(r => r.kind !== 'out-of-reach' && (r as { lethal?: boolean }).lethal === true)
      if (anyLethal) audio.play('ladder-lethal')
      break
    }
    default: break
  }
}

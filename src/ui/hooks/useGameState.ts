/**
 * Convenience selector hooks over the existing gameStore.
 *
 * The gameStore is a Zustand store; components call `useGameStore(selector)`
 * directly. These wrappers cover the most common access patterns so the
 * selector logic isn't duplicated in every component.
 */

import type { GameState, HeroSnapshot, PlayerId } from '@/game/types'
import { useGameStore } from '@/store/gameStore'

/** The full game state, or null before a match starts. */
export function useGameState(): GameState | null {
  return useGameStore(s => s.state)
}

/** Snapshot for one player. Returns null if no active match or unknown id. */
export function usePlayerSnapshot(playerId: PlayerId): HeroSnapshot | null {
  return useGameStore(s => s.state?.players[playerId] ?? null)
}

/** Convenience: the active player id (whose turn it is). */
export function useActivePlayer(): PlayerId | null {
  return useGameStore(s => s.state?.activePlayer ?? null)
}

/** Convenience: the engine phase. */
export function useEnginePhase() {
  return useGameStore(s => s.state?.phase ?? 'pre-match')
}

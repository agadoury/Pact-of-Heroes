/**
 * Match persistence — save the engine's GameState to localStorage on
 * every dispatch (debounced) and load it back on demand.
 *
 * Bible reference: Part 7.10.
 */

import type { GameEvent, GameState } from '@/game/types'
import { useGameStore } from '@/store/gameStore'

const STORAGE_KEY = 'pact-of-heroes:match:v1'
const DEBOUNCE_MS = 200
const MAX_AGE_MS  = 7 * 24 * 60 * 60 * 1000  // 7 days

interface SavedMatch {
  savedAt: number
  state:   GameState
  /** Full event log — resumed matches need it so the post-match summary
   *  (damage totals, descriptor) covers the WHOLE match, not just the
   *  post-resume slice. Optional for pre-existing saves. */
  matchLog?: GameEvent[]
}

let debounceTimer: number | null = null
let bridgeUnsub: (() => void) | null = null

export function saveMatchState(state: GameState, matchLog: readonly GameEvent[] = []): void {
  try {
    const payload: SavedMatch = { savedAt: Date.now(), state, matchLog: matchLog.slice() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Storage full / disabled — silent no-op; the match continues in memory.
  }
}

export function loadMatchState(): { state: GameState; matchLog: GameEvent[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedMatch
    if (!parsed?.state || typeof parsed.savedAt !== 'number') return null
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      clearMatchState()
      return null
    }
    if (parsed.state.phase === 'match-end') {
      clearMatchState()
      return null
    }
    return { state: parsed.state, matchLog: parsed.matchLog ?? [] }
  } catch {
    return null
  }
}

export function clearMatchState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

export function hasResumableMatch(): boolean {
  return loadMatchState() !== null
}

/**
 * Subscribe to gameStore state changes; debounce-save on each change.
 * Idempotent — safe to call once at app boot.
 */
export function wireMatchPersistence(): () => void {
  if (bridgeUnsub) return bridgeUnsub
  bridgeUnsub = useGameStore.subscribe((s) => {
    if (!s.state) return
    if (debounceTimer != null) window.clearTimeout(debounceTimer)
    debounceTimer = window.setTimeout(() => {
      const g = useGameStore.getState()
      if (g.state) saveMatchState(g.state, g.matchLog)
    }, DEBOUNCE_MS)
  })
  return bridgeUnsub
}

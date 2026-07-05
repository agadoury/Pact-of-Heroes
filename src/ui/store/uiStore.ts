/**
 * UI store — transient view state that doesn't belong on the engine.
 *
 * The engine's `gameStore` is authoritative for game truth. This store
 * covers:
 *   - viewer perspective (which player the screen renders for)
 *   - resolution state machine (which cinematic phase is playing)
 *   - resolution queue (upcoming FOPScenes to play, in order)
 *   - overlay state (which modal is up, tooltip anchor)
 *   - transient interaction state (selected ability, pending spend option)
 *   - viewer preferences (reduced motion, activity log open, ...)
 *
 * A subscription to `gameStore.lastEvents` runs the FOPScene aggregator
 * on every dispatch and pushes emitted scenes into `resolutionQueue`.
 *
 * Bible reference: Part 0.3.
 */

import { create } from 'zustand'
import type { PlayerId } from '@/game/types'
import { useGameStore } from '@/store/gameStore'
import type { ResolutionPhase } from '@/ui/types/fop'
import type { ResolvedEvent } from '@/ui/types/resolved-event'
import type { TooltipTarget } from '@/ui/types/tooltip'
import {
  aggregateEvents,
  initialAggregatorState,
  type AggregatorState,
} from '@/ui/selectors/fopAggregator'

/** Which modal (if any) is currently active. Union of enum values so we can
 *  render at most one modal at a time; tooltips stack on top independently. */
export type ActiveOverlay =
  | 'none'
  | 'defensive'
  | 'spend'
  | 'card'
  | 'ability'
  | 'ultimate'
  | 'offensive-pick'
  | 'skip-confirm'
  | 'log'
  | 'menu'
  | 'instant-prompt'
  | 'match-summary'

export interface UIState {
  // Viewer perspective
  viewerId: PlayerId

  // Resolution pipeline
  resolutionPhase:    ResolutionPhase
  resolutionQueue:    ResolvedEvent[]
  currentResolution:  ResolvedEvent | null
  aggregatorState:    AggregatorState

  // Overlays and tooltips
  activeOverlay: ActiveOverlay
  tooltipTarget: TooltipTarget | null

  // Interaction state (all scoped to viewer)
  selectedAbilityId:     string | null
  hoveredAbilityId:      string | null
  selectedDefenseId:     string | null
  selectedSpendOptionId: string | null
  focusedCardId:         string | null

  // Preferences
  reducedMotionOverride: 'auto' | 'on' | 'off'
  activityLogOpen:       boolean
  activityLogLastReadId: string | null

  // Actions
  setViewer: (playerId: PlayerId) => void
  setResolutionPhase: (phase: ResolutionPhase) => void
  advanceResolutionQueue: () => void
  enqueueResolutions: (events: ResolvedEvent[]) => void
  setOverlay: (overlay: ActiveOverlay) => void
  setTooltip: (target: TooltipTarget | null) => void
  selectAbility: (id: string | null) => void
  selectDefense: (id: string | null) => void
  selectSpendOption: (id: string | null) => void
  focusCard: (id: string | null) => void
  setReducedMotionOverride: (v: 'auto' | 'on' | 'off') => void
  openActivityLog: () => void
  closeActivityLog: () => void
  reset: () => void
}

const INITIAL: Omit<UIState, keyof UIStoreActions> = {
  viewerId:              'p1',
  resolutionPhase:       'idle',
  resolutionQueue:       [],
  currentResolution:     null,
  aggregatorState:       initialAggregatorState,
  activeOverlay:         'none',
  tooltipTarget:         null,
  selectedAbilityId:     null,
  hoveredAbilityId:      null,
  selectedDefenseId:     null,
  selectedSpendOptionId: null,
  focusedCardId:         null,
  reducedMotionOverride: 'auto',
  activityLogOpen:       false,
  activityLogLastReadId: null,
}

type UIStoreActions = {
  setViewer:                UIState['setViewer']
  setResolutionPhase:       UIState['setResolutionPhase']
  advanceResolutionQueue:   UIState['advanceResolutionQueue']
  enqueueResolutions:       UIState['enqueueResolutions']
  setOverlay:               UIState['setOverlay']
  setTooltip:               UIState['setTooltip']
  selectAbility:            UIState['selectAbility']
  selectDefense:            UIState['selectDefense']
  selectSpendOption:        UIState['selectSpendOption']
  focusCard:                UIState['focusCard']
  setReducedMotionOverride: UIState['setReducedMotionOverride']
  openActivityLog:          UIState['openActivityLog']
  closeActivityLog:         UIState['closeActivityLog']
  reset:                    UIState['reset']
}

export const useUIStore = create<UIState>((set) => ({
  ...INITIAL,

  setViewer: (viewerId) => set({ viewerId }),

  setResolutionPhase: (resolutionPhase) => set({ resolutionPhase }),

  advanceResolutionQueue: () => set((s) => {
    const [next, ...rest] = s.resolutionQueue
    return {
      currentResolution: next ?? null,
      resolutionQueue:   rest,
      resolutionPhase:   next ? 'preconfirm' : 'idle',
    }
  }),

  enqueueResolutions: (events) => set((s) => ({
    resolutionQueue: [...s.resolutionQueue, ...events],
  })),

  setOverlay: (activeOverlay) => set({ activeOverlay }),

  setTooltip: (tooltipTarget) => set({ tooltipTarget }),

  selectAbility: (id) => set({ selectedAbilityId: id }),

  selectDefense: (id) => set({ selectedDefenseId: id }),

  selectSpendOption: (id) => set({ selectedSpendOptionId: id }),

  focusCard: (id) => set({ focusedCardId: id }),

  setReducedMotionOverride: (v) => set({ reducedMotionOverride: v }),

  openActivityLog:  () => set({ activityLogOpen: true }),
  closeActivityLog: () => set({ activityLogOpen: false }),

  reset: () => set({ ...INITIAL }),
}))

// ---------------------------------------------------------------------------
// Event → ResolvedEvent bridge
// ---------------------------------------------------------------------------

/**
 * Subscribe the FOPScene aggregator to the game store's event stream.
 * Called once from src/main.tsx (or the equivalent bootstrap). Each engine
 * dispatch produces `lastEvents`; the aggregator folds them into
 * ResolvedEvent(s) that land in `resolutionQueue`.
 *
 * Idempotent — safe to call multiple times; only the last subscription is
 * live.
 */
let unsubEventBridge: (() => void) | null = null

let eventSeq = 0

export function wireResolutionBridge(): () => void {
  if (unsubEventBridge) {
    unsubEventBridge()
    unsubEventBridge = null
  }
  unsubEventBridge = useGameStore.subscribe((state, prev) => {
    if (state.lastEvents === prev.lastEvents) return
    const { aggregatorState } = useUIStore.getState()
    const { state: nextState, emitted } = aggregateEvents(
      aggregatorState,
      state.lastEvents,
    )
    useUIStore.setState({ aggregatorState: nextState })
    if (emitted.length === 0) return
    const now = performance.now()
    const resolved: ResolvedEvent[] = emitted.map((scene) => ({
      id:        `evt-${++eventSeq}`,
      scene,
      timestamp: now,
    }))
    useUIStore.getState().enqueueResolutions(resolved)
  })
  return unsubEventBridge
}

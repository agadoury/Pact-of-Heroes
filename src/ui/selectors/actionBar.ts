/**
 * ActionBar button-set selector.
 *
 * Given engine state + viewerId + uiStore overlay state, produce the
 * `ActionButton[]` the bar renders. Bible Part 2.8 lists every context;
 * this selector encodes the same table.
 *
 * All button ids are stable strings so click handlers can dispatch the
 * right engine action.
 *
 * Bible reference: Part 2.8.
 */

import type { GameState, PlayerId } from '@/game/types'
import type { ActionButton } from '@/ui/types/action-bar'

export interface DeriveActionBarInput {
  state:         GameState | null
  viewerId:      PlayerId
  activeOverlay: string
  resolutionActive: boolean
}

const ROLL_ATTEMPTS_TOTAL = 3

export function deriveActionBar(input: DeriveActionBarInput): ActionButton[] {
  const { state, viewerId, activeOverlay, resolutionActive } = input

  const skipTurnDisabled: ActionButton = {
    id:      'skip-turn',
    label:   'Skip Turn',
    variant: 'disabled',
  }

  if (!state) return [skipTurnDisabled, { id: 'wait', label: 'Wait…', variant: 'disabled' }]

  const activePlayer = state.activePlayer
  const isViewerTurn = activePlayer === viewerId
  const viewer       = state.players[viewerId]

  // Pending prompts take precedence over phase-based context.
  if (state.pendingAttack?.defender === viewerId) {
    return [
      skipTurnDisabled,
      {
        id:        'confirm-defense',
        label:     'Confirm Pick',
        variant:   'primary',
        iconRight: 'chevron-right',
      },
    ]
  }

  if (state.pendingBankSpend?.holder === viewerId) {
    return [
      skipTurnDisabled,
      { id: 'skip-spend',    label: 'Skip Spend',    variant: 'default' },
      { id: 'confirm-spend', label: 'Confirm Spend', variant: 'primary' },
    ]
  }

  if (state.pendingOffensiveChoice?.attacker === viewerId) {
    // Picker overlay handles the selection; bar is inactive.
    return [
      skipTurnDisabled,
      { id: 'pick-hint', label: 'Choose ability…', variant: 'disabled' },
    ]
  }

  if (activeOverlay === 'ability' || activeOverlay === 'card') {
    return [
      skipTurnDisabled,
      { id: 'inspection', label: 'Inspecting…', variant: 'disabled' },
    ]
  }

  if (resolutionActive) {
    return [
      skipTurnDisabled,
      { id: 'resolving', label: 'Resolving…', variant: 'disabled' },
    ]
  }

  if (!isViewerTurn) {
    return [
      skipTurnDisabled,
      {
        id:      'opponent-indicator',
        label:   `Opponent · ${labelForPhase(state.phase)}`,
        variant: 'disabled',
      },
    ]
  }

  // Viewer's turn — phase-based buttons.
  const rollsLeft = viewer.rollAttemptsRemaining
  const canRoll   = rollsLeft > 0
  void ROLL_ATTEMPTS_TOTAL

  const skipTurn: ActionButton = (state.phase === 'main-post' || state.phase === 'main-pre')
    ? { id: 'skip-turn', label: 'Skip Turn', variant: 'skip' }
    : { id: 'skip-turn', label: 'Skip Turn', variant: 'disabled' }

  if (state.phase === 'main-pre') {
    // Very first action of the turn — no dice yet.
    return [
      skipTurn,
      {
        id:      'roll',
        label:   'Roll',
        variant: 'primary',
      },
    ]
  }

  if (state.phase === 'offensive-roll') {
    // Player has rolled at least once. Show BOTH reroll (if attempts left)
    // and commit — commit is the primary path once any ability is eligible.
    const buttons: ActionButton[] = [skipTurn]
    if (canRoll) {
      buttons.push({
        id:      'roll',
        label:   'Reroll',
        variant: 'default',
        badge:   rollsLeft,
      })
    }
    buttons.push({
      id:        'commit',
      label:     'Fire',
      variant:   'primary',
      iconRight: 'chevron-right',
    })
    return buttons
  }

  if (state.phase === 'main-post') {
    return [
      skipTurn,
      { id: 'end-turn', label: 'End Turn', variant: 'primary', iconRight: 'chevron-right' },
    ]
  }

  return [skipTurnDisabled, { id: 'wait', label: 'Wait…', variant: 'disabled' }]
}

function labelForPhase(p: GameState['phase']): string {
  switch (p) {
    case 'upkeep':
    case 'income':
      return 'Upkeep'
    case 'main-pre':
    case 'offensive-roll':
      return 'Rolling'
    case 'defensive-roll':
      return 'Attacking'
    case 'main-post':
      return 'Planning'
    case 'discard':
      return 'Turn End'
    case 'pre-match':
      return 'Setup'
    case 'match-end':
      return 'Match End'
  }
}

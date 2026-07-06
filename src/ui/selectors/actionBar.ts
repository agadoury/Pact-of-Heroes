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

import type { GameState, HeroSnapshot, PlayerId } from '@/game/types'
import type { ActionButton } from '@/ui/types/action-bar'
import { getStatusDef } from '@/game/status'

export interface DeriveActionBarInput {
  state:         GameState | null
  viewerId:      PlayerId
  activeOverlay: string
  resolutionActive: boolean
  /** Name of the defense the viewer has highlighted (null = none yet). */
  selectedDefenseId?: string | null
  /** Two-tap skip protection: true once the first Skip tap armed it. */
  skipArmed?: boolean
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

  // Pending prompts take precedence over phase-based context. The bank
  // spend outranks the defense pick: during a defensive-resolution spend
  // BOTH pendingBankSpend and pendingAttack are set, and the engine is
  // waiting on the spend.
  if (state.pendingBankSpend?.holder === viewerId) {
    return [
      skipTurnDisabled,
      { id: 'skip-spend',    label: 'Skip Spend',    variant: 'default' },
      { id: 'confirm-spend', label: 'Confirm Spend', variant: 'primary' },
    ]
  }

  if (state.pendingAttack?.defender === viewerId) {
    const pa = state.pendingAttack
    const defendable = pa.damageType === 'normal' || pa.damageType === 'collateral'
    if (!defendable) {
      // Pure / undefendable / ultimate — no defense roll possible; the
      // only response is to brace (Instants can still be played from hand).
      return [
        skipTurnDisabled,
        { id: 'take-hit', label: 'Brace for Impact', variant: 'primary', iconRight: 'chevron-right' },
      ]
    }
    const hasSelection = !!input.selectedDefenseId
    return [
      { id: 'take-hit', label: 'Take Hit', variant: 'default' },
      {
        id:        'confirm-defense',
        label:     hasSelection ? 'Confirm Defense' : 'Pick a Defense',
        variant:   hasSelection ? 'primary' : 'disabled',
        iconRight: 'chevron-right',
      },
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
    ? { id: 'skip-turn', label: input.skipArmed ? 'Confirm Skip?' : 'Skip Turn', variant: 'skip' }
    : { id: 'skip-turn', label: 'Skip Turn', variant: 'disabled' }

  // §15.2 holder-paid status removal (Atone). Without a reachable button
  // a player bound at 3+ Verdict is locked out of card play with no
  // counterplay — the single most important contextual action to surface.
  const atone = deriveAtoneButton(viewer, state)

  if (state.phase === 'main-pre') {
    // Very first action of the turn — no dice yet.
    return [
      skipTurn,
      ...(atone ? [atone] : []),
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
      ...(atone ? [atone] : []),
      { id: 'end-turn', label: 'End Turn', variant: 'primary', iconRight: 'chevron-right' },
    ]
  }

  return [skipTurnDisabled, { id: 'wait', label: 'Wait…', variant: 'disabled' }]
}

/** First affordable holder-removal action on any of the viewer's statuses.
 *  Button id encodes the dispatch: `atone:<statusId>:<actionIndex>`. */
function deriveAtoneButton(viewer: HeroSnapshot, state: GameState): ActionButton | null {
  for (const inst of viewer.statuses) {
    const def = getStatusDef(inst.id)
    const actions = def?.holderRemovalActions
    if (!actions?.length) continue
    for (let i = 0; i < actions.length; i++) {
      const a = actions[i]!
      const phaseOk =
        a.phase === state.phase
        || (a.phase === 'main-phase' && (state.phase === 'main-pre' || state.phase === 'main-post'))
      if (!phaseOk) continue
      const onceKey = `__holderAction:${inst.id}:${i}`
      if (a.oncePerTurn && viewer.consumedOncePerTurnCards.includes(onceKey)) continue
      const affordable =
        a.cost.resource === 'cp'           ? viewer.cp >= a.cost.amount :
        a.cost.resource === 'hp'           ? viewer.hp >  a.cost.amount :
        a.cost.resource === 'discard-card' ? viewer.hand.length >= a.cost.amount :
        false
      const costLabel =
        a.cost.resource === 'cp' ? `${a.cost.amount} CP` :
        a.cost.resource === 'hp' ? `${a.cost.amount} HP` :
        `${a.cost.amount} card${a.cost.amount > 1 ? 's' : ''}`
      return {
        id:      `atone:${inst.id}:${i}`,
        label:   `${a.ui.actionName} · ${costLabel}`,
        variant: affordable ? 'default' : 'disabled',
      }
    }
  }
  return null
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

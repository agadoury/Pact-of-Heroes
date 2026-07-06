/**
 * Engine `Phase` → UI `PhaseDisplay` selector.
 *
 * The phase banner never reads engine phase directly; it renders whatever
 * PhaseDisplay is passed in. This selector is the mapping.
 *
 * Bible reference: Part 2.6.
 */

import type { GameState, PlayerId } from '@/game/types'
import type { PhaseDisplay } from '@/ui/types/phase'

const ROLL_ATTEMPTS_TOTAL = 3

export function derivePhaseDisplay(
  state: GameState | null,
  viewerId: PlayerId,
): PhaseDisplay {
  if (!state) return { kind: 'idle' }

  const active   = state.players[state.activePlayer]
  const isViewer = state.activePlayer === viewerId

  // Explicit prompt states (pending*) come first — they override the raw phase.
  if (state.pendingAttack && state.pendingAttack.defender === viewerId) {
    return { kind: 'defense' }
  }

  if (state.pendingAttack && state.pendingAttack.attacker === viewerId) {
    // Viewer's attack is in flight — the opponent is picking their defense.
    return { kind: 'resolving', abilityName: state.pendingAttack.abilityName, tone: 'gold' }
  }

  if (state.pendingBankSpend && state.pendingBankSpend.holder === viewerId) {
    return { kind: 'spend' }
  }

  if (state.pendingOffensiveChoice && state.pendingOffensiveChoice.attacker === viewerId) {
    return {
      kind:    'resolving',
      abilityName: 'Choose ability',
      tone:    'gold',
    }
  }

  const opponentName = state.players[state.activePlayer === 'p1' ? 'p2' : 'p1'].hero

  switch (state.phase) {
    case 'pre-match':
      return { kind: 'match-start', opponentName }

    case 'upkeep':
    case 'income':
      // Both roll into "upkeep" beat banners; the specific subvariant
      // (tick vs draw vs cp gain) is signalled by the UpkeepFOP itself. If
      // no upkeep FOP is playing, show a generic label.
      return isViewer
        ? { kind: 'upkeep-cp-gain' }
        : { kind: 'opponent-turn', heroName: active.hero, phase: 'Upkeep' }

    case 'main-pre':
    case 'offensive-roll': {
      const rollsLeft = active.rollAttemptsRemaining
      const current   = ROLL_ATTEMPTS_TOTAL - rollsLeft + 1
      if (isViewer) {
        return { kind: 'roll', current, total: ROLL_ATTEMPTS_TOTAL }
      }
      return {
        kind:     'opponent-turn',
        heroName: active.hero,
        phase:    `Roll · ${current} of ${ROLL_ATTEMPTS_TOTAL}`,
      }
    }

    case 'defensive-roll':
      return isViewer
        ? { kind: 'defense' }
        : { kind: 'opponent-turn', heroName: active.hero, phase: 'Attacking' }

    case 'main-post':
      return isViewer
        ? { kind: 'plan' }
        : { kind: 'opponent-turn', heroName: active.hero, phase: 'Planning' }

    case 'discard':
      return isViewer
        ? { kind: 'idle' }
        : { kind: 'opponent-turn', heroName: active.hero, phase: 'Turn End' }

    case 'match-end':
      return {
        kind:       'match-end',
        winnerName: state.winner === 'draw'
          ? 'Draw'
          : state.players[state.winner ?? 'p1'].hero,
      }
  }
}

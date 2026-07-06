/**
 * PhaseBanner display union.
 *
 * The engine's `Phase` (`pre-match | upkeep | income | main-pre | ...`) is
 * transformed into this UI-facing union by `selectors/phaseDisplay.ts`. The
 * banner never reads engine phase directly — it renders whatever
 * `PhaseDisplay` is passed to it.
 *
 * Bible reference: Part 2.6.
 */

import type { Tone } from './ui'

export type PhaseDisplay =
  | { kind: 'roll';                current: number; total: number }
  | { kind: 'plan' }
  | { kind: 'rolling' }
  | { kind: 'resolving';           abilityName: string; tone: Tone }
  | { kind: 'defense' }
  | { kind: 'spend' }
  | { kind: 'card';                cardName: string }
  | { kind: 'trigger';             triggerName: string }
  | { kind: 'upkeep-tick';         statusName: string; tone: Tone }
  | { kind: 'upkeep-draw' }
  | { kind: 'upkeep-cp-gain' }
  | { kind: 'upkeep-deck-shuffle' }
  | { kind: 'opponent-turn';       heroName: string; phase: string }
  | { kind: 'match-start';         opponentName: string }
  | { kind: 'match-end';           winnerName: string }
  | { kind: 'lethal';              abilityName: string }
  | { kind: 'idle' }

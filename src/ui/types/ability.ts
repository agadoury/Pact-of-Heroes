/**
 * UI-side ability shape.
 *
 * The engine's `AbilityDef` is dense (combo unions, effect trees, critical
 * conditions, offensiveFallback). Ladder rendering needs a leaner projection:
 * a name, a summary primary value, a combo pip vector, and eligibility state.
 * `LadderAbility` is that projection, built by `selectors/ladder.ts` from
 * `HeroSnapshot.activeOffense[i]` + `HeroSnapshot.ladderState[i]` + dice.
 *
 * Bible reference: Part 3.1.
 */

import type { AbilityId, EffectSegment } from './card'

/**
 * The badge value on the left of every ladder row.
 * Damage / heal / utility are the three discriminants; `damage` covers both
 * fixed and T1-scaling abilities (see `ScalingPreview`).
 */
export type AbilityValue =
  | { kind: 'damage';  amount: number }
  | { kind: 'heal';    amount: number }
  | { kind: 'utility'; glyph: UtilityGlyph }

/** UI-side glyph slot for non-numeric abilities. */
export type UtilityGlyph =
  | 'strip'    // remove-status
  | 'draw'     // draw
  | 'lock'     // set-die-face / force-face-value
  | 'cleanse'  // remove-status of debuffs on self
  | 'buff'     // apply-status self or persistent-buff
  | 'control'  // apply-status opponent (stun, etc.)

/** T1 scaling readout, only present for `scaling-damage` effects. */
export interface ScalingPreview {
  baseDamage:    number
  currentDamage: number
  maxDamage:     number
  maxedOut:      boolean
}

/**
 * Combo state for a single row.
 *
 * `status` derives from pip counts: 0 outlined → eligible, 1 outlined →
 * near-eligible, 2+ outlined → ineligible. See `selectors/ladder.ts`.
 */
export interface ComboState {
  status: 'eligible' | 'near-eligible' | 'ineligible'
  pips:   PipState[]
}

/**
 * Pip commitment level:
 *   pulse    — required token is on a LOCKED die (safe from rerolls)
 *   gold     — required token is on an UNLOCKED settled die (present but at risk)
 *   outlined — required token is absent from the tray
 *
 * Tumbling dice (uiStore-driven `isRolling` flag) are filtered out before
 * classification; their faces are provisional.
 */
export type PipState = 'pulse' | 'gold' | 'outlined'

/**
 * The full UI-side ability entry. `id` is derived by the selector (typically
 * the engine ability name) so React reconciliation works across re-renders.
 */
export interface LadderAbility {
  id:                AbilityId
  tier:              1 | 2 | 3 | 4
  name:              string
  effectText:        string          // one-line summary (Cormorant italic in the row)
  fullEffect:        EffectSegment[] // structured prose for the ExpandedAbilityView modal
  value:             AbilityValue
  combo:             ComboDescriptor
  comboState:        ComboState
  isUltimate:        boolean         // === tier === 4
  isUpgraded:        boolean         // a Mastery/buff modifies this slot — row shows the upgrade star
  isCritical:        boolean         // engine's criticalCondition met (rendered as critical eligible)
  willKill:          boolean         // UI-computed: preview damage >= opponent.hp
  scaling?:          ScalingPreview
  criticalPreview?:  CriticalPreview
}

/**
 * Descriptor for combo pip rendering. Mirrors the engine `DiceCombo` union
 * but flattened to what the pip strip needs — either an array of required
 * face symbols (for sigil combos) or a length + best-window numbers (for
 * straight combos) or a rich description (for compound / n-of-a-kind).
 */
export type ComboDescriptor =
  | { kind: 'sigil';       symbols: string[] }
  | { kind: 'straight';    length: number; numbers: number[] }
  | { kind: 'n-of-a-kind'; count: number }
  | { kind: 'compound';    op: 'and' | 'or'; clauses: ComboDescriptor[] }

/** Additional preview shown when a T4 ability has an engine `criticalCondition`. */
export interface CriticalPreview {
  label:  string   // e.g. "Critical: 5 ruin"
  damage: number   // enhanced damage output
  isMet:  boolean  // engine has `isCritical` from ability-triggered event
}

/**
 * Row eligibility state derivation — the LadderRowState → status map.
 * Engine's LadderRowState is: `firing | triggered | reachable | out-of-reach`.
 */
export function statusFromPipCount(outlinedCount: number): ComboState['status'] {
  if (outlinedCount === 0) return 'eligible'
  if (outlinedCount === 1) return 'near-eligible'
  return 'ineligible'
}

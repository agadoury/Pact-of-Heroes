/**
 * Derive an `AbilityValue` (badge readout) from an engine `AbilityEffect`.
 *
 * Rules:
 *   - Find the first top-level (or first sub-effect within `compound`) effect
 *     whose kind is `damage` or `scaling-damage` → damage badge
 *   - Else if a `heal` effect exists → heal badge with amount
 *   - Else classify by structural cue → utility glyph
 *
 * For scaling-damage the badge shows the CURRENT achievable damage given
 * locked dice. `computeScaling` handles the projection.
 *
 * Bible reference: Part 3.3.
 */

import type { AbilityEffect, DiceCombo, Die, SymbolId } from '@/game/types'
import type { AbilityValue, ScalingPreview, UtilityGlyph } from '@/ui/types/ability'
import { computeComboExtras } from '@/game/dice'

/** Walk into `compound` effects; every other effect is a leaf. */
function flatten(effect: AbilityEffect): AbilityEffect[] {
  if (effect.kind === 'compound') {
    return effect.effects.flatMap(flatten)
  }
  return [effect]
}

export interface DeriveValueInput {
  effect:            AbilityEffect
  dice:              readonly Die[]
  scalingSymbol?:    SymbolId       // symbol that scaling-damage scales on (from combo)
  /** The ability's (effective) combo — when provided the scaling preview
   *  uses the engine's own computeComboExtras for exact parity. */
  combo?:            DiceCombo
}

export interface DeriveValueResult {
  value:    AbilityValue
  scaling?: ScalingPreview
}

export function deriveAbilityValue({ effect, dice, scalingSymbol, combo }: DeriveValueInput): DeriveValueResult {
  const leaves = flatten(effect)

  // First: scaling-damage — needs the current-dice projection
  for (const leaf of leaves) {
    if (leaf.kind === 'scaling-damage') {
      const scaling = computeScaling(leaf, dice, scalingSymbol, combo)
      return {
        value:   { kind: 'damage', amount: scaling.currentDamage },
        scaling,
      }
    }
  }

  // Then: fixed damage
  for (const leaf of leaves) {
    if (leaf.kind === 'damage') {
      return { value: { kind: 'damage', amount: leaf.amount } }
    }
  }

  // Then: heal
  for (const leaf of leaves) {
    if (leaf.kind === 'heal') {
      return { value: { kind: 'heal', amount: leaf.amount } }
    }
  }

  // Then: utility classification by leaf structure
  for (const leaf of leaves) {
    const glyph = leafToUtilityGlyph(leaf)
    if (glyph) return { value: { kind: 'utility', glyph } }
  }

  // Fallback
  return { value: { kind: 'utility', glyph: 'buff' } }
}

function leafToUtilityGlyph(leaf: AbilityEffect): UtilityGlyph | null {
  switch (leaf.kind) {
    case 'remove-status':  return 'strip'
    case 'draw':           return 'draw'
    case 'set-die-face':   return 'lock'
    case 'force-face-value': return 'lock'
    case 'reroll-dice':    return 'lock'
    case 'apply-status':   return leaf.target === 'opponent' ? 'control' : 'buff'
    case 'persistent-buff':  return 'buff'
    case 'passive-counter-modifier': return 'buff'
    case 'gain-cp':        return 'buff'
    default:               return null
  }
}

/** Compute current / max scaling damage against the current dice —
 *  EXACTLY as the engine will (computeComboExtras over the shown faces,
 *  minus the combo's own minimum). The old locked-dice heuristic showed
 *  8 for hits that dealt 4 and 4 for hits that dealt 8. */
function computeScaling(
  leaf: Extract<AbilityEffect, { kind: 'scaling-damage' }>,
  dice: readonly Die[],
  scalingSymbol: SymbolId | undefined,
  combo: DiceCombo | undefined,
): ScalingPreview {
  const { baseAmount, perExtra, maxExtra } = leaf

  if (combo) {
    const faces = dice.map(d => d.faces[d.current]!)
    const extras = Math.min(computeComboExtras(combo, faces), maxExtra)
    return {
      baseDamage:    baseAmount,
      currentDamage: baseAmount + extras * perExtra,
      maxDamage:     baseAmount + maxExtra * perExtra,
      maxedOut:      extras === maxExtra,
    }
  }

  // No combo available (legacy callers) — conservative base-only preview.
  void scalingSymbol
  return {
    baseDamage:    baseAmount,
    currentDamage: baseAmount,
    maxDamage:     baseAmount + maxExtra * perExtra,
    maxedOut:      maxExtra === 0,
  }
}

/**
 * Ladder selector — engine `HeroSnapshot` → UI `LadderAbility[]`.
 *
 * For each row in the active offensive ladder, this selector produces the
 * data the AbilityRow needs to render:
 *
 *   - name, tier, effect prose
 *   - combo state derived from current dice (pip vector + status)
 *   - value badge (damage, heal, utility)
 *   - scaling preview for T1 scaling-damage abilities
 *   - willKill preview vs. the defender's HP
 *   - criticalPreview when the ability has a criticalCondition
 *
 * Bible reference: Part 3.1.
 */

import type {
  AbilityDef,
  DiceCombo,
  HeroSnapshot,
  PlayerId,
  SymbolId,
} from '@/game/types'
import { ROLL_ATTEMPTS } from '@/game/types'
import type { LadderAbility, CriticalPreview } from '@/ui/types/ability'
import type { AbilityId, EffectSegment } from '@/ui/types/card'
import { deriveAbilityValue } from './abilityValue'
import { derivePips, type UiDie } from './derivePips'
import { parseEffectText } from '@/ui/util/parseEffect'

export interface DeriveLadderInput {
  self:         HeroSnapshot
  opponent:     HeroSnapshot
  dice:         readonly UiDie[]
  viewerId:     PlayerId
}

export function deriveLadder({ self, opponent, dice }: DeriveLadderInput): LadderAbility[] {
  // Resting dice (no roll yet this turn) all show face 0 — five identical
  // symbols that would light half the ladder "eligible". The engine
  // refuses to fire off un-rolled dice, so the UI must not advertise it:
  // before the first roll every row renders as not-yet-met.
  const hasRolled =
    self.rollAttemptsRemaining < ROLL_ATTEMPTS || self.forcedFaceValue != null
  const effectiveDice: readonly UiDie[] = hasRolled
    ? dice
    : dice.map(d => ({ ...d, isRolling: true }))   // rolling dice are excluded from pip matching

  return self.activeOffense.map((abil, idx) =>
    deriveAbilityRow(abil, idx, self, opponent, effectiveDice),
  )
}

function deriveAbilityRow(
  ability:  AbilityDef,
  ladderIndex: number,
  self:     HeroSnapshot,
  opponent: HeroSnapshot,
  dice:     readonly UiDie[],
): LadderAbility {
  const { descriptor, combo: comboState } = derivePips(ability.combo, dice)

  const scalingSymbol = extractScalingSymbol(ability.combo)
  const { value, scaling } = deriveAbilityValue({
    effect: ability.effect,
    dice:   dice.map(uiDieToEngineDie),
    scalingSymbol,
  })

  const willKill = value.kind === 'damage' && opponent.hp > 0 && value.amount >= opponent.hp

  const critPreview: CriticalPreview | undefined =
    ability.criticalCondition && ability.criticalEffect
      ? {
          label:  criticalLabel(ability.criticalCondition),
          damage: criticalDamage(ability, value),
          isMet:  self.ladderState[ladderIndex]?.kind === 'firing' ||
                  self.ladderState[ladderIndex]?.kind === 'triggered',
        }
      : undefined

  const fullEffect: EffectSegment[] = parseEffectText(ability.longText || ability.shortText)

  return {
    id:              ability.name as AbilityId,
    tier:            ability.tier,
    name:            ability.name,
    effectText:      ability.shortText,
    fullEffect,
    value,
    combo:           descriptor,
    comboState,
    isUltimate:      ability.tier === 4,
    isCritical:      critPreview?.isMet === true,
    willKill,
    scaling,
    criticalPreview: critPreview,
  }
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function extractScalingSymbol(combo: DiceCombo): SymbolId | undefined {
  switch (combo.kind) {
    case 'symbol-count':
    case 'at-least':
    case 'matching':
      return combo.symbol
    case 'compound':
      // Prefer the first symbol-count clause when compound.
      for (const c of combo.clauses) {
        const s = extractScalingSymbol(c)
        if (s) return s
      }
      return undefined
    default:
      return undefined
  }
}

function criticalLabel(combo: DiceCombo): string {
  switch (combo.kind) {
    case 'symbol-count':
    case 'at-least':
    case 'matching':
      return `Critical: ${combo.count} ${combo.symbol.split(':').pop()}`
    case 'n-of-a-kind':
      return `Critical: ${combo.count} of a kind`
    case 'straight':
      return `Critical: straight ${combo.length}`
    case 'compound':
      return `Critical`
    default:
      return `Critical`
  }
}

function criticalDamage(
  ability: AbilityDef,
  base:    { kind: string; amount?: number },
): number {
  if (!ability.criticalEffect) return base.kind === 'damage' ? (base.amount ?? 0) : 0
  const { damageOverride, damageMultiplier } = ability.criticalEffect
  const baseAmount = base.kind === 'damage' ? (base.amount ?? 0) : 0
  if (damageOverride != null) return damageOverride
  if (damageMultiplier != null) return Math.round(baseAmount * damageMultiplier)
  return baseAmount
}

/**
 * Convert a UiDie back into the engine Die shape so `deriveAbilityValue`'s
 * `dice` argument matches the engine type. Cheap and safe — the UiDie
 * shape is a strict superset of Die.
 */
function uiDieToEngineDie(d: UiDie): {
  index:   0 | 1 | 2 | 3 | 4
  faces:   UiDie['faces']
  current: number
  locked:  boolean
} {
  return { index: d.index, faces: d.faces, current: d.current, locked: d.locked }
}

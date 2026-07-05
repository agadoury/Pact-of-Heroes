/**
 * Card visual style derivation — engine Card → UI-only display category.
 *
 * The bible's `category: 'attack'|'defense'|'buff'|'utility'` doesn't exist
 * in the engine. This selector reconstructs it from the card's effect tree
 * so the HandCard illustration slot can pick the right color + glyph.
 *
 * Bible reference: Part 2.9.3 illustration coloring table.
 */

import type { AbilityEffect, Card } from '@/game/types'
import type { CardVisualStyle } from '@/ui/types/card'

export function deriveCardVisualStyle(card: Card): CardVisualStyle {
  return classifyEffect(card.effect)
}

function classifyEffect(effect: AbilityEffect): CardVisualStyle {
  switch (effect.kind) {
    case 'damage':
    case 'scaling-damage':
    case 'bonus-dice-damage':
      return 'attack'

    case 'reduce-damage':
      return 'defense'

    case 'heal':
      return 'buff'

    case 'apply-status':
      return effect.target === 'opponent' ? 'attack' : 'buff'

    case 'remove-status':
      return effect.target === 'self' ? 'buff' : 'utility'

    case 'set-die-face':
    case 'reroll-dice':
    case 'force-face-value':
    case 'face-symbol-bend':
    case 'combo-override':
      return 'utility'

    case 'gain-cp':
    case 'draw':
    case 'passive-counter-modifier':
      return 'utility'

    case 'ability-upgrade':
    case 'persistent-buff':
      return 'buff'

    case 'compound': {
      // Take the first non-utility classification from a sub-effect;
      // fall back to utility.
      let firstUtility: CardVisualStyle = 'utility'
      for (const sub of effect.effects) {
        const c = classifyEffect(sub)
        if (c !== 'utility') return c
        firstUtility = c
      }
      return firstUtility
    }

    default:
      return 'utility'
  }
}

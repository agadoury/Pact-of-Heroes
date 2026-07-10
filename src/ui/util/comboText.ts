/**
 * Plain-language combo text — the bridge between dice sigils and words.
 *
 * New players can't yet read the sigil strips, so anywhere a combo gates
 * an action we also say it in words: "3+ Axes", "4 of a kind", and the
 * live distance "1 more Axe" while rolling.
 *
 * Bible reference: Part 3.7 (clarity pass).
 */

import type { DiceCombo } from '@/game/types'
import type { ComboDescriptor, ComboState } from '@/ui/types/ability'

/** "berserker:axe" → "Axe". */
export function symbolWord(symbol: string): string {
  const bare = symbol.includes(':') ? symbol.split(':').pop()! : symbol
  return bare.charAt(0).toUpperCase() + bare.slice(1)
}

function plural(word: string, n: number): string {
  return n === 1 ? word : `${word}s`
}

/** Full requirement in words, e.g. "3+ Axes", "Straight of 4". */
export function comboPlainText(combo: DiceCombo): string {
  switch (combo.kind) {
    case 'symbol-count':
    case 'at-least':
    case 'matching':
      return `${combo.count}+ ${plural(symbolWord(combo.symbol), combo.count)}`
    case 'n-of-a-kind':
      return `${combo.count} of a kind`
    case 'straight':
      return `Straight of ${combo.length}`
    case 'compound':
      return combo.clauses.map(comboPlainText).join(combo.op === 'and' ? ' + ' : ' or ')
    default:
      return ''
  }
}

/**
 * Live distance to completion, e.g. "1 more Axe" — read straight off the
 * pip vector (outlined = missing from the tray). Null once met.
 */
export function comboNeedText(descriptor: ComboDescriptor, state: ComboState): string | null {
  const missing = state.pips.filter(p => p === 'outlined').length
  if (missing <= 0) return null
  if (descriptor.kind === 'sigil') {
    const missingSymbols = descriptor.symbols.filter((_, i) => state.pips[i] === 'outlined')
    const first = missingSymbols[0]
    if (first && missingSymbols.every(sym => sym === first)) {
      return `${missing} more ${plural(symbolWord(first), missing)}`
    }
    return `${missing} more needed`
  }
  if (descriptor.kind === 'n-of-a-kind') return `${missing} more matching`
  if (descriptor.kind === 'straight')    return `${missing} more in a row`
  return `${missing} more needed`
}

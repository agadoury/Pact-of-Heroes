/**
 * Pip state derivation.
 *
 * Given an engine `DiceCombo` and a hero's current dice, compute one
 * `PipState` per required slot (pulse / gold / outlined) plus a display
 * descriptor for the pip strip.
 *
 * Handles the four canonical engine combo kinds:
 *   symbol-count  → count required sigils
 *   n-of-a-kind   → any face-value repeated N times
 *   straight      → N consecutive numbers
 *   compound      → and/or over sub-combos
 *
 * Tumbling dice (uiStore-driven `isRolling` flag) are filtered out before
 * classification — a die in mid-tumble contributes nothing.
 *
 * Bible reference: Part 3.4.
 */

import type { Die, DiceCombo, SymbolId } from '@/game/types'
import type { ComboDescriptor, ComboState, PipState } from '@/ui/types/ability'

/** Input to derivation — engine Die + a UI flag for whether it's tumbling. */
export interface UiDie {
  index:     0 | 1 | 2 | 3 | 4
  faces:     readonly { faceValue: 1 | 2 | 3 | 4 | 5 | 6; symbol: SymbolId; label: string }[]
  current:   number
  locked:    boolean
  isRolling: boolean
}

/** Convert an engine Die + a UI-side isRolling map into a UiDie array. */
export function withRollingFlag(
  dice: readonly Die[],
  isRollingByIndex: Readonly<Record<number, boolean>>,
): UiDie[] {
  return dice.map(d => ({
    index:     d.index,
    faces:     d.faces,
    current:   d.current,
    locked:    d.locked,
    isRolling: isRollingByIndex[d.index] === true,
  }))
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface DerivationResult {
  descriptor: ComboDescriptor
  combo:      ComboState
}

/**
 * Derive pips and status for a given combo against the current dice.
 * The returned `descriptor` tells the pip strip what to render on each pip
 * (a sigil, a number, or nothing for n-of-a-kind).
 */
export function derivePips(combo: DiceCombo, dice: readonly UiDie[]): DerivationResult {
  // Settled dice are the only ones that contribute — tumbling dice are in flux.
  const settled = dice.filter(d => !d.isRolling)

  switch (combo.kind) {
    case 'symbol-count':
    case 'at-least':
    case 'matching':
      return deriveSymbolCount(combo.symbol, combo.count, settled)

    case 'n-of-a-kind':
    case 'matching-any':
      return deriveNOfAKind(combo.count, settled)

    case 'straight':
      return deriveStraight(combo.length, settled)

    case 'compound':
      return deriveCompound(combo.op, combo.clauses, settled)

    case 'specific-set':
    case 'any-of':
    default:
      // Fallback: render one outlined pip per required item.
      return {
        descriptor: { kind: 'sigil', symbols: [] },
        combo:      { status: 'ineligible', pips: [] },
      }
  }
}

// ---------------------------------------------------------------------------
// symbol-count
// ---------------------------------------------------------------------------

function deriveSymbolCount(
  symbol: SymbolId,
  count: number,
  settled: readonly UiDie[],
): DerivationResult {
  const symbols = new Array(count).fill(symbol) as SymbolId[]

  // Bin dice by lock status, restricted to those showing the required symbol.
  const lockedShowingSymbol   = settled.filter(d => d.locked  && d.faces[d.current]!.symbol === symbol).length
  const unlockedShowingSymbol = settled.filter(d => !d.locked && d.faces[d.current]!.symbol === symbol).length

  const pips: PipState[] = []
  let lockedRemaining   = lockedShowingSymbol
  let unlockedRemaining = unlockedShowingSymbol

  for (let i = 0; i < count; i++) {
    if (lockedRemaining > 0)   { pips.push('pulse');    lockedRemaining--   }
    else if (unlockedRemaining > 0) { pips.push('gold'); unlockedRemaining-- }
    else                        { pips.push('outlined') }
  }

  return {
    descriptor: { kind: 'sigil', symbols },
    combo:      { status: statusFromPips(pips), pips },
  }
}

// ---------------------------------------------------------------------------
// n-of-a-kind
// ---------------------------------------------------------------------------

function deriveNOfAKind(count: number, settled: readonly UiDie[]): DerivationResult {
  // For each candidate face value 1–6, count how many settled dice show it
  // in locked and unlocked pools. Pick the best window: highest (pulse,
  // -outlined, faceValue) score.
  let best: { faceValue: number; pips: PipState[] } = { faceValue: 1, pips: makeOutlined(count) }
  let bestScore: [number, number, number] = [-1, 0, 0]

  for (let face = 1 as 1 | 2 | 3 | 4 | 5 | 6; face <= 6; face = (face + 1) as 1 | 2 | 3 | 4 | 5 | 6) {
    const locked   = settled.filter(d => d.locked  && d.faces[d.current]!.faceValue === face).length
    const unlocked = settled.filter(d => !d.locked && d.faces[d.current]!.faceValue === face).length
    const pips: PipState[] = []
    let rem = { locked, unlocked }
    for (let i = 0; i < count; i++) {
      if (rem.locked > 0)   { pips.push('pulse');    rem.locked--   }
      else if (rem.unlocked > 0) { pips.push('gold'); rem.unlocked-- }
      else                       { pips.push('outlined') }
    }
    const pulseCount    = pips.filter(p => p === 'pulse').length
    const outlinedCount = pips.filter(p => p === 'outlined').length
    const score: [number, number, number] = [pulseCount, -outlinedCount, -face]
    if (compareLex(score, bestScore) > 0) {
      best = { faceValue: face, pips }
      bestScore = score
    }
  }

  return {
    descriptor: { kind: 'n-of-a-kind', count },
    combo:      { status: statusFromPips(best.pips), pips: best.pips },
  }
}

// ---------------------------------------------------------------------------
// straight
// ---------------------------------------------------------------------------

function deriveStraight(length: number, settled: readonly UiDie[]): DerivationResult {
  // Search every N-length window in [1..7-N], keeping the highest-scoring one.
  let bestWindow: number[] = Array.from({ length }, (_, i) => i + 1)
  let bestPips: PipState[] = makeOutlined(length)
  let bestScore: [number, number, number] = [-1, 0, 0]

  const upperStart = Math.max(1, 7 - length)
  for (let s = 1; s <= upperStart; s++) {
    const window = Array.from({ length }, (_, i) => s + i)
    const lockedCounts   = countByFaceValue(settled.filter(d => d.locked))
    const unlockedCounts = countByFaceValue(settled.filter(d => !d.locked))
    const pips: PipState[] = []
    for (const num of window) {
      if ((lockedCounts[num] ?? 0) > 0)   { pips.push('pulse');   lockedCounts[num]!-- }
      else if ((unlockedCounts[num] ?? 0) > 0) { pips.push('gold'); unlockedCounts[num]!-- }
      else                                { pips.push('outlined') }
    }
    const pulseCount    = pips.filter(p => p === 'pulse').length
    const outlinedCount = pips.filter(p => p === 'outlined').length
    const score: [number, number, number] = [pulseCount, -outlinedCount, -s]
    if (compareLex(score, bestScore) > 0) {
      bestWindow = window
      bestPips   = pips
      bestScore  = score
    }
  }

  return {
    descriptor: { kind: 'straight', length, numbers: bestWindow },
    combo:      { status: statusFromPips(bestPips), pips: bestPips },
  }
}

// ---------------------------------------------------------------------------
// compound (and / or)
// ---------------------------------------------------------------------------

function deriveCompound(
  op: 'and' | 'or',
  clauses: readonly DiceCombo[],
  settled: readonly UiDie[],
): DerivationResult {
  const perClause = clauses.map(c => derivePips(c, settled))
  const descriptor: ComboDescriptor = {
    kind:    'compound',
    op,
    clauses: perClause.map(r => r.descriptor),
  }

  // Flatten pips: `and` concatenates all clauses; `or` shows the best clause.
  if (op === 'and') {
    const pips = perClause.flatMap(r => r.combo.pips)
    return { descriptor, combo: { status: statusFromPips(pips), pips } }
  }
  // 'or' — winning clause is the one with fewest outlined pips.
  let best = perClause[0]!
  for (const r of perClause) {
    if (r.combo.pips.filter(p => p === 'outlined').length <
        best.combo.pips.filter(p => p === 'outlined').length) {
      best = r
    }
  }
  return { descriptor, combo: best.combo }
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function makeOutlined(count: number): PipState[] {
  return Array.from({ length: count }, () => 'outlined')
}

function countByFaceValue(dice: readonly UiDie[]): Record<number, number> {
  const acc: Record<number, number> = {}
  for (const d of dice) {
    const fv = d.faces[d.current]!.faceValue
    acc[fv] = (acc[fv] ?? 0) + 1
  }
  return acc
}

function compareLex(a: readonly number[], b: readonly number[]): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i]! !== b[i]!) return a[i]! > b[i]! ? 1 : -1
  }
  return 0
}

function statusFromPips(pips: readonly PipState[]): ComboState['status'] {
  const outlined = pips.filter(p => p === 'outlined').length
  if (outlined === 0) return 'eligible'
  if (outlined === 1) return 'near-eligible'
  return 'ineligible'
}

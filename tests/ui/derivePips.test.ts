import { describe, expect, it } from 'vitest'
import { derivePips, type UiDie } from '@/ui/selectors/derivePips'
import type { DiceCombo, DieFace, SymbolId } from '@/game/types'

// Test helper — build a UiDie showing a specific symbol at a specific
// face value. Faces array is stubbed with the current-face repeated;
// only current index matters for pip derivation.
function mkDie(
  index: 0|1|2|3|4,
  symbol: SymbolId,
  faceValue: 1|2|3|4|5|6,
  locked: boolean = false,
  isRolling: boolean = false,
): UiDie {
  const face: DieFace = { symbol, faceValue, label: symbol }
  return { index, faces: [face, face, face, face, face, face], current: 0, locked, isRolling }
}

describe('derivePips — symbol-count', () => {
  const combo: DiceCombo = { kind: 'symbol-count', symbol: 'berserker:axe' as SymbolId, count: 3 }

  it('all-outlined when no dice contribute', () => {
    const dice = [
      mkDie(0, 'berserker:fur' as SymbolId, 4),
      mkDie(1, 'berserker:fur' as SymbolId, 5),
    ]
    const r = derivePips(combo, dice)
    expect(r.combo.pips).toEqual(['outlined', 'outlined', 'outlined'])
    expect(r.combo.status).toBe('ineligible')
  })

  it('all-pulse when three locked axes present', () => {
    const dice = [
      mkDie(0, 'berserker:axe' as SymbolId, 1, true),
      mkDie(1, 'berserker:axe' as SymbolId, 2, true),
      mkDie(2, 'berserker:axe' as SymbolId, 3, true),
    ]
    const r = derivePips(combo, dice)
    expect(r.combo.pips).toEqual(['pulse', 'pulse', 'pulse'])
    expect(r.combo.status).toBe('eligible')
  })

  it('mixed gold and pulse when two locked + one unlocked axe', () => {
    const dice = [
      mkDie(0, 'berserker:axe' as SymbolId, 1, true),
      mkDie(1, 'berserker:axe' as SymbolId, 2, true),
      mkDie(2, 'berserker:axe' as SymbolId, 3, false),
    ]
    const r = derivePips(combo, dice)
    // Two pulses first, then one gold (matches bible: pulse consumes before gold).
    expect(r.combo.pips.sort()).toEqual(['gold', 'pulse', 'pulse'])
    expect(r.combo.status).toBe('eligible')
  })

  it('tumbling dice do not contribute', () => {
    const dice = [
      mkDie(0, 'berserker:axe' as SymbolId, 1, true, false),   // contributes
      mkDie(1, 'berserker:axe' as SymbolId, 2, true, true),    // tumbling — dropped
      mkDie(2, 'berserker:axe' as SymbolId, 3, false, true),   // tumbling — dropped
    ]
    const r = derivePips(combo, dice)
    expect(r.combo.pips).toEqual(['pulse', 'outlined', 'outlined'])
    expect(r.combo.status).toBe('ineligible')
  })

  it('near-eligible when exactly one outlined pip', () => {
    const dice = [
      mkDie(0, 'berserker:axe' as SymbolId, 1, true),
      mkDie(1, 'berserker:axe' as SymbolId, 2, true),
    ]
    const r = derivePips(combo, dice)
    expect(r.combo.pips.filter(p => p === 'outlined').length).toBe(1)
    expect(r.combo.status).toBe('near-eligible')
  })
})

describe('derivePips — straight', () => {
  const combo: DiceCombo = { kind: 'straight', length: 4 }

  it('picks the best-scoring window', () => {
    // Locked 1,2,3,4 — the 1-2-3-4 window is fully-pulse
    const dice = [
      mkDie(0, 'x' as SymbolId, 1, true),
      mkDie(1, 'x' as SymbolId, 2, true),
      mkDie(2, 'x' as SymbolId, 3, true),
      mkDie(3, 'x' as SymbolId, 4, true),
    ]
    const r = derivePips(combo, dice)
    expect(r.combo.pips).toEqual(['pulse', 'pulse', 'pulse', 'pulse'])
    expect(r.combo.status).toBe('eligible')
    if (r.descriptor.kind === 'straight') {
      expect(r.descriptor.numbers).toEqual([1, 2, 3, 4])
    }
  })

  it('shows the closest window even without a full straight', () => {
    const dice = [
      mkDie(0, 'x' as SymbolId, 4, true),
      mkDie(1, 'x' as SymbolId, 5, true),
      mkDie(2, 'x' as SymbolId, 6, true),
    ]
    const r = derivePips(combo, dice)
    // 3-4-5-6 has 3 pulses + 1 outlined ('3') → near-eligible
    expect(r.combo.status).toBe('near-eligible')
    if (r.descriptor.kind === 'straight') {
      expect(r.descriptor.numbers).toEqual([3, 4, 5, 6])
    }
  })

  it('all-outlined when no contribution', () => {
    const r = derivePips(combo, [])
    expect(r.combo.pips).toEqual(['outlined', 'outlined', 'outlined', 'outlined'])
    expect(r.combo.status).toBe('ineligible')
  })
})

describe('derivePips — n-of-a-kind', () => {
  const combo: DiceCombo = { kind: 'n-of-a-kind', count: 3 }

  it('all-pulse when three of the same value locked', () => {
    const dice = [
      mkDie(0, 'x' as SymbolId, 2, true),
      mkDie(1, 'y' as SymbolId, 2, true),
      mkDie(2, 'z' as SymbolId, 2, true),
    ]
    const r = derivePips(combo, dice)
    expect(r.combo.pips).toEqual(['pulse', 'pulse', 'pulse'])
    expect(r.combo.status).toBe('eligible')
  })

  it('outlined when three different values', () => {
    const dice = [
      mkDie(0, 'x' as SymbolId, 1, true),
      mkDie(1, 'y' as SymbolId, 2, true),
      mkDie(2, 'z' as SymbolId, 3, true),
    ]
    const r = derivePips(combo, dice)
    // Best window is one locked (score 1) + two outlined
    expect(r.combo.pips.filter(p => p === 'pulse').length).toBe(1)
    expect(r.combo.pips.filter(p => p === 'outlined').length).toBe(2)
    expect(r.combo.status).toBe('ineligible')
  })
})

describe('derivePips — compound and', () => {
  const combo: DiceCombo = {
    kind: 'compound',
    op:   'and',
    clauses: [
      { kind: 'symbol-count', symbol: 'a' as SymbolId, count: 2 },
      { kind: 'symbol-count', symbol: 'b' as SymbolId, count: 1 },
    ],
  }

  it('concatenates clause pips', () => {
    const dice = [
      mkDie(0, 'a' as SymbolId, 1, true),
      mkDie(1, 'a' as SymbolId, 2, true),
      mkDie(2, 'b' as SymbolId, 3, true),
    ]
    const r = derivePips(combo, dice)
    expect(r.combo.pips.length).toBe(3)
    expect(r.combo.pips.every(p => p === 'pulse')).toBe(true)
    expect(r.combo.status).toBe('eligible')
  })
})

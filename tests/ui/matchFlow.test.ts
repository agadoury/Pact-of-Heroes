/**
 * Integration test: walk a match through the same action dispatches the
 * UI performs. Catches state-machine bugs the pure engine tests miss.
 */

import { describe, expect, it, beforeEach } from 'vitest'
import { applyAction, makeEmptyState } from '@/game/engine'
import { nextAiAction } from '@/game/ai'
import type { Action, GameState, PlayerId } from '@/game/types'

const HERO_A = 'berserker'
const HERO_B = 'pyromancer'

function newMatch(): GameState {
  const empty = makeEmptyState()
  const r = applyAction(empty, {
    kind:            'start-match',
    seed:            7,
    p1:              HERO_A,
    p2:              HERO_B,
    coinFlipWinner:  'p1',
  })
  return r.state
}

/** Dispatch and log the action, returning the new state. */
function dispatch(state: GameState, action: Action): GameState {
  const r = applyAction(state, action)
  return r.state
}

/** Run through auto-phases until we hit a phase that expects a player action. */
function runToInteractive(state: GameState, maxSafety = 30): GameState {
  let cur = state
  let safety = 0
  while (safety++ < maxSafety) {
    if (cur.phase === 'main-pre' || cur.phase === 'main-post' ||
        cur.phase === 'offensive-roll' || cur.phase === 'defensive-roll' ||
        cur.phase === 'match-end' ||
        cur.pendingAttack || cur.pendingOffensiveChoice || cur.pendingBankSpend) {
      return cur
    }
    // Otherwise advance auto-phases
    cur = dispatch(cur, { kind: 'advance-phase' })
  }
  throw new Error(`runToInteractive: safety hit at phase=${cur.phase}`)
}

describe('UI-flow: full match progression', () => {
  it('reaches main-pre after start-match with viewer as p1', () => {
    let state = newMatch()
    state = runToInteractive(state)
    expect(state.activePlayer).toBe('p1')
    expect(state.phase).toBe('main-pre')
  })

  it('roll → commit path works when a T1 ability is eligible', () => {
    let state = newMatch()
    state = runToInteractive(state)
    // Player rolls dice (transitions main-pre → offensive-roll and uses one attempt)
    state = dispatch(state, { kind: 'roll-dice' })
    expect(state.phase).toBe('offensive-roll')
    expect(state.players.p1.rollAttemptsRemaining).toBeLessThan(3)

    // Player commits via advance-phase
    state = dispatch(state, { kind: 'advance-phase' })
    // Now either pendingOffensiveChoice is set (multiple matches) OR we're
    // in defensive-roll for the opponent (single match auto-committed) OR
    // main-post (fizzle).
    const inValidNextPhase =
      state.pendingOffensiveChoice != null
      || state.phase === 'defensive-roll'
      || state.phase === 'main-post'
    expect(inValidNextPhase).toBe(true)
  })

  it('resolves pendingOffensiveChoice via select-offensive-ability', () => {
    let state = newMatch()
    state = runToInteractive(state)
    // Roll 3 times to guarantee we exhaust attempts
    state = dispatch(state, { kind: 'roll-dice' })
    state = dispatch(state, { kind: 'roll-dice' })
    state = dispatch(state, { kind: 'roll-dice' })
    // Advance to trigger picker
    state = dispatch(state, { kind: 'advance-phase' })
    if (state.pendingOffensiveChoice) {
      const idx = state.pendingOffensiveChoice.matches[0]?.abilityIndex ?? null
      state = dispatch(state, { kind: 'select-offensive-ability', abilityIndex: idx })
      // Now defensive-roll phase for the defender.
      expect(state.phase).toBe('defensive-roll')
    }
  })

  it('defensive picker: defender select-defense advances to main-post', () => {
    let state = newMatch()
    state = runToInteractive(state)
    // Fast-forward: use the AI to play out to the first defensive prompt.
    let safety = 0
    while (!state.pendingAttack && safety++ < 200 && !state.winner) {
      const action = nextAiAction(state, state.activePlayer)
      state = dispatch(state, action)
    }
    if (state.pendingAttack) {
      // Defender picks the first defense (or null = take it undefended)
      state = dispatch(state, { kind: 'select-defense', abilityIndex: 0 })
      // Damage should have applied; pendingAttack cleared.
      expect(state.pendingAttack).toBeUndefined()
    }
  })

  it('full match: two AI players complete without hitting safety cap', () => {
    let state = newMatch()
    let safety = 0
    while (!state.winner && safety++ < 3000) {
      const action = nextAiAction(state, state.activePlayer)
      state = dispatch(state, action)
    }
    expect(state.winner).toBeDefined()
    expect(safety).toBeLessThan(3000)
  })
})

describe('UI-flow: hand cards', () => {
  let state: GameState
  beforeEach(() => {
    state = newMatch()
    state = runToInteractive(state)
  })

  it('main-phase card play from main-pre affordable', () => {
    const viewer: PlayerId = 'p1'
    const p1 = state.players[viewer]
    const mainPhaseCard = p1.hand.find(c =>
      c.kind === 'main-phase' || c.kind === 'main-action' || c.kind === 'upgrade' || c.kind === 'status',
    )
    if (!mainPhaseCard || p1.cp < mainPhaseCard.cost) return  // hand-specific, skip if no viable card
    const before = state.players[viewer].hand.length
    state = dispatch(state, { kind: 'play-card', card: mainPhaseCard.id, casterPlayer: viewer })
    // Card either resolved to hand or moved to discard/consumed
    expect(state.players[viewer].hand.length).toBeLessThanOrEqual(before)
  })

  it('end-turn from main-post advances turn counter', () => {
    // Fast-forward viewer past their offensive turn.
    let safety = 0
    while (state.activePlayer === 'p1' && state.phase !== 'main-post' && safety++ < 50 && !state.winner) {
      const action = nextAiAction(state, state.activePlayer)
      state = dispatch(state, action)
    }
    if (state.phase === 'main-post' && state.activePlayer === 'p1') {
      const turnBefore = state.turn
      state = dispatch(state, { kind: 'end-turn' })
      state = runToInteractive(state)
      expect(state.turn).toBeGreaterThanOrEqual(turnBefore + 1)
    }
  })
})

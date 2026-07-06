import { describe, expect, it } from 'vitest'
import {
  aggregateEvents,
  initialAggregatorState,
} from '@/ui/selectors/fopAggregator'
import type { GameEvent } from '@/game/types'

describe('fopAggregator', () => {
  it('yields nothing for an empty batch', () => {
    const r = aggregateEvents(initialAggregatorState, [])
    expect(r.emitted).toEqual([])
    expect(r.state).toBe(initialAggregatorState)
  })

  it('opens a pending buffer on ability-triggered and closes it on damage-dealt (single batch)', () => {
    const events: GameEvent[] = [
      { t: 'ability-triggered', player: 'p1', tier: 2, abilityName: 'Sun Strike', isCritical: false },
      { t: 'attack-intended',   attacker: 'p1', defender: 'p2', abilityName: 'Sun Strike', tier: 2, damageType: 'undefendable', incomingAmount: 5, defendable: false },
      { t: 'defense-resolved',  player: 'p2', reduction: 0, landed: false },
      { t: 'damage-dealt',      from: 'p1', to: 'p2', amount: 5, type: 'undefendable', mitigated: 0 },
      { t: 'status-applied',    status: 'lightbearer:verdict', holder: 'p2', applier: 'p1', stacks: 1, total: 1 },
      { t: 'hp-changed',        player: 'p2', delta: -5, total: 25 },
      { t: 'phase-changed',     player: 'p1', from: 'offensive-roll', to: 'defensive-roll' },
    ]
    // The phase-changed event is the terminal marker that flushes the buffer.
    const r = aggregateEvents(initialAggregatorState, events)
    expect(r.emitted.length).toBe(1)
    const scene = r.emitted[0]!
    expect(scene.kind).toBe('ability')
    if (scene.kind === 'ability') {
      expect(scene.data.abilityName).toBe('Sun Strike')
      expect(scene.data.tier).toBe(2)
      expect(scene.data.damage).toBe(5)
      expect(scene.data.effects.length).toBeGreaterThanOrEqual(2)
      expect(scene.data.attacker).toBe('p1')
      expect(scene.data.defender).toBe('p2')
    }
    expect(r.state.pending).toBeNull()
  })

  it('carries a pending buffer across batches (attacker commit → defender picks)', () => {
    const batch1: GameEvent[] = [
      { t: 'ability-triggered', player: 'p1', tier: 3, abilityName: 'Solar Blade', isCritical: false },
      { t: 'attack-intended',   attacker: 'p1', defender: 'p2', abilityName: 'Solar Blade', tier: 3, damageType: 'undefendable', incomingAmount: 7, defendable: true },
    ]
    const s1 = aggregateEvents(initialAggregatorState, batch1)
    expect(s1.emitted).toEqual([])
    expect(s1.state.pending).not.toBeNull()

    const batch2: GameEvent[] = [
      { t: 'defense-intended', defender: 'p2', abilityIndex: 0, abilityName: 'Wolfhide', diceCount: 3 },
      { t: 'defense-dice-rolled', player: 'p2', dice: [], abilityName: 'Wolfhide' },
      { t: 'defense-resolved', player: 'p2', reduction: 2, landed: true, abilityName: 'Wolfhide' },
      { t: 'damage-dealt',     from: 'p1', to: 'p2', amount: 5, type: 'undefendable', mitigated: 2 },
      { t: 'hp-changed',       player: 'p2', delta: -5, total: 20 },
      { t: 'phase-changed',    player: 'p2', from: 'defensive-roll', to: 'main-post' },
    ]
    const s2 = aggregateEvents(s1.state, batch2)
    expect(s2.emitted.length).toBe(1)
    const scene = s2.emitted[0]!
    if (scene.kind === 'ability') {
      expect(scene.data.abilityName).toBe('Solar Blade')
      expect(scene.data.damage).toBe(5)
      expect(scene.data.effects.some(e => e.description.includes('blocked'))).toBe(true)
    }
  })

  it('emits sub-event scenes for status ticks but not routine draw/CP income', () => {
    const events: GameEvent[] = [
      { t: 'status-ticked', status: 'burn',  holder: 'p1', effect: 'damage', amount: 2, stacksRemaining: 1 },
      { t: 'card-drawn',    player: 'p1', cardId: 'generic/quick-draw' },
      { t: 'cp-changed',    player: 'p1', delta: 1, total: 3 },
    ]
    const r = aggregateEvents(initialAggregatorState, events)
    // Draws land in the hand and CP floats over the strip — only the
    // status tick warrants a Field-of-Play beat.
    expect(r.emitted.length).toBe(1)
    expect(r.emitted[0]!.kind).toBe('sub-event')
  })

  it('flushes on match-won', () => {
    const state = { pending: {
      kind: 'ability' as const,
      attacker: 'p1' as const,
      defender: 'p2' as const,
      tier: 4 as const,
      ability: 'Wolf\'s Howl',
      isCrit: true,
      effects: [],
      damage: 14,
      isLethal: true,
    } }
    const r = aggregateEvents(state, [{ t: 'match-won', winner: 'p1' }])
    // Match-won flushes without emitting the pending buffer (it was
    // effectively completed by the damage-dealt / hp-changed earlier).
    expect(r.state.pending).toBeNull()
  })

  it('marks the ability as lethal when hp-changed brings defender to 0', () => {
    const events: GameEvent[] = [
      { t: 'ability-triggered', player: 'p1', tier: 4, abilityName: 'Wolf\'s Howl', isCritical: 'major' },
      { t: 'damage-dealt',      from: 'p1', to: 'p2', amount: 14, type: 'ultimate', mitigated: 0 },
      { t: 'hp-changed',        player: 'p2', delta: -14, total: 0 },
      { t: 'phase-changed',     player: 'p1', from: 'offensive-roll', to: 'defensive-roll' },
    ]
    const r = aggregateEvents(initialAggregatorState, events)
    const scene = r.emitted[0]!
    if (scene.kind === 'ability') {
      expect(scene.data.isLethal).toBe(true)
    }
  })
})

/**
 * FOPScene aggregator — translates engine `GameEvent[]` batches into
 * `FOPScene` values for the FieldOfPlay to play.
 *
 * This is a **stateful accumulator**: some resolutions span more than one
 * engine dispatch. For example, an offensive ability commit produces
 * `ability-triggered` and `attack-intended` in one batch and then waits for
 * the defender's `select-defense` — the follow-up batch (with
 * `defense-resolved`, `damage-dealt`, `status-applied`, `hp-changed`) is
 * where the ability *actually* resolves. Both batches contribute to a
 * single `FOPScene`.
 *
 * The aggregator maintains a `pending` buffer that opens on
 * `ability-triggered` / `card-played` / `status-detonated` and closes when
 * the terminating event arrives (`damage-dealt` for attacks landing, or a
 * `phase-changed` boundary for effects with no direct damage). Each closed
 * buffer is emitted as one FOPScene.
 *
 * Bible reference: Part 5.1.
 */

import type { GameEvent, HeroId, PlayerId } from '@/game/types'
import { statusDisplayName } from '@/ui/types/statusInfo'
import type {
  FOPScene,
  AbilityResolutionData,
  ResolutionEffect,
  SubEventData,
  DetonationData,
  DefenseData,
  DefenseRollData,
} from '@/ui/types/fop'

// ---------------------------------------------------------------------------
// Aggregator state
// ---------------------------------------------------------------------------

interface AbilityPending {
  kind:      'ability'
  attacker:  PlayerId
  defender:  PlayerId
  tier:      1 | 2 | 3 | 4
  ability:   string
  isCrit:    boolean
  effects:   ResolutionEffect[]
  damage:    number | null
  isLethal:  boolean
}

interface CardPlayPending {
  kind:     'card-play'
  playedBy: PlayerId
  cardId:   string
}

interface DetonationPending {
  kind:           'detonation'
  stacksConsumed: number
  damage:         number
}

type PendingScene = AbilityPending | CardPlayPending | DetonationPending | null

/** A defense roll waiting for its verdict (`defense-resolved` arrives in
 *  the same batch). Held outside `pending` — the attack's ability buffer
 *  stays open while the defender rolls. */
interface DefenseRollStash {
  defender:    PlayerId
  heroId:      HeroId
  defenseName: string
  faceIndices: number[]
}

export interface AggregatorState {
  pending: PendingScene
  defenseRoll?: DefenseRollStash | null
}

export const initialAggregatorState: AggregatorState = { pending: null, defenseRoll: null }

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface AggregatorResult {
  state:   AggregatorState
  emitted: FOPScene[]
}

/**
 * Fold a batch of engine events into 0 or more FOPScene emissions,
 * updating the aggregator state.
 *
 * Pure function: same input → same output.
 */
export function aggregateEvents(
  state: AggregatorState,
  events: readonly GameEvent[],
): AggregatorResult {
  let pending = state.pending
  let defenseRoll = state.defenseRoll ?? null
  const emitted: FOPScene[] = []

  const flush = () => {
    if (!pending) return
    if (pending.kind === 'detonation') {
      emitted.push({
        kind: 'detonation',
        data: {
          triggerKind:    'cinder',
          damage:         pending.damage,
          stacksConsumed: pending.stacksConsumed,
          aoe:            true,
        } satisfies DetonationData,
      })
      pending = null
      return
    }
    if (pending.kind === 'ability') {
      const scene: FOPScene = {
        kind: 'ability',
        data: {
          abilityName:   pending.ability,
          tier:          pending.tier,
          damage:        pending.damage,
          damageVariant: 'damage',
          effects:       pending.effects,
          elementalTone: 'gold',
          attacker:      pending.attacker,
          defender:      pending.defender,
          isCritical:    pending.isCrit,
          isLethal:      pending.isLethal,
        } satisfies AbilityResolutionData,
      }
      emitted.push(scene)
    }
    pending = null
  }

  for (const ev of events) {
    switch (ev.t) {
      case 'ability-triggered': {
        flush()
        pending = {
          kind:     'ability',
          attacker: ev.player,
          defender: ev.player === 'p1' ? 'p2' : 'p1',
          tier:     ev.tier,
          ability:  ev.abilityName,
          isCrit:   ev.isCritical !== false,
          effects:  [],
          damage:   null,
          isLethal: false,
        }
        break
      }

      case 'card-played': {
        // Card plays are visualised by MatchScreen's CardPlayOverlay
        // (which watches gameStore.matchLog) — we don't queue them into
        // the resolution pipeline because the overlay renders on top of
        // the MiddleBand, not inside it.
        break
      }

      case 'status-detonated': {
        // Detonation always closes any pending ability first so the two
        // cinematics play in sequence, not merged. The detonation itself
        // stays PENDING so the follow-up damage-dealt fills its number —
        // emitting immediately showed "Cinder x5 -> 0 damage" every time.
        flush()
        pending = {
          kind:           'detonation',
          stacksConsumed: ev.threshold,
          damage:         0,
        }
        break
      }

      case 'damage-dealt': {
        if (pending?.kind === 'detonation') {
          pending.damage += Math.max(0, ev.amount)
          // The detonation's damage arrives in the same batch right after
          // the trigger — close it as soon as the number lands.
          flush()
          break
        }
        if (pending?.kind === 'ability') {
          pending.damage = (pending.damage ?? 0) + Math.max(0, ev.amount)
          pending.effects.push(
            ev.amount <= 0
              ? { kind: 'block',  description: 'Fully blocked', target: ev.to }
              : {
                  kind:        'damage',
                  description: `−${ev.amount} HP${ev.type === 'undefendable' ? ' · Unblockable' : ''}`,
                  target:      ev.to,
                },
          )
        }
        break
      }

      case 'heal-applied': {
        if (pending?.kind === 'ability') {
          pending.effects.push({
            kind:        'heal',
            description: `Heal ${ev.amount} HP`,
            target:      ev.player,
          })
        }
        break
      }

      case 'status-applied': {
        if (pending?.kind === 'ability') {
          pending.effects.push({
            kind:        'status',
            description: `+${ev.stacks} ${statusDisplayName(ev.status)}`,
            target:      ev.holder,
          })
        }
        break
      }

      case 'passive-counter-changed': {
        if (pending?.kind === 'ability' && ev.delta > 0) {
          pending.effects.push({
            kind:        'resource',
            description: `+${ev.delta} ${statusDisplayName(ev.passiveKey)}`,
            target:      ev.player,
          })
        }
        break
      }

      case 'status-ticked': {
        emitted.push(buildSubEvent(ev))
        break
      }

      case 'card-drawn':
      case 'cp-changed': {
        // Deliberately NOT queued as scenes: draws visibly land in the hand
        // and CP gains float over the strip (DamageFloaters). Queuing a
        // 700ms cinematic for each added 1.5s+ of dead time to every turn
        // and double-signaled routine income.
        break
      }

      case 'defense-dice-rolled': {
        // Stash the roll — the verdict (`defense-resolved`) arrives later
        // in the same batch and closes it into a defense-roll scene.
        defenseRoll = {
          defender:    ev.player,
          heroId:      ev.hero,
          defenseName: ev.abilityName,
          faceIndices: ev.dice.map(d => d.current),
        }
        break
      }

      case 'defense-resolved': {
        // A stashed roll becomes its own cinematic — the defender's dice
        // visibly tumble BEFORE the attack impact scene (the pending
        // ability buffer flushes later in this batch), so defense never
        // reads as automatic. Misses play too: "my combo failed" is
        // information the defender must see.
        if (defenseRoll) {
          emitted.push({
            kind: 'defense-roll',
            data: {
              defenseName: defenseRoll.defenseName,
              defender:    defenseRoll.defender,
              heroId:      defenseRoll.heroId,
              faceIndices: defenseRoll.faceIndices,
              landed:      ev.landed,
              reduction:   ev.reduction,
            } satisfies DefenseRollData,
          })
          defenseRoll = null
        }
        if (pending?.kind === 'ability' && ev.reduction > 0) {
          pending.effects.push({
            kind:        'block',
            description: `${ev.abilityName ?? 'Defense'} blocks ${ev.reduction}`,
            target:      pending.defender,
          })
        } else if (!pending && ev.abilityName && emitted.every(sc => sc.kind !== 'defense-roll')) {
          // Undefendable / no pending ability and no roll to show —
          // surface as a standalone defense scene (rare desync path).
          emitted.push({
            kind: 'defense',
            data: {
              defenseName: ev.abilityName,
              reduction:   ev.reduction,
              landed:      ev.landed,
              incoming:    0,
            } satisfies DefenseData,
          })
        }
        break
      }

      case 'hp-changed': {
        if (pending?.kind === 'ability' && ev.total === 0) {
          pending.isLethal = true
        }
        break
      }

      case 'match-won': {
        flush()
        break
      }

      case 'phase-changed': {
        // A phase transition off any resolution phase terminates the current
        // pending buffer.
        if (ev.from === 'defensive-roll' || ev.from === 'offensive-roll') {
          flush()
        }
        break
      }
    }
  }

  // Preserve reference identity when nothing changed — avoids spurious
  // uiStore updates and lets `Object.is` comparisons work in tests.
  const nextState =
    pending === state.pending && defenseRoll === (state.defenseRoll ?? null)
      ? state
      : { pending, defenseRoll }
  return { state: nextState, emitted }
}

function buildSubEvent(ev: Extract<GameEvent, { t: 'status-ticked' }>): FOPScene {
  const isDamage  = ev.effect === 'damage'
  const isHeal    = ev.effect === 'heal'
  const value     = isDamage ? `−${ev.amount}` : isHeal ? `+${ev.amount}` : `${ev.amount}`
  const tone: SubEventData['tone'] =
    ev.status === 'burn' || ev.status === 'bleeding' ? 'ember' :
    ev.status === 'regen'                            ? 'green' :
    isDamage                                         ? 'crimson' :
                                                       'gold'
  return {
    kind: 'sub-event',
    data: {
      eventKind:      'status-tick',
      label:          `${statusDisplayName(ev.status)} ticks`,
      value,
      tone,
      affectedPlayer: ev.holder,
    } satisfies SubEventData,
  }
}

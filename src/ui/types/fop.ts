/**
 * Field of Play (FOP) types — cinematic scenes rendered inside the middle band
 * during resolution.
 *
 * A `ResolvedEvent` is produced by `selectors/fopScene.ts` (the aggregator)
 * from a buffered slice of the engine's `GameEvent[]` stream. Each resolution
 * (ability, card play, upkeep beat, detonation, consume) produces one
 * `ResolvedEvent` with an internal `scene: FOPScene` discriminator.
 *
 * Bible reference: Part 5.1.
 */

import type { PlayerId } from './ui'
import type { Card } from '@/game/types'

/** Every FOP scene variant. */
export type FOPScene =
  | { kind: 'ability';     data: AbilityResolutionData }
  | { kind: 'detonation';  data: DetonationData }
  | { kind: 'sub-event';   data: SubEventData }
  | { kind: 'card-play';   data: CardPlayData }
  | { kind: 'consume';     data: ConsumeData }
  | { kind: 'defense';     data: DefenseData }

/** Full ability resolution — the standard 2000ms cinematic. */
export interface AbilityResolutionData {
  abilityName:    string
  tier:           1 | 2 | 3 | 4
  damage:         number | null    // null for non-damage abilities
  damageVariant:  'damage' | 'heal' | 'resource'
  effects:        ResolutionEffect[]
  elementalTone:  'gold' | 'frost' | 'ember' | 'dawn'
  attacker:       PlayerId
  defender:       PlayerId
  isCritical:     boolean          // engine's criticalCondition met
  isLethal:       boolean          // this damage kills the defender
}

export interface ResolutionEffect {
  kind:        'damage' | 'heal' | 'resource' | 'token' | 'status' | 'block'
  description: string
  /** Who the effect lands on — lets the row show a YOU/FOE tag so players
   *  can tell "+2 Cinder" on the opponent from Cinder landing on them. */
  target?:     PlayerId
}

/** Cinder detonation cinematic. */
export interface DetonationData {
  triggerKind:    'cinder'
  damage:         number
  stacksConsumed: number
  aoe:            boolean
}

/** Upkeep-beat variant (status tick, draw, cp gain, deck shuffle). */
export interface SubEventData {
  eventKind:       'status-tick' | 'draw' | 'cp-gain' | 'deck-shuffle'
  label:           string
  value:           number | string | null
  subtext?:        string                                 // drawn card name for draws
  tone:            'ember' | 'green' | 'toxic-green' | 'gold' | 'frost' | 'crimson'
  affectedPlayer:  PlayerId
}

/** Card-play cinematic — the played card lifted to center at readable size. */
export interface CardPlayData {
  card:     Card
  playedBy: PlayerId
  tone:     'frost' | 'ember' | 'dawn' | 'gold'
}

/** Consume scene — Frostbite consumed for bonus damage, Verdict atoned, etc. */
export interface ConsumeData {
  abilityName:   string
  baseValue:     number
  consumed:      ConsumedToken[]
  bonusPerToken: number
  finalValue:    number
  resultLabel:   string        // "damage" | "cleared" | "AoE damage"
  variant:       'damage-add' | 'token-clear'
}

export interface ConsumedToken {
  kind: 'frostbite' | 'cinder' | 'verdict'
}

/** Defense resolution cinematic. */
export interface DefenseData {
  defenseName: string
  reduction:   number
  landed:      boolean
  incoming:    number
}

/** Resolution state machine phases. */
export type ResolutionPhase =
  | 'idle'
  | 'preconfirm'
  | 'fade-in'
  | 'name-in'
  | 'damage-in'
  | 'effects-in'
  | 'holding'
  | 'fade-out'

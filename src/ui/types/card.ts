/**
 * Card-side UI types — effect segments, keyword registry, visual style.
 *
 * The engine's `Card.text` is a plain string; the UI parses it into
 * `EffectSegment[]` at render time via `util/parseEffect.ts`. Nothing on the
 * engine side changes — the engine's `Card.effect` (a discriminated union of
 * mechanics like `damage`/`apply-status`/`compound`) is what drives resolution.
 *
 * Bible reference: Part 1.9.
 */

import type { CardId as EngineCardId } from '@/game/types'

/** Opaque brand aliases used throughout the UI. */
export type AbilityId = string
export type CardId = EngineCardId

/**
 * One run within a rendered card / ability description.
 *   text    — plain prose
 *   value   — a numeric or short highlighted value (e.g. "4", "unblockable")
 *   keyword — a game term looked up in KEYWORD_REGISTRY
 */
export type EffectSegment =
  | { kind: 'text';    content: string }
  | { kind: 'value';   content: string }
  | { kind: 'keyword'; id: string }

/** Optional conditional clause metadata — rendered greyed out when unmet. */
export interface CardCondition {
  description:        string
  isMet:              boolean
  appliesToSegments:  number[]   // indices into the parent effect segments
}

/** Registry describing a game keyword — display label + glossary text. */
export interface Keyword {
  id:            string
  matchText:     string[]         // strings that parse to this keyword id
  displayLabel:  string           // what the renderer prints
  definition:    string           // glossary tooltip (rendered v1.1)
  category:      KeywordCategory
}

export type KeywordCategory =
  | 'damage-mod'
  | 'buff'
  | 'control'
  | 'targeting'
  | 'resource'

/**
 * The keyword registry.
 *
 * `undefendable` is the canonical id (matches the engine's damage type).
 * Common aliases like "unblockable", "ub", "unbl" all parse to this id; the
 * display label is "Unblockable" because that's what the design copy uses.
 */
export const KEYWORD_REGISTRY: Record<string, Keyword> = {
  undefendable: {
    id:           'undefendable',
    matchText:    ['undefendable', 'Undefendable', 'unblockable', 'Unblockable', 'ub'],
    displayLabel: 'Unblockable',
    definition:   'Cannot be reduced by defensive abilities.',
    category:     'damage-mod',
  },
  pure: {
    id:           'pure',
    matchText:    ['pure', 'Pure'],
    displayLabel: 'Pure',
    definition:   'Bypasses all defensive reduction; direct HP loss.',
    category:     'damage-mod',
  },
  frostbite: {
    id:           'frostbite',
    matchText:    ['Frost-bite', 'frost-bite', 'Frostbite', 'frostbite'],
    displayLabel: 'Frost-bite',
    definition:   'Berserker signature token. Consumed by damage abilities for bonus effects.',
    category:     'buff',
  },
  cinder: {
    id:           'cinder',
    matchText:    ['Cinder', 'cinder'],
    displayLabel: 'Cinder',
    definition:   'Pyromancer signature token. Detonates on threshold for area damage.',
    category:     'buff',
  },
  verdict: {
    id:           'verdict',
    matchText:    ['Verdict', 'verdict'],
    displayLabel: 'Verdict',
    definition:   'Lightbearer signature token. Amplifies Lightbearer follow-up effects.',
    category:     'buff',
  },
  radiance: {
    id:           'radiance',
    matchText:    ['Radiance', 'radiance'],
    displayLabel: 'Radiance',
    definition:   'Lightbearer bankable resource. Spend for damage bonus, heal, or damage reduction.',
    category:     'resource',
  },
  frenzy: {
    id:           'frenzy',
    matchText:    ['Frenzy', 'frenzy'],
    displayLabel: 'Frenzy',
    definition:   'Berserker passive. Gained when taking damage; each stack adds +1 damage.',
    category:     'resource',
  },
  burn: {
    id:           'burn',
    matchText:    ['Burn', 'burn'],
    displayLabel: 'Burn',
    definition:   'Damage over time. Ticks at your upkeep for N damage; N decrements each turn.',
    category:     'control',
  },
  stun: {
    id:           'stun',
    matchText:    ['Stun', 'stun'],
    displayLabel: 'Stun',
    definition:   'Skip your next roll. Consumed on trigger.',
    category:     'control',
  },
  shield: {
    id:           'shield',
    matchText:    ['Shield', 'shield'],
    displayLabel: 'Shield',
    definition:   'Reduce incoming damage 1:1 per stack.',
    category:     'buff',
  },
  protect: {
    id:           'protect',
    matchText:    ['Protect', 'protect'],
    displayLabel: 'Protect',
    definition:   'Reduce incoming damage 2:1 per stack.',
    category:     'buff',
  },
  regen: {
    id:           'regen',
    matchText:    ['Regen', 'regen'],
    displayLabel: 'Regen',
    definition:   'Heal N HP at your upkeep; N decrements each turn.',
    category:     'buff',
  },
  bleeding: {
    id:           'bleeding',
    matchText:    ['Bleeding', 'bleeding'],
    displayLabel: 'Bleeding',
    definition:   'Damage over time applied by Berserker cards.',
    category:     'control',
  },
  empower: {
    id:           'empower',
    matchText:    ['Empower', 'empower'],
    displayLabel: 'Empower',
    definition:   'Next ability deals +N damage. Consumed on use.',
    category:     'buff',
  },
  sanctuary: {
    id:           'sanctuary',
    matchText:    ['Sanctuary', 'sanctuary'],
    displayLabel: 'Sanctuary',
    definition:   'Reduce next incoming damage.',
    category:     'buff',
  },
  mastery: {
    id:           'mastery',
    matchText:    ['Mastery', 'mastery'],
    displayLabel: 'Mastery',
    definition:   'Permanent ability upgrade. Occupies a Hero Upgrade slot.',
    category:     'buff',
  },
  ultimate: {
    id:           'ultimate',
    matchText:    ['Ultimate', 'ultimate'],
    displayLabel: 'Ultimate',
    definition:   'Tier 4 ability — the hero\'s career-moment finisher.',
    category:     'targeting',
  },
}

/**
 * Display style derived from a card's engine kind + cardCategory + effect
 * inspection. Purely a UI decision; used to color the HandCard illustration
 * slot and the ExpandedCardView category line.
 *
 * Bible reference: Part 2.9.3 illustration coloring table.
 */
export type CardVisualStyle = 'attack' | 'defense' | 'buff' | 'utility'

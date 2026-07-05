/**
 * UI-facing status effect types.
 *
 * Trimmed to engine reality:
 *   Universal (engine core registry): burn, stun, protect, shield, regen
 *   Hero-namespaced signatures:       berserker:frostbite, pyromancer:cinder,
 *                                      pyromancer:defense-handicap-1,
 *                                      lightbearer:verdict, bleeding
 *   Bible fabrications dropped:       poison, frozen, momentum, empower
 *   Re-homed:                          radiance (renders like a status but
 *                                      sourced from signatureState.radiance)
 *
 * Bible reference: Part 4.4 (redesigned).
 */

import type { PlayerId } from './ui'

/** Universal status effects registered in the engine's status system. */
export type UniversalStatusEffect =
  | 'burn'
  | 'stun'
  | 'protect'
  | 'shield'
  | 'regen'

/** Hero-namespaced signature statuses. String literals mirror engine IDs. */
export type SignatureStatusEffect =
  | 'berserker:frostbite'
  | 'pyromancer:cinder'
  | 'lightbearer:verdict'

/** Other hero-namespaced statuses that render as generic StatusChips. */
export type OtherHeroStatusEffect =
  | 'pyromancer:defense-handicap-1'
  | 'bleeding'

/** Passive counters that render like status chips but source from signatureState. */
export type PassiveCounterEffect = 'radiance' | 'frenzy'

/** All effects the UI can render as a chip. */
export type ChipEffect =
  | UniversalStatusEffect
  | SignatureStatusEffect
  | OtherHeroStatusEffect
  | PassiveCounterEffect

/** Valence classification — drives the two-group split in StatusTrack. */
export type Valence = 'positive' | 'negative' | 'neutral'

/**
 * Valence lookup from a chip's effect. Perspective: strip-owner (a chip
 * lives on the strip of the player being affected — Frostbite lives on the
 * opponent when Berserker applies it).
 *
 * Bible reference: Part 4.6 valence table.
 */
export const CHIP_VALENCE: Record<ChipEffect, Valence> = {
  // Universal — harmful to strip owner
  burn:    'negative',
  stun:    'negative',
  // Universal — beneficial to strip owner
  protect: 'positive',
  shield:  'positive',
  regen:   'positive',

  // Signatures — all applied to opponent by the source hero; on the
  // receiving strip they are negative.
  'berserker:frostbite': 'negative',
  'pyromancer:cinder':   'negative',
  'lightbearer:verdict': 'negative',

  // Other hero statuses
  'pyromancer:defense-handicap-1': 'negative',
  bleeding: 'negative',

  // Passive counters — always positive to the hero they belong to
  radiance: 'positive',
  frenzy:   'positive',
}

/**
 * StatusToken payload the StatusTrack passes to each chip.
 * Constructed by `selectors/statusTrack.ts` from engine `StatusInstance[]`
 * or `signatureState`.
 */
export interface StatusToken {
  effect:    ChipEffect
  count?:    number
  source?:   string       // e.g. "Pyromancer · Pyre Lance" — for tooltip
  appliedAt: number       // engine timestamp; drives right-most-first ordering
  appliedBy?: PlayerId    // for signature tokens
}

/**
 * SignatureToken — the three hero signatures rendered as SignatureChip
 * (with count badge + threshold behavior for Cinder).
 */
export type SignatureKind = 'frostbite' | 'cinder' | 'verdict'

/** Map from engine status id to bible-style bare signature kind. */
export const SIGNATURE_KIND_FROM_STATUS_ID: Partial<Record<string, SignatureKind>> = {
  'berserker:frostbite': 'frostbite',
  'pyromancer:cinder':   'cinder',
  'lightbearer:verdict': 'verdict',
}

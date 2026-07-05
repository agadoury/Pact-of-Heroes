/**
 * UI-only enums and identifiers not owned by the engine.
 */

import type { HeroId, PlayerId } from '@/game/types'

/** Re-exports for downstream ui/ modules to avoid reaching into src/game. */
export type { HeroId, PlayerId }

/**
 * Elemental identity per hero — drives strip tinting, portrait glow, FOP tone,
 * particle color. Deterministic mapping from the three MVP heroes.
 *
 * Bible reference: Part 1.8.
 */
export type Element = 'frost' | 'ember' | 'dawn'

export const HERO_ELEMENT: Record<HeroId, Element> = {
  berserker:   'frost',
  pyromancer:  'ember',
  lightbearer: 'dawn',
}

export const ELEMENT_COLOR_VAR: Record<Element, string> = {
  frost: '--frost',
  ember: '--ember',
  dawn:  '--dawn',
}

export const ELEMENT_COLOR_BRIGHT_VAR: Record<Element, string> = {
  frost: '--frost-bright',
  ember: '--ember-bright',
  dawn:  '--dawn-bright',
}

/**
 * A view-relative perspective. Components derive this from
 * `playerId === viewerId` — they never take it as a prop, per the bible's
 * multiplayer-ready conventions (Part 0.4).
 */
export type Perspective = 'self' | 'opponent'

/**
 * Common tone tags used by the phase banner, FOP overlay, particle field,
 * and status backdrops. The bible's `elementalTone` union.
 */
export type Tone =
  | 'gold'
  | 'frost'
  | 'ember'
  | 'dawn'
  | 'crimson'
  | 'green'
  | 'toxic-green'
  | 'detonation'

/** A monotonic event id used to dedupe FOPScene emissions. */
export type EventId = string

/** A DOM position anchor used by tooltips + FOP alignment. */
export interface Anchor {
  x: number
  y: number
}

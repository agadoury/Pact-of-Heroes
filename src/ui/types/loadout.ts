/**
 * Persisted per-hero configuration types.
 *
 * These wrap the engine's `LoadoutSelection` and card-id deck; the UI adds
 * timestamps and a stable id so persistence + change-detection are clean.
 *
 * Bible reference: Part 0.3 + Part 8.6.1.
 */

import type { CardId, HeroId, LoadoutSelection } from '@/game/types'

export interface HeroLoadout extends LoadoutSelection {
  heroId:    HeroId
  updatedAt: number
}

export interface DeckConfig {
  heroId:    HeroId
  cards:     CardId[]         // length 12; max 2 copies per cardId;
                              // enforced 4/3/3/2 by cardCategory (bible + engine)
  updatedAt: number
}

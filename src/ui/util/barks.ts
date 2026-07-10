/**
 * Hero barks — the voice of the duel. Data-authored one-liners keyed to
 * match moments, delivered as speech bubbles on the hero strips. The AI
 * barks too: in a serverless game the opponent's voice IS the social
 * layer.
 *
 * Selection is deterministic per (moment, turn) so replays/re-renders
 * don't reshuffle lines mid-bubble.
 *
 * Bible reference: Part 7.11 (Rival Layer).
 */

import type { HeroId } from '@/game/types'

export type BarkMoment =
  | 'first-blood'      // first damage of the match — attacker speaks
  | 'big-hit'          // 10+ damage landed — attacker speaks
  | 'blocked'          // a hit fully blocked — defender speaks
  | 'frenzy-max'       // Berserker's bank caps — holder speaks
  | 'cinder-critical'  // 4+ Cinder stacked — the Pyromancer speaks
  | 'detonation'       // Cinder detonates — applier speaks
  | 'low-hp'           // speaker enters low HP — defiance
  | 'ultimate'         // T4 fires — speaker roars

const BARKS: Record<HeroId, Partial<Record<BarkMoment, string[]>>> = {
  berserker: {
    'first-blood':  ['First blood runs cold.', 'The hunt is on.'],
    'big-hit':      ['Feel the mountain fall.', 'Bones remember this.'],
    'blocked':      ['My hide is winter.', 'Not today.'],
    'frenzy-max':   ['The wound is the door.', 'Rage is ready.'],
    'low-hp':       ['Still standing.', 'Cold ground calls — not yet.'],
    'ultimate':     ['FOR THE PACK.'],
  },
  pyromancer: {
    'first-blood':  ['The first spark.', 'It begins with heat.'],
    'big-hit':      ['Burn with me.', 'Ash answers.'],
    'blocked':      ['Smoke and nothing.', 'You put out one ember.'],
    'cinder-critical': ['One more spark…', 'You are kindling now.'],
    'detonation':   ['EVERYTHING BURNS.', 'The mountain remembers.'],
    'low-hp':       ['Fire dies loud.', 'Embers still glow.'],
    'ultimate':     ['THE MOUNTAIN WAKES.'],
  },
  lightbearer: {
    'first-blood':  ['Judgment begins.', 'The dawn takes note.'],
    'big-hit':      ['The light is heavy.', 'Weighed. Measured.'],
    'blocked':      ['Faith holds.', 'The dawn shields me.'],
    'low-hp':       ['Darkness is brief.', 'Dawn breaks always.'],
    'ultimate':     ['JUDGMENT OF THE SUN.'],
  },
}

/** Pick the bark for a moment — deterministic on turn so a re-render
 *  never swaps the line mid-bubble. Null when the hero has no line. */
export function barkFor(hero: HeroId, moment: BarkMoment, turn: number): string | null {
  const pool = BARKS[hero]?.[moment]
  if (!pool || pool.length === 0) return null
  return pool[turn % pool.length]!
}

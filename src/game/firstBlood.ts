/**
 * First Blood — the guided first match.
 *
 * A fresh player's first Quick Match drops them into this fixed duel:
 * Berserker (them) vs Lightbearer at Squire rank, on a hand-picked seed
 * whose FIRST roll shows exactly two Axes — one short of Cleave — so the
 * coach hint "1 more Axe: LOCK your matches, then Roll" teaches the
 * lock→reroll→fire loop against live dice, not a text screen. The seed
 * is also verified winnable against the Squire profile.
 *
 * Completing the first match pays "First Pact +5" Renown, win or lose.
 * Guarded by tests/first-blood.test.ts against content drift.
 */

import type { HeroId, PlayerId } from "./types";
import type { AiRank } from "./ai";

export const FIRST_BLOOD: {
  seed: number; p1: HeroId; p2: HeroId; coin: PlayerId; rank: AiRank;
} = {
  seed: 21,
  p1: "berserker",
  p2: "lightbearer",
  coin: "p1",
  rank: "squire",
};

/**
 * first-blood.test.ts — the guided first match must keep teaching.
 *
 * Guards FIRST_BLOOD's seed against content drift: if dice identities,
 * the engine RNG, or the Berserker's kit change, these assertions catch
 * the tutorial silently breaking.
 */
import { describe, it, expect } from "vitest";
import type { GameState, Action } from "../src/game/types";
import { applyAction, makeEmptyState } from "../src/game/engine";
import { nextAiAction, pendingActorFor, AI_PROFILES } from "../src/game/ai";
import { FIRST_BLOOD } from "../src/game/firstBlood";
import { computeRenownAward, RENOWN_FIRST_PACT, RENOWN_LOSS } from "../src/store/collectionStorage";

function startFirstBlood(): GameState {
  let state: GameState = makeEmptyState();
  ({ state } = applyAction(state, {
    kind: "start-match", seed: FIRST_BLOOD.seed,
    p1: FIRST_BLOOD.p1, p2: FIRST_BLOOD.p2, coinFlipWinner: FIRST_BLOOD.coin,
  }));
  return state;
}

describe("first blood", () => {
  it("the player goes first and the first roll shows exactly 2 Axes", () => {
    let state = startFirstBlood();
    expect(state.activePlayer).toBe("p1");
    let guard = 0;
    while (state.phase !== "offensive-roll" && guard++ < 10) {
      state = applyAction(state, { kind: "advance-phase" }).state;
    }
    state = applyAction(state, { kind: "roll-dice" }).state;
    const axes = state.players.p1.dice.filter(
      d => d.faces[d.current]!.symbol === "berserker:axe",
    ).length;
    expect(axes).toBe(2);
  });

  it("is winnable against the Squire profile", () => {
    let state = startFirstBlood();
    let safety = 0;
    while (!state.winner && safety++ < 4000) {
      const actor = pendingActorFor(state);
      const profile = actor === "p2" ? AI_PROFILES.squire : AI_PROFILES.champion;
      const action: Action | null = nextAiAction(state, actor, profile);
      if (!action) break;
      state = applyAction(state, action).state;
    }
    expect(state.winner).toBe("p1");
  });

  it("First Pact pays win or lose", () => {
    const win = computeRenownAward(true, { firstPact: true });
    expect(win.breakdown.some(b => b.label === "First Pact")).toBe(true);
    const loss = computeRenownAward(false, { firstPact: true });
    expect(loss.total).toBe(RENOWN_LOSS + RENOWN_FIRST_PACT);
  });
});

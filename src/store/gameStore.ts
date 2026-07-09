/**
 * Pact of Heroes — game store. Thin Zustand wrapper around the pure engine.
 *
 * Every dispatch:
 *   1. Calls applyAction(state, action) → { state, events }.
 *   2. Updates store state with the new GameState.
 *   3. Pipes events into the choreographer queue.
 *
 * The store does NOT block on choreographer drain — UI components do that
 * via `canAcceptInput()` (read live from the choreoStore). When the AI is
 * active, a small driver effect waits for drain before dispatching the
 * next AI action.
 */
import { create } from "zustand";
import type { Action, CardId, GameEvent, GameState, HeroId, LoadoutSelection, MatchModifiers, PlayerId } from "@/game/types";
import { applyAction, makeEmptyState } from "@/game/engine";
import type { AiRank } from "@/game/ai";
import { NIGHTMARE_BLOOD_PACT } from "@/game/ai";
// choreoStore was retired with the v0.2 UI rebuild — the new src/ui/ tree
// consumes lastEvents directly via the FOPScene aggregator. gameStore.dispatch
// no longer needs to pump into an event queue store; subscribers pull.
import { loadDeck, saveDefaultHero, saveLastRank } from "./deckStorage";
import { loadLoadout } from "./loadoutStorage";

export type MatchMode = "hot-seat" | "vs-ai";

interface GameStoreState {
  state: GameState | null;
  mode: MatchMode;
  /** Which player the human(s) control. For Vs AI: aiPlayer is the opposite. */
  aiPlayer: PlayerId | null;
  /** Latest events (for tests / debug). */
  lastEvents: GameEvent[];
  /** Full event log accumulated since match start — used by match-summary. */
  matchLog: GameEvent[];
  /** Pact Rank of the AI opponent — drives its AiProfile + Renown payout. */
  aiRank: AiRank;
  /** Seal the Pact — who sealed (doubling the match stakes), if anyone.
   *  Meta-layer only: the engine never sees it. */
  sealedBy: PlayerId | null;

  // Actions
  startMatch: (opts: {
    p1: HeroId; p2: HeroId; mode: MatchMode;
    seed?: number; coin?: PlayerId;
    /** Optional explicit decks. When omitted, each player's saved deck (if
     *  any) is loaded from localStorage; the engine in turn falls back to the
     *  hero's recommendedDeck when no saved deck exists. */
    p1Deck?: ReadonlyArray<CardId>; p2Deck?: ReadonlyArray<CardId>;
    /** Optional explicit loadouts. When omitted, each player's saved loadout
     *  (if any) is loaded from localStorage; the engine falls back to the
     *  hero's `recommendedLoadout` when no saved selection exists or it
     *  fails validation. */
    p1Loadout?: LoadoutSelection; p2Loadout?: LoadoutSelection;
    /** Pact Rank of the AI opponent (vs-ai only). Default: champion. */
    aiRank?: AiRank;
    /** Start-state rule-bends (Daily Pact mutators). Layered with the
     *  Nightmare blood pact when both apply. */
    modifiers?: MatchModifiers;
  }) => void;
  dispatch: (action: Action) => void;
  /** Seal the Pact — once per match, either duelist doubles the stakes.
   *  First seal wins; later calls are no-ops. */
  sealPact: (player: PlayerId) => void;
  reset: () => void;
}

/** Additively merge two start-state modifier sets (per player, per field). */
function mergeModifiers(a?: MatchModifiers, b?: MatchModifiers): MatchModifiers | undefined {
  if (!a) return b;
  if (!b) return a;
  const merged: MatchModifiers = {};
  for (const field of ["hp", "cp", "cards"] as const) {
    const fa = a[field]; const fb = b[field];
    if (!fa && !fb) continue;
    merged[field] = {
      p1: (fa?.p1 ?? 0) + (fb?.p1 ?? 0),
      p2: (fa?.p2 ?? 0) + (fb?.p2 ?? 0),
    };
  }
  return merged;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  state: null,
  mode: "hot-seat",
  aiPlayer: null,
  lastEvents: [],
  matchLog: [],
  aiRank: "champion",
  sealedBy: null,

  startMatch: ({ p1, p2, mode, seed, coin, p1Deck, p2Deck, p1Loadout, p2Loadout, aiRank, modifiers: extraModifiers }) => {
    const empty = makeEmptyState();
    const matchSeed = seed ?? (Date.now() & 0xffff);
    const winner = coin ?? (Math.random() < 0.5 ? "p1" : "p2");
    const resolvedP1Deck = p1Deck ?? loadDeck(p1) ?? undefined;
    const resolvedP2Deck = p2Deck ?? loadDeck(p2) ?? undefined;
    const resolvedP1Loadout = p1Loadout ?? loadLoadout(p1) ?? undefined;
    const resolvedP2Loadout = p2Loadout ?? loadLoadout(p2) ?? undefined;
    // Nightmare's blood pact: the AI seat starts with a small, advertised
    // material edge — the rank's teeth on top of its sharper profile.
    // Daily Pact mutators (extraModifiers) layer additively on top.
    const bloodPact =
      mode === "vs-ai" && aiRank === "nightmare"
        ? { hp: { p2: NIGHTMARE_BLOOD_PACT.hp }, cp: { p2: NIGHTMARE_BLOOD_PACT.cp } }
        : undefined;
    const modifiers = mergeModifiers(extraModifiers, bloodPact);
    const r = applyAction(empty, {
      kind: "start-match", seed: matchSeed, p1, p2, coinFlipWinner: winner,
      p1Deck: resolvedP1Deck, p2Deck: resolvedP2Deck,
      p1Loadout: resolvedP1Loadout, p2Loadout: resolvedP2Loadout,
      modifiers,
    });
    set({
      state: r.state,
      mode,
      aiPlayer: mode === "vs-ai" ? "p2" : null,
      lastEvents: r.events,
      matchLog: r.events.slice(),
      aiRank: aiRank ?? "champion",
      sealedBy: null,
    });
    // Remember the human's hero + rank so Quick Match can relaunch them.
    if (mode === "vs-ai") {
      try {
        saveDefaultHero(p1);
        saveLastRank(aiRank ?? "champion");
      } catch { /* storage unavailable */ }
    }
  },

  dispatch: (action) => {
    const cur = get().state;
    if (!cur) return;
    const r = applyAction(cur, action);
    set(s => ({
      state: r.state,
      lastEvents: r.events,
      matchLog: [...s.matchLog, ...r.events],
    }));
  },

  sealPact: (player) => {
    if (get().sealedBy) return;
    if (!get().state || get().state?.winner) return;
    set({ sealedBy: player });
  },

  reset: () => {
    set({ state: null, mode: "hot-seat", aiPlayer: null, lastEvents: [], matchLog: [], aiRank: "champion", sealedBy: null });
  },
}));

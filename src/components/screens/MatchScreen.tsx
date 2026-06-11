/**
 * MatchScreen — the seven-band match layout (bible Part 2).
 *
 *   1. OpponentStrip   — non-viewer hero (portrait, HP, CP, status track)
 *   2. PhaseBanner     — thin gold announcer band
 *   3. DiceTray        — active player's five dice (tumble choreography)
 *   4. MiddleBand      — ability ladder ⇄ FieldOfPlay resolution overlay
 *   5. SelfStrip       — viewer hero
 *   6. HandBand        — viewer's cards (scroll-snap, tap to expand)
 *   7. MatchActionBar  — Skip Turn + contextual primary (Roll / Reroll / …)
 *
 * The middle band shows the ACTIVE player's ladder and dice (bible 7.3.5.1):
 * on the opponent's turn the viewer watches their dice lock and their rows
 * light up. Desktop (lg:) widens the column; the band order is identical.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGameStore, useInputUnlocked } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { useChoreoStore } from "@/store/choreoStore";
import { getHero, HEROES } from "@/content";
import type { CardId, GameEvent, HeroId, PlayerId } from "@/game/types";
import { nextAiAction } from "@/game/ai";
import { buildMatchSummary } from "@/game/match-summary";
import { STARTING_HP } from "@/game/types";

import { HeroStrip } from "@/components/match/HeroStrip";
import { PhaseBanner } from "@/components/match/PhaseBanner";
import { Ladder } from "@/components/match/LadderV2";
import { FieldOfPlay } from "@/components/match/FieldOfPlay";
import { HandBand } from "@/components/match/HandBand";
import { MatchActionBar } from "@/components/match/MatchActionBar";
import { DiceTray } from "@/components/game/DiceTray";
import { HotSeatCurtain } from "@/components/game/HotSeatCurtain";
import { HeroBackground } from "@/components/effects/HeroBackground";
import { ResultScreen } from "@/components/screens/ResultScreen";

export default function MatchScreen() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const startMatch  = useGameStore(s => s.startMatch);
  const dispatch    = useGameStore(s => s.dispatch);
  const reset       = useGameStore(s => s.reset);
  const state       = useGameStore(s => s.state);
  const mode        = useGameStore(s => s.mode);
  const aiPlayer    = useGameStore(s => s.aiPlayer);
  const matchLog    = useGameStore(s => s.matchLog);

  const inputUnlocked = useInputUnlocked();

  const viewer       = useUIStore(s => s.currentViewer);
  const setViewer    = useUIStore(s => s.setViewer);
  const curtainOpen  = useUIStore(s => s.curtainOpen);
  const setCurtain   = useUIStore(s => s.setCurtain);

  // Boot the match on first mount based on URL params.
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    const validHeroes = Object.keys(HEROES) as HeroId[];
    const fallback = validHeroes[0] ?? "";
    if (!fallback) return;
    startedRef.current = true;
    const p1   = readHero(params.get("p1"), validHeroes) ?? fallback;
    const p2   = readHero(params.get("p2"), validHeroes) ?? fallback;
    const m    = (params.get("mode") as "hot-seat" | "vs-ai" | null) ?? "hot-seat";
    const seed = params.get("seed") ? Number(params.get("seed")) : undefined;
    startMatch({ p1, p2, mode: m, seed });
    setViewer("p1");
  }, [params, startMatch, setViewer]);

  // Hot-seat: raise the curtain when the active player flips mid-game.
  const lastActiveRef = useRef<PlayerId | null>(null);
  useEffect(() => {
    if (!state) return;
    const cur = state.activePlayer;
    if (lastActiveRef.current && lastActiveRef.current !== cur && state.phase !== "match-end" && mode === "hot-seat") {
      setCurtain(true);
    }
    lastActiveRef.current = cur;
  }, [state, mode, setCurtain]);

  function dismissCurtain() {
    if (!state) return;
    setViewer(state.activePlayer);
    setCurtain(false);
  }

  // AI driver — unchanged contract from the pre-revamp screen.
  useEffect(() => {
    if (mode !== "vs-ai" || !aiPlayer) return;
    let timer: number | null = null;
    let stopped = false;
    function tick() {
      if (stopped) return;
      const gs = useGameStore.getState();
      const live = gs.state;
      if (!live || live.winner) return;
      const choreo = useChoreoStore.getState();
      const inputReady = choreo.queue.length === 0 && !choreo.playing && !choreo.cinematic;
      if (!inputReady) return;
      const aiIsDefender = !!(live.pendingAttack && live.pendingAttack.defender === aiPlayer);
      const aiHasPendingCounter = !!(live.pendingCounter && live.pendingCounter.holder === aiPlayer);
      const aiCanAct = live.activePlayer === aiPlayer || aiIsDefender || aiHasPendingCounter;
      if (!aiCanAct) return;
      if (live.activePlayer === aiPlayer && live.pendingAttack && live.pendingAttack.defender !== aiPlayer) return;
      gs.dispatch(nextAiAction(live, aiPlayer));
    }
    function schedule() {
      if (timer != null || stopped) return;
      timer = window.setTimeout(() => { timer = null; tick(); }, 600);
    }
    const unsubGame = useGameStore.subscribe(() => schedule());
    const unsubChoreo = useChoreoStore.subscribe(() => schedule());
    const poller = window.setInterval(() => schedule(), 500);
    schedule();
    return () => {
      stopped = true;
      unsubGame();
      unsubChoreo();
      if (timer != null) window.clearTimeout(timer);
      window.clearInterval(poller);
    };
  }, [mode, aiPlayer]);

  // Hooks before early return (Rules of Hooks).
  const rollKey = useDiceRollKey();
  const rolling = useTrayRolling();
  const fopActive = useChoreoStore(s => !!s.fop);
  const defenseBeat = useDefenseBeat();
  const summary = useMemo(() => {
    if (!state || !state.winner) return null;
    return buildMatchSummary(matchLog, {
      winner: state.winner,
      turns: state.turn,
      startingHp: STARTING_HP,
    });
  }, [state, matchLog]);
  const [pendingLadderFire, setPendingLadderFire] = useState<number | null>(null);
  useEffect(() => {
    if (state?.phase !== "offensive-roll" && pendingLadderFire != null) setPendingLadderFire(null);
  }, [state?.phase, pendingLadderFire]);

  if (!state) return null;

  const opponentId: PlayerId = viewer === "p1" ? "p2" : "p1";
  const meSnap   = state.players[viewer];
  const oppSnap  = state.players[opponentId];
  const meHero   = getHero(meSnap.hero);
  const oppHero  = getHero(oppSnap.hero);

  const myTurn   = state.activePlayer === viewer;
  const canInput = myTurn && inputUnlocked && !state.winner;

  // Middle band follows the ACTIVE player (bible 7.3.5.1) — except during a
  // defensive flow, where the defender owns the tray.
  const defenseInFlight = !!state.pendingAttack;
  const trayOwnerId: PlayerId = defenseInFlight && state.pendingAttack
    ? state.pendingAttack.defender
    : state.activePlayer;
  const ladderOwnerId: PlayerId = state.activePlayer;
  const ladderSnap = state.players[ladderOwnerId];
  const ladderHero = getHero(ladderSnap.hero);
  const ladderOppSnap = state.players[ladderOwnerId === "p1" ? "p2" : "p1"];

  // Action handlers.
  function play(cardId: CardId) {
    dispatch({ kind: "play-card", card: cardId });
  }
  function sell(cardId: CardId) {
    dispatch({ kind: "sell-card", card: cardId });
  }
  function roll() { dispatch({ kind: "roll-dice" }); }
  function advance() { dispatch({ kind: "advance-phase" }); }
  function endTurn() { dispatch({ kind: "end-turn" }); }
  function toggleLock(idx: number) {
    const live = useGameStore.getState().state;
    if (!live || live.phase !== "offensive-roll") return;
    dispatch({ kind: "toggle-die-lock", die: idx as 0|1|2|3|4 });
  }
  /** Fire from the ladder modal: advance to commit, then pick the ability. */
  function fireFromLadder(abilityIndex: number) {
    const live = useGameStore.getState().state;
    if (!live || live.phase !== "offensive-roll") return;
    dispatch({ kind: "advance-phase" });
    const after = useGameStore.getState().state;
    if (!after?.pendingOffensiveChoice) return;
    if (!after.pendingOffensiveChoice.matches.some(m => m.abilityIndex === abilityIndex)) return;
    dispatch({ kind: "select-offensive-ability", abilityIndex });
  }
  const ladderFire = canInput && state.phase === "offensive-roll" ? fireFromLadder : undefined;

  return (
    <div className="min-h-svh flex flex-col text-ink relative"
         style={{ background: "linear-gradient(180deg, var(--night-stone) 0%, var(--night-deep) 100%)", paddingTop: "max(8px, env(safe-area-inset-top))" }}>
      <HeroBackground
        hero={state.players[state.activePlayer].hero}
        intensity="ambient"
        className="z-0"
      />

      <div className="relative z-10 flex flex-col flex-1 w-full max-w-2xl mx-auto px-2">
        {/* Band 1 — opponent strip */}
        <HeroStrip hero={oppHero} snapshot={oppSnap} perspective="opponent" active={state.activePlayer === opponentId} />

        {/* Band 2 — phase banner */}
        <PhaseBanner state={state} viewer={viewer} />

        {/* Band 3 — dice tray (defender's during defense, else active player's) */}
        <div
          className="transition-opacity duration-300 ease-out-quart"
          style={{ opacity: state.phase === "offensive-roll" || defenseInFlight || defenseBeat ? 1 : 0.45 }}
        >
          <DiceTray
            dice={state.players[trayOwnerId].dice}
            accent={getHero(state.players[trayOwnerId].hero).accentColor}
            rollKey={rollKey}
            onToggleLock={canInput && trayOwnerId === viewer && !defenseInFlight ? toggleLock : undefined}
            centerStage={state.phase === "offensive-roll" || defenseInFlight}
            dieSize={52}
            className="!py-2"
          />
        </div>

        {/* Band 4 — middle band: ladder ⇄ field of play */}
        <div className="relative flex-1 min-h-[210px] flex flex-col justify-center py-1"
             style={{ borderTop: "1px solid var(--frame-stroke-dim)", borderBottom: "1px solid var(--frame-stroke-dim)" }}>
          <Ladder
            hero={ladderHero}
            snapshot={ladderSnap}
            opponent={ladderOppSnap}
            rolling={rolling}
            onFire={ladderOwnerId === viewer ? ladderFire : undefined}
            dimmed={fopActive}
          />
          <FieldOfPlay />
        </div>

        {/* Band 5 — self strip */}
        <HeroStrip hero={meHero} snapshot={meSnap} perspective="self" active={myTurn} className="mt-1" />

        {/* Band 6 — hand */}
        <HandBand
          state={state}
          hero={meSnap}
          opponent={oppSnap}
          accent={meHero.accentColor}
          enabled={canInput && (state.phase === "main-pre" || state.phase === "main-post" || state.phase === "offensive-roll")}
          onPlay={play}
          onSell={sell}
        />

        {/* Spacer so the fixed action bar doesn't cover the hand. */}
        <div className="h-[72px]" />
      </div>

      {/* Band 7 — action bar */}
      <MatchActionBar
        state={state}
        active={meSnap}
        viewer={viewer}
        enabled={canInput}
        onRoll={roll}
        onAdvancePhase={advance}
        onEndTurn={endTurn}
        onMenu={() => { reset(); navigate("/"); }}
      />

      {/* Hot-seat curtain */}
      <HotSeatCurtain
        open={curtainOpen && mode === "hot-seat"}
        nextPlayer={state.activePlayer}
        nextHero={state.players[state.activePlayer].hero}
        onContinue={dismissCurtain}
      />

      {/* Match-end overlay */}
      {state.winner && summary && (
        <ResultScreen
          summary={summary}
          viewer={viewer}
          myHero={meHero}
          oppHero={oppHero}
          onMenu={() => { reset(); navigate("/"); }}
          onRematch={() => {
            reset();
            startMatch({ p1: meSnap.hero, p2: oppSnap.hero, mode });
          }}
        />
      )}
    </div>
  );
}

function readHero(s: string | null, valid: HeroId[]): HeroId | null {
  return s && valid.includes(s as HeroId) ? (s as HeroId) : null;
}

/** True while a defense-* beat is queued/playing — keeps the tray visible
 *  through the defender's roll even after pendingAttack clears. */
function useDefenseBeat(): boolean {
  const isDef = (ev: GameEvent) =>
    ev.t === "defense-intended" || ev.t === "defense-dice-rolled" || ev.t === "defense-resolved";
  return useChoreoStore(s => (s.playing ? isDef(s.playing) : false) || s.queue.some(isDef));
}

/** Bumps when a dice-rolled beat starts so the tray plays a fresh tumble. */
function useDiceRollKey(): number {
  const playing = useChoreoStore(s => s.playing);
  const handled = useChoreoStore(s => s.totalEventsHandled);
  const lastBump = useRef(0);
  if (playing && (playing.t === "dice-rolled" || playing.t === "defense-dice-rolled")) {
    lastBump.current = handled + 1;
  }
  return lastBump.current;
}

/** True while the dice tumble beat is playing — pips drop unlocked dice. */
function useTrayRolling(): boolean {
  const playing = useChoreoStore(s => s.playing);
  return !!playing && (playing.t === "dice-rolled" || playing.t === "defense-dice-rolled");
}

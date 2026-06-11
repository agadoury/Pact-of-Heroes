/**
 * PhaseBanner — thin announcer band between the opponent strip and the dice
 * tray (bible Part 2.6). Diamond-bracketed Cinzel microcopy; tone follows
 * the current phase / prompt.
 */
import type { GameState, PlayerId } from "@/game/types";
import { useChoreoStore } from "@/store/choreoStore";

const TONE_COLOR: Record<string, string> = {
  gold:    "var(--gold-bright)",
  ember:   "var(--ember-bright)",
  frost:   "var(--frost-bright)",
  dawn:    "var(--dawn-bright)",
  crimson: "var(--crimson-bright)",
  green:   "var(--green-bright)",
};

export function PhaseBanner({ state, viewer }: { state: GameState; viewer: PlayerId }) {
  const fop = useChoreoStore(s => s.fop);
  const { text, tone } = bannerCopy(state, viewer, fop?.scene ?? null);
  const color = TONE_COLOR[tone] ?? TONE_COLOR.gold;
  const bg =
    tone === "crimson"
      ? "linear-gradient(90deg, transparent, rgba(196,56,72,0.25), transparent)"
      : tone === "ember"
        ? "linear-gradient(90deg, transparent, rgba(200,74,42,0.20), transparent)"
        : "linear-gradient(90deg, transparent, rgba(212,165,72,0.18), transparent)";

  return (
    <div
      className="flex items-center justify-center h-6 w-full select-none"
      style={{ background: bg, borderBottom: "1px solid rgba(212,165,72,0.2)" }}
      aria-live="polite"
    >
      <span className="text-[8px] mr-2" style={{ color: "var(--gold-dim)" }} aria-hidden>◆</span>
      <span className="font-display text-[9px] font-semibold tracking-[0.35em] uppercase" style={{ color }}>
        {text}
      </span>
      <span className="text-[8px] ml-2" style={{ color: "var(--gold-dim)" }} aria-hidden>◆</span>
    </div>
  );
}

function bannerCopy(
  state: GameState,
  viewer: PlayerId,
  fopScene: { kind: string } & Record<string, unknown> | null,
): { text: string; tone: string } {
  const oppTurn = state.activePlayer !== viewer;
  const prefix = oppTurn ? "Opponent · " : "";

  // Resolution beats override the phase readout.
  if (fopScene) {
    if (fopScene.kind === "ability")
      return { text: `Resolving · ${String(fopScene.name)}`, tone: String(fopScene.tone ?? "gold") };
    if (fopScene.kind === "detonation")
      return { text: "Detonation", tone: "ember" };
    if (fopScene.kind === "upkeep")
      return { text: `${prefix}${String(fopScene.label)}`, tone: String(fopScene.tone ?? "gold") };
  }

  if (state.pendingAttack) {
    return state.pendingAttack.defender === viewer
      ? { text: "Choose Your Defense", tone: "ember" }
      : { text: "Opponent Defends", tone: "ember" };
  }
  if (state.pendingBankSpend) return { text: "Spend Banked Power?", tone: "dawn" };
  if (state.pendingOffensiveChoice) return { text: "Pick Your Attack", tone: "gold" };

  switch (state.phase) {
    case "pre-match":      return { text: "The Pact Forms", tone: "gold" };
    case "upkeep":         return { text: `${prefix}Upkeep`, tone: "gold" };
    case "income":         return { text: `${prefix}Income`, tone: "gold" };
    case "main-pre":       return { text: `${prefix}Plan Your Turn`, tone: "gold" };
    case "offensive-roll": {
      const attempts = state.players[state.activePlayer].rollAttemptsRemaining;
      return { text: `${prefix}Roll · ${3 - attempts} of 3`, tone: "gold" };
    }
    case "defensive-roll": return { text: `${prefix}Defense`, tone: "ember" };
    case "main-post":      return { text: `${prefix}Main Phase`, tone: "gold" };
    case "discard":        return { text: `${prefix}Discard`, tone: "gold" };
    case "match-end":      return { text: "Match Resolved", tone: "gold" };
  }
}

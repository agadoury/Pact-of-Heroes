/**
 * MatchActionBar — bottom band (bible Part 2.8).
 *
 * Skip/End Turn always occupies the leftmost slot (muted "skip" variant,
 * confirm-gated). The right slot is the contextual primary:
 *   main-pre        → ROLL
 *   offensive-roll  → CONFIRM (fire) + REROLL · N
 *   main-post       → END TURN (primary)
 *   opponent's turn → non-interactive "Opponent · {phase}" indicator
 */
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { GameState, HeroSnapshot, PlayerId } from "@/game/types";
import { stacksOf } from "@/game/status";
import { sfx } from "@/audio/sfx";

interface MatchActionBarProps {
  state: GameState;
  active: HeroSnapshot;
  viewer: PlayerId;
  enabled: boolean;
  onRoll: () => void;
  onAdvancePhase: () => void;
  onEndTurn: () => void;
  onMenu?: () => void;
}

export function MatchActionBar({ state, active, viewer, enabled, onRoll, onAdvancePhase, onEndTurn, onMenu }: MatchActionBarProps) {
  const [confirmSkip, setConfirmSkip] = useState(false);
  const myTurn = state.activePlayer === viewer;
  const phase = state.phase;
  const stunned = stacksOf(active, "stun") > 0;

  // Skip Turn is enabled during the viewer's planning windows.
  const skipEnabled = enabled && myTurn && (phase === "main-pre" || phase === "offensive-roll" || phase === "main-post");

  function skip() {
    setConfirmSkip(false);
    if (phase === "main-post") { onEndTurn(); return; }
    // From main-pre / offensive-roll: advance through to end of turn.
    onAdvancePhase();
  }

  let primary: { label: string; action: () => void; variant: "primary" | "crimson" } | null = null;
  let secondary: { label: string; action: () => void } | null = null;

  if (myTurn && !state.winner) {
    if (phase === "main-pre") {
      primary = { label: stunned ? "Skip Roll · Stunned" : "Roll", action: onRoll, variant: "primary" };
    } else if (phase === "offensive-roll") {
      primary = { label: "Confirm", action: onAdvancePhase, variant: "primary" };
      if (active.rollAttemptsRemaining > 0) {
        secondary = { label: `Reroll · ${active.rollAttemptsRemaining}`, action: onRoll };
      }
    } else if (phase === "main-post") {
      primary = { label: "End Turn", action: onEndTurn, variant: "primary" };
    }
  }

  return (
    <div className={cn(
      "fixed left-0 right-0 bottom-0 z-20",
      "px-3 pb-[max(env(safe-area-inset-bottom),10px)] pt-2",
    )}
      style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.75), rgba(10,10,20,0.4) 70%, transparent)", borderTop: "1px solid var(--frame-stroke-dim)" }}
    >
      <div className="flex items-stretch gap-2 max-w-2xl mx-auto">
        {onMenu && (
          <button
            onClick={onMenu}
            className="min-w-tap rounded-md grid place-items-center text-base"
            style={{ border: "1px solid rgba(212,165,72,0.2)", color: "var(--bone-dim)" }}
            aria-label="Menu"
          >
            ☰
          </button>
        )}

        {/* Skip Turn — always present, leftmost (bible: never removed from DOM). */}
        <button
          type="button"
          disabled={!skipEnabled}
          onClick={() => { sfx("ui-back"); setConfirmSkip(true); }}
          className={cn(
            "h-11 px-3 rounded-md font-display text-[8.5px] tracking-[0.15em] uppercase transition-opacity",
            !skipEnabled && "opacity-30 pointer-events-none saturate-50",
          )}
          style={{
            background: "linear-gradient(180deg, rgba(40,40,60,0.6), rgba(20,20,40,0.4))",
            border: "1px solid rgba(212,165,72,0.25)",
            color: "var(--bone-dim)",
          }}
        >
          Skip Turn
        </button>

        {secondary && (
          <button
            type="button"
            disabled={!enabled}
            onClick={secondary.action}
            className="flex-1 h-11 rounded-md font-display text-[10px] font-semibold tracking-[0.15em] uppercase disabled:opacity-50"
            style={{
              background: "linear-gradient(180deg, rgba(212,165,72,0.12), rgba(110,85,36,0.05))",
              border: "1px solid var(--gold-dim)",
              color: "var(--bone)",
            }}
          >
            {secondary.label}
          </button>
        )}

        {primary ? (
          <button
            type="button"
            disabled={!enabled}
            onClick={primary.action}
            className="flex-[1.5] h-11 rounded-md font-display text-[11px] font-extrabold tracking-[0.18em] uppercase
                       active:scale-[0.97] transition-transform disabled:opacity-50"
            style={primary.variant === "crimson" ? {
              background: "linear-gradient(180deg, var(--crimson-bright), var(--crimson))",
              border: "1px solid var(--crimson-bright)", color: "var(--bone-bright)",
              boxShadow: "0 0 16px rgba(196,56,72,0.5)",
            } : {
              background: "linear-gradient(180deg, var(--gold-bright), var(--gold-dim))",
              border: "1px solid var(--gold)", color: "var(--night-deep)",
              boxShadow: "0 0 16px rgba(212,165,72,0.4)",
            }}
          >
            {primary.label}
          </button>
        ) : (
          <span
            className="flex-[1.5] h-11 rounded-md grid place-items-center font-display text-[10px] tracking-[0.15em] uppercase"
            style={{
              background: "linear-gradient(180deg, rgba(240,104,72,0.08), rgba(240,104,72,0.03))",
              border: "1px solid rgba(240,104,72,0.15)",
              color: "var(--bone-dim)",
            }}
          >
            {state.winner ? "Match Over" : myTurn ? "Resolving…" : `Opponent · ${phaseShort(phase)}`}
          </span>
        )}
      </div>

      {/* Skip confirmation sheet (bible Part 2.8). */}
      {confirmSkip && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 backdrop-blur-sm px-6" onClick={() => setConfirmSkip(false)}>
          <div
            className="w-full max-w-[280px] rounded-lg p-4 text-center"
            style={{ background: "linear-gradient(180deg, rgba(26,24,48,0.98), rgba(10,10,20,0.98))", border: "1px solid var(--gold-dim)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="font-display text-[13px] font-bold tracking-wider uppercase mb-2" style={{ color: "var(--bone-bright)" }}>
              End your turn?
            </div>
            <p className="font-body italic text-[13px] mb-4" style={{ color: "var(--bone)" }}>
              Skipping forfeits your remaining rolls and any cards you could play.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmSkip(false)}
                className="flex-1 h-9 rounded-md font-display text-[9px] tracking-[0.15em] uppercase"
                style={{ border: "1px solid var(--gold-dim)", color: "var(--bone)" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={skip}
                className="flex-1 h-9 rounded-md font-display text-[9px] font-bold tracking-[0.15em] uppercase"
                style={{ background: "linear-gradient(180deg, var(--gold-bright), var(--gold-dim))", color: "var(--night-deep)" }}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function phaseShort(phase: GameState["phase"]): string {
  switch (phase) {
    case "upkeep": case "income": return "Upkeep";
    case "main-pre": return "Planning";
    case "offensive-roll": return "Rolling";
    case "defensive-roll": return "Defending";
    case "main-post": return "Planning";
    case "discard": return "Discard";
    default: return "…";
  }
}

/**
 * Ladder — the central decision surface (bible Part 3).
 *
 * Four rows, T4 at top. Each row: AbilityValueBadge (current achievable
 * damage / heal / utility glyph) + name + short text + ComboPipStrip.
 * Row state derives from the engine's LadderRowState; the UI-computed
 * lethal kill-preview (incoming >= opponent HP) overrides with the crimson
 * treatment.
 *
 * Tapping any row opens the ExpandedAbilityView modal (inspection for all
 * rows; Activate enabled only when the row is firing/triggered and an
 * onFire handler is provided).
 */
import { useMemo, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { AbilityDef, AbilityEffect, DiceCombo, HeroDefinition, HeroSnapshot, LadderRowState, SymbolId } from "@/game/types";
import { resolveAbilityFor } from "@/game/cards";
import { ComboPipStrip, derivePips } from "./ComboPips";
import { sfx } from "@/audio/sfx";

// ── Value extraction ─────────────────────────────────────────────────────────

type AbilityValue =
  | { kind: "damage"; amount: number }
  | { kind: "heal"; amount: number }
  | { kind: "utility"; glyph: string };

/** Current achievable value given settled dice (bible Part 3.3 — the badge is
 *  an honest readout of "what this deals right now"). */
function abilityValue(effect: AbilityEffect, combo: DiceCombo, dice: readonly HeroSnapshot["dice"][number][], bonus: number): AbilityValue {
  const dmg = primaryDamage(effect, combo, dice);
  if (dmg != null && dmg > 0) return { kind: "damage", amount: dmg + bonus };
  const heal = primaryHeal(effect);
  // Conditional heals (e.g. "2 HP per Frenzy stack") have base 0 — render the
  // utility glyph rather than a misleading "+0".
  if (heal != null && heal > 0) return { kind: "heal", amount: heal };
  return { kind: "utility", glyph: utilityGlyph(effect) };
}

function primaryDamage(effect: AbilityEffect, combo: DiceCombo, dice: readonly HeroSnapshot["dice"][number][]): number | null {
  switch (effect.kind) {
    case "damage": return effect.amount;
    case "scaling-damage": {
      const sym = comboSymbol(combo);
      const min = comboCount(combo);
      const have = sym ? dice.filter(d => d.faces[d.current].symbol === sym).length : min;
      const extras = Math.max(0, Math.min(effect.maxExtra, have - min));
      return effect.baseAmount + effect.perExtra * extras;
    }
    case "compound": {
      let total = 0, found = false;
      for (const e of effect.effects) {
        const d = primaryDamage(e, combo, dice);
        if (d != null) { total += d; found = true; }
      }
      return found ? total : null;
    }
    default: return null;
  }
}

function primaryHeal(effect: AbilityEffect): number | null {
  if (effect.kind === "heal") return effect.amount;
  if (effect.kind === "compound") {
    for (const e of effect.effects) {
      const h = primaryHeal(e);
      if (h != null) return h;
    }
  }
  return null;
}

function utilityGlyph(effect: AbilityEffect): string {
  switch (effect.kind) {
    case "remove-status": return "⊘";
    case "apply-status":  return "⊙";
    case "reduce-damage": return "◈";
    case "compound":      return utilityGlyph(effect.effects[0] ?? effect);
    default:              return "✦";
  }
}

function comboSymbol(combo: DiceCombo): SymbolId | null {
  switch (combo.kind) {
    case "symbol-count": case "matching": case "at-least": return combo.symbol;
    case "compound": {
      for (const c of combo.clauses) {
        const s = comboSymbol(c);
        if (s) return s;
      }
      return null;
    }
    default: return null;
  }
}
function comboCount(combo: DiceCombo): number {
  switch (combo.kind) {
    case "symbol-count": case "matching": case "at-least": return combo.count;
    default: return 0;
  }
}

// ── Ladder ───────────────────────────────────────────────────────────────────

interface LadderProps {
  hero: HeroDefinition;
  snapshot: HeroSnapshot;
  /** Opponent snapshot — used for the UI lethal kill-preview. */
  opponent: HeroSnapshot;
  /** True while the dice tray is mid-tumble (pips drop unlocked dice). */
  rolling: boolean;
  /** Fire handler — only wired for the viewer during offensive-roll. */
  onFire?: (abilityIndex: number) => void;
  dimmed?: boolean;
  className?: string;
}

export function Ladder({ hero, snapshot, opponent, rolling, onFire, dimmed, className }: LadderProps) {
  const [inspecting, setInspecting] = useState<number | null>(null);

  const resolved = useMemo(
    () => snapshot.activeOffense.map(a => resolveAbilityFor(snapshot, a, "offensive")),
    [snapshot],
  );

  // Render T4 → T1 (bible: highest tier first).
  const order = resolved
    .map((ability, idx) => ({ ability, idx }))
    .sort((a, b) => b.ability.tier - a.ability.tier);

  return (
    <div
      className={cn("flex flex-col gap-1.5 w-full transition-opacity duration-300", dimmed && "opacity-10 pointer-events-none", className)}
      aria-label={`${hero.name} ability ladder`}
    >
      {order.map(({ ability, idx }) => (
        <LadderRow
          key={idx}
          ability={ability}
          state={snapshot.ladderState[idx]}
          snapshot={snapshot}
          opponent={opponent}
          rolling={rolling}
          accent={hero.accentColor}
          onTap={() => setInspecting(idx)}
        />
      ))}

      {inspecting != null && resolved[inspecting] && (
        <ExpandedAbilityView
          ability={resolved[inspecting]}
          state={snapshot.ladderState[inspecting]}
          snapshot={snapshot}
          opponent={opponent}
          rolling={rolling}
          accent={hero.accentColor}
          canActivate={!!onFire && isCommittable(snapshot.ladderState[inspecting])}
          onActivate={() => { const i = inspecting; setInspecting(null); onFire?.(i); }}
          onClose={() => setInspecting(null)}
        />
      )}
    </div>
  );
}

function isCommittable(state: LadderRowState | undefined): boolean {
  return !!state && (state.kind === "firing" || state.kind === "triggered");
}

// ── Row ──────────────────────────────────────────────────────────────────────

function LadderRow({
  ability, state, snapshot, opponent, rolling, accent, onTap,
}: {
  ability: AbilityDef & { isReplaced?: boolean };
  state: LadderRowState | undefined;
  snapshot: HeroSnapshot;
  opponent: HeroSnapshot;
  rolling: boolean;
  accent: string;
  onTap: () => void;
}) {
  const isUlt = ability.tier === 4;
  const settled = rolling ? snapshot.dice.filter(d => d.locked) : snapshot.dice;
  const value = abilityValue(ability.effect, ability.combo, settled, snapshot.nextAbilityBonusDamage ?? 0);

  // UI lethal kill-preview (bible Decision 4): would this commit end the match?
  const committable = isCommittable(state);
  const isLethal = committable && value.kind === "damage" && value.amount >= opponent.hp;

  const kind = state?.kind ?? "out-of-reach";
  const eligible = kind === "firing" || kind === "triggered";
  const near = kind === "reachable";

  let border = "1px solid rgba(212,165,72,0.22)";
  let shadow = "none";
  let bg = "linear-gradient(90deg, rgba(20,20,42,0.85), rgba(26,24,48,0.65))";
  if (isLethal) {
    border = "1px solid var(--crimson-bright)";
    bg = "linear-gradient(90deg, rgba(138,24,40,0.55), rgba(60,16,16,0.4))";
    shadow = "0 0 0 1px var(--crimson-bright), 0 0 22px rgba(196,56,72,0.55)";
  } else if (eligible && isUlt) {
    border = "1px solid var(--dawn)";
    shadow = "0 0 0 1px var(--dawn), 0 0 18px rgba(251,191,36,0.45)";
  } else if (eligible) {
    border = "1px solid var(--gold)";
    bg = "linear-gradient(90deg, rgba(60,44,12,0.5), rgba(40,30,10,0.35))";
    shadow = "0 0 0 1px var(--gold), 0 0 16px rgba(212,165,72,0.35)";
  } else if (near) {
    border = "1px solid var(--gold-dim)";
    bg = "linear-gradient(90deg, rgba(40,32,10,0.45), rgba(26,24,48,0.65))";
  }

  const nameColor = isLethal ? "var(--crimson-bright)"
    : eligible && isUlt ? "var(--dawn-bright)"
    : eligible ? "var(--gold-bright)"
    : "var(--bone)";

  return (
    <motion.button
      type="button"
      layout
      onClick={onTap}
      animate={{ scale: eligible ? 1.01 : 1, opacity: kind === "out-of-reach" ? 0.55 : 1 }}
      transition={{ type: "spring", stiffness: 360, damping: 26 }}
      className={cn(
        "relative flex items-center gap-2 px-2 py-1.5 rounded-md text-left w-full min-h-[40px]",
        isLethal && "animate-lethal-pulse",
      )}
      style={{ border, background: bg, boxShadow: shadow, transition: "box-shadow 250ms, border-color 250ms" }}
      aria-label={`${ability.name}, tier ${ability.tier}${eligible ? ", ready" : ""}${isLethal ? ", lethal" : ""}`}
    >
      {/* Eligible left marker */}
      {(eligible || isLethal) && (
        <span aria-hidden className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[70%] rounded-r"
              style={{ background: isLethal ? "var(--crimson-bright)" : isUlt ? "var(--dawn)" : "var(--gold)",
                       boxShadow: `0 0 6px ${isLethal ? "var(--crimson-bright)" : "var(--gold-bright)"}` }} />
      )}

      <ValueBadge value={value} variant={isLethal ? "lethal" : eligible && isUlt ? "ultimate" : eligible ? "eligible" : "default"} />

      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="font-display font-bold text-[11px] tracking-[0.06em] truncate" style={{ color: nameColor }}>
            {ability.name}
          </span>
          {ability.isReplaced && (
            <span className="text-[10px] leading-none animate-pulse" style={{ color: "var(--dawn-bright)" }} title="Upgraded by Mastery">✦</span>
          )}
          {near && state?.kind === "reachable" && (
            <span className="font-num text-[8px] px-1 rounded-full" style={{ color: "var(--bone-dim)", border: "1px solid rgba(212,165,72,0.25)" }}>
              {Math.round(state.probability * 100)}%
            </span>
          )}
        </span>
        <span className={cn("block text-[10.5px] italic truncate font-body leading-tight",
          isLethal ? "not-italic font-display uppercase text-[9px] tracking-wider" : "")}
          style={{ color: isLethal ? "var(--crimson-bright)" : eligible ? "var(--bone)" : "var(--bone-dim)" }}>
          {isLethal ? "Lethal · will end the match" : ability.shortText}
        </span>
      </span>

      <ComboPipStrip combo={ability.combo} dice={snapshot.dice} rolling={rolling} size={16} />
      <span className="sr-only">{accent}</span>
    </motion.button>
  );
}

// ── ValueBadge ───────────────────────────────────────────────────────────────

function ValueBadge({ value, variant, large }: { value: AbilityValue; variant: "default" | "eligible" | "ultimate" | "lethal"; large?: boolean }) {
  const pulse = useScalingPulse(value.kind !== "utility" ? value.amount : 0);
  const border =
    variant === "lethal"   ? "1px solid var(--crimson-bright)" :
    variant === "ultimate" ? "1px solid var(--dawn)" :
    variant === "eligible" ? "1px solid var(--gold)" :
    "1px solid rgba(120,90,50,0.5)";
  const glow =
    variant === "lethal"   ? "0 0 12px rgba(196,56,72,0.6)" :
    variant === "ultimate" ? "0 0 8px rgba(251,191,36,0.5)" :
    variant === "eligible" ? "0 0 6px rgba(212,165,72,0.45)" : "none";
  const color =
    value.kind === "damage" ? "var(--ember-bright)" :
    value.kind === "heal"   ? "var(--green-bright)" :
    "var(--gold-bright)";
  const size = large ? 48 : 26;
  return (
    <span
      className={cn("grid place-items-center rounded-[5px] shrink-0 transition-transform", pulse && "scale-125")}
      style={{
        width: size, height: size, border, boxShadow: glow,
        background: "radial-gradient(circle at 30% 30%, rgba(0,0,0,0.35), rgba(0,0,0,0.65))",
        transitionDuration: "180ms",
      }}
    >
      <span className="font-display font-extrabold leading-none" style={{ color, fontSize: large ? 22 : 12 }}>
        {value.kind === "damage" ? value.amount : value.kind === "heal" ? `+${value.amount}` : value.glyph}
      </span>
    </span>
  );
}

function useScalingPulse(amount: number): boolean {
  const prev = useRef(amount);
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (amount > prev.current) {
      setPulse(true);
      const id = window.setTimeout(() => setPulse(false), 220);
      prev.current = amount;
      return () => window.clearTimeout(id);
    }
    prev.current = amount;
  }, [amount]);
  return pulse;
}

// ── ExpandedAbilityView (bible Part 6.7) ─────────────────────────────────────

function ExpandedAbilityView({
  ability, state, snapshot, opponent, rolling, accent, canActivate, onActivate, onClose,
}: {
  ability: AbilityDef & { isReplaced?: boolean };
  state: LadderRowState | undefined;
  snapshot: HeroSnapshot;
  opponent: HeroSnapshot;
  rolling: boolean;
  accent: string;
  canActivate: boolean;
  onActivate: () => void;
  onClose: () => void;
}) {
  const settled = rolling ? snapshot.dice.filter(d => d.locked) : snapshot.dice;
  const value = abilityValue(ability.effect, ability.combo, settled, snapshot.nextAbilityBonusDamage ?? 0);
  const lethal = canActivate && value.kind === "damage" && value.amount >= opponent.hp;
  const derived = derivePips(ability.combo, snapshot.dice, rolling);
  const missing = derived.outlinedCount;

  return (
    <div
      role="dialog"
      aria-label={`${ability.name} details`}
      className="fixed inset-0 z-50 grid place-items-center px-5 bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg p-4 fop-stripes relative"
        style={{
          background: "linear-gradient(180deg, rgba(14,14,28,0.97), rgba(10,10,20,0.96))",
          border: `1px solid ${lethal ? "var(--crimson-bright)" : "var(--gold)"}`,
          boxShadow: lethal
            ? "inset 0 0 60px rgba(196,56,72,0.12), 0 0 30px rgba(196,56,72,0.35)"
            : "inset 0 0 60px rgba(212,165,72,0.10), 0 0 30px rgba(212,165,72,0.3)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center font-display text-[9px] tracking-[0.35em] uppercase mb-3"
             style={{ color: lethal ? "var(--crimson-bright)" : "var(--gold)" }}>
          — {lethal ? "Lethal Strike" : "Ability"} —
        </div>

        <div className="flex items-center gap-3 mb-3">
          <ValueBadge value={value} variant={lethal ? "lethal" : canActivate ? (ability.tier === 4 ? "ultimate" : "eligible") : "default"} large />
          <div className="min-w-0">
            <div className="font-display font-bold text-lg tracking-wide truncate"
                 style={{ color: lethal ? "var(--crimson-bright)" : "var(--gold-bright)" }}>
              {ability.name} {ability.isReplaced && <span style={{ color: "var(--dawn-bright)" }}>✦</span>}
            </div>
            <div className="font-num text-[9px] tracking-[0.2em] uppercase" style={{ color: "var(--bone-dim)" }}>
              Tier {ability.tier}{ability.tier === 4 ? " · Ultimate" : ""} · {ability.damageType}
            </div>
          </div>
        </div>

        <p className="font-body text-[15px] leading-relaxed mb-3 min-h-[48px]" style={{ color: "var(--bone)" }}>
          {ability.longText}
        </p>

        {/* Combo readiness */}
        <div className="rounded p-2.5 mb-4" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--frame-stroke-dim)" }}>
          <div className="font-display text-[8px] tracking-[0.3em] uppercase mb-2 text-center" style={{ color: "var(--bone-dim)" }}>
            — Combo Readiness —
          </div>
          <div className="flex items-center justify-center">
            <ComboPipStrip combo={ability.combo} dice={snapshot.dice} rolling={rolling} size={22} />
          </div>
          <div className="text-center mt-2 font-num text-[9px] tracking-wider uppercase"
               style={{ color: missing === 0 ? "var(--gold-bright)" : "var(--ember-bright)" }}>
            {missing === 0 ? "✓ combo met" : `✗ ${missing} ${missing === 1 ? "face" : "faces"} still needed`}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-md font-display text-xs tracking-[0.18em] uppercase"
            style={{ border: "1px solid var(--gold-dim)", color: "var(--bone)", background: "linear-gradient(180deg, rgba(212,165,72,0.12), rgba(110,85,36,0.05))" }}
          >
            Close
          </button>
          {canActivate && (
            <button
              type="button"
              onClick={() => { sfx("ui-tap"); onActivate(); }}
              className="flex-[1.5] h-11 rounded-md font-display text-[13px] font-extrabold tracking-[0.2em] uppercase"
              style={lethal ? {
                background: "linear-gradient(180deg, var(--crimson-bright), var(--crimson))",
                border: "1px solid var(--crimson-bright)", color: "var(--bone-bright)",
                boxShadow: "0 0 20px rgba(196,56,72,0.5)",
              } : {
                background: "linear-gradient(180deg, var(--gold-bright), var(--gold-dim))",
                border: "1px solid var(--gold)", color: "var(--night-deep)",
                boxShadow: "0 0 20px rgba(212,165,72,0.5)",
              }}
            >
              {lethal ? "Lethal Strike" : "Activate"} ›
            </button>
          )}
        </div>
        {!canActivate && (
          <div className="text-center mt-2 font-num text-[8px] tracking-[0.1em] uppercase" style={{ color: "var(--ember-bright)" }}>
            {state?.kind === "reachable" ? "Reachable with rerolls — lock the matching dice" : "Not achievable this turn"}
          </div>
        )}
        <span className="sr-only">{accent}</span>
      </div>
    </div>
  );
}

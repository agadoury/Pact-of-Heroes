/**
 * HeroStrip — the persistent hero band (bible Part 2.2/2.3).
 *
 * Three stacked rows next to the portrait orb:
 *   1. name row  — hero name + (opponent only) hand-count + deck-count
 *   2. HP row    — "HP" label + value + full-width bar (wound-lag + shimmer)
 *   3. CP row    — "CP" label + numeric value + valence-grouped StatusTrack
 *
 * Perspective drives the tint: the viewer's strip is frost-tinted, the
 * non-viewer's ember-tinted (self/non-self encoding, independent of hero).
 * Damage/heal flashes are driven by watching the hp prop change.
 */
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { HeroDefinition, HeroSnapshot } from "@/game/types";
import { HeroPortrait, type HeroPortraitState } from "@/components/game/HeroPortrait";
import { StatusTrack } from "./chips";
import { useChoreoStore } from "@/store/choreoStore";

interface HeroStripProps {
  hero: HeroDefinition;
  snapshot: HeroSnapshot;
  perspective: "self" | "opponent";
  /** Is this the side whose turn it is? */
  active: boolean;
  className?: string;
}

const TINT = {
  self:     { edge: "var(--frost)",  glow: "rgba(108,176,232,0.35)", grad: "linear-gradient(180deg, rgba(74,140,200,0.10), transparent)" },
  opponent: { edge: "var(--ember)",  glow: "rgba(240,104,72,0.30)",  grad: "linear-gradient(180deg, rgba(200,74,42,0.10), transparent)" },
} as const;

export function HeroStrip({ hero, snapshot, perspective, active, className }: HeroStripProps) {
  const t = TINT[perspective];
  const flash = useHpFlash(snapshot.hp);
  const portraitState = usePortraitState(snapshot);

  return (
    <div
      className={cn(
        "relative w-full rounded-card px-2 py-1.5 overflow-hidden",
        "transition-[box-shadow,opacity] duration-200",
        !active && "opacity-90",
        className,
      )}
      style={{
        background: t.grad,
        boxShadow: active ? `0 0 14px ${t.glow}` : undefined,
      }}
      data-perspective={perspective}
    >
      {/* Damage / heal flash overlay */}
      {flash && (
        <span
          aria-hidden
          className="absolute inset-0 pointer-events-none rounded-card"
          style={{
            background: flash === "damage" ? "rgba(240,104,72,0.18)" : "rgba(108,176,232,0.14)",
            animation: "strip-flash 400ms ease-out forwards",
          }}
        />
      )}

      <div className="flex items-center gap-2.5">
        <HeroPortrait
          hero={hero.id}
          state={portraitState}
          size={perspective === "self" ? 52 : 46}
          accent={hero.accentColor}
          active={active}
        />
        <div className="flex-1 min-w-0">
          {/* Row 1 — name + indicators */}
          <div className="flex items-center gap-1.5">
            <span className="font-display font-bold tracking-[0.08em] uppercase truncate text-[11px]"
                  style={{ color: hero.accentColor }}>
              {hero.name.replace(/^The /, "")}
            </span>
            <span className="ml-auto flex items-center gap-1">
              {perspective === "opponent" && (
                <Indicator label="▤" value={snapshot.hand.length} edge={t.edge} title="Cards in hand" />
              )}
              <DeckIndicator count={snapshot.deck.length} edge={t.edge} />
            </span>
          </div>

          {/* Row 2 — HP */}
          <div className="mt-1 flex items-center gap-1.5">
            <StatLabel>HP</StatLabel>
            <StatValue critical={snapshot.hp <= snapshot.hpStart * 0.25}>{snapshot.hp}</StatValue>
            <HPBar hp={snapshot.hp} hpStart={snapshot.hpStart} hpCap={snapshot.hpCap} perspective={perspective} />
          </div>

          {/* Row 3 — CP + status track */}
          <div className="mt-1 flex items-center gap-1.5">
            <StatLabel>CP</StatLabel>
            <CPValue cp={snapshot.cp} />
            <div className="ml-auto min-w-0 overflow-hidden">
              <StatusTrack snapshot={snapshot} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes strip-flash {
          0%   { opacity: 0; }
          25%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Atoms ────────────────────────────────────────────────────────────────────

function StatLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-num text-[9px] font-semibold tracking-[0.2em] uppercase min-w-[16px] text-right"
          style={{ color: "var(--bone-dim)" }}>
      {children}
    </span>
  );
}

function StatValue({ children, critical }: { children: React.ReactNode; critical?: boolean }) {
  return (
    <span className="font-num text-[10px] font-bold min-w-[16px] text-right tabular-nums"
          style={{ color: critical ? "var(--ember-bright)" : "var(--bone-bright)" }}>
      {children}
    </span>
  );
}

function CPValue({ cp }: { cp: number }) {
  const capped = cp >= 15;
  const pulse = useValuePulse(cp);
  return (
    <span
      className={cn("font-num text-[10px] font-bold min-w-[18px] text-right tabular-nums transition-transform", pulse && "scale-125")}
      style={{
        color: capped ? "var(--dawn-bright)" : "var(--gold-bright)",
        textShadow: capped ? "0 0 4px rgba(253,224,136,0.6)" : undefined,
        transitionDuration: "200ms",
      }}
      title={capped ? "CP capped — spend before upkeep!" : `${cp} CP`}
    >
      {cp}
    </span>
  );
}

function HPBar({ hp, hpStart, hpCap, perspective }: { hp: number; hpStart: number; hpCap: number; perspective: "self" | "opponent" }) {
  const base = Math.max(0, Math.min(hp, hpStart)) / Math.max(1, hpStart) * 100;
  const over = Math.max(0, Math.min(hp, hpCap) - hpStart) / Math.max(1, hpCap - hpStart) * 100;
  const fill = perspective === "self"
    ? "linear-gradient(90deg, #1a4870, var(--frost))"
    : "linear-gradient(90deg, #8a1818, var(--ember))";

  // Wound layer — lags 100ms behind drops so the recent loss reads as a stripe.
  const [woundPct, setWoundPct] = useState(base);
  const prevRef = useRef(hp);
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = hp;
    if (hp >= prev) { setWoundPct(base); return; }
    const id = window.setTimeout(() => setWoundPct(base), 120);
    return () => window.clearTimeout(id);
  }, [hp, base]);

  return (
    <span className="relative flex-1 min-w-0 h-[5px] rounded-sm overflow-hidden"
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(212,165,72,0.15)" }}
          role="progressbar" aria-valuemin={0} aria-valuemax={hpStart} aria-valuenow={Math.max(0, hp)} aria-label="Health">
      {/* Wound layer */}
      <span className="absolute inset-y-0 left-0"
            style={{ width: `${woundPct}%`, background: "rgba(196,56,72,0.7)", transition: "width 700ms cubic-bezier(.25,1,.5,1)" }} />
      {/* Fill */}
      <span className="absolute inset-y-0 left-0 overflow-hidden"
            style={{ width: `${base}%`, background: fill, transition: "width 600ms cubic-bezier(.4,0,.2,1)", boxShadow: "0 0 4px rgba(108,176,232,0.4)" }}>
        <span className="absolute inset-0 animate-hp-shimmer"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)" }} aria-hidden />
      </span>
      {/* Over-heal segment */}
      {over > 0 && (
        <span className="absolute inset-y-0 right-0 w-[18%] overflow-hidden rounded-r-sm" aria-hidden>
          <span className="absolute inset-y-0 left-0 animate-pulse"
                style={{ width: `${over}%`, background: "linear-gradient(90deg, var(--dawn), var(--dawn-bright))" }} />
        </span>
      )}
    </span>
  );
}

function Indicator({ label, value, edge, title }: { label: string; value: number; edge: string; title: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 h-4 px-1 rounded-sm font-num text-[9px] font-bold"
          style={{ background: "linear-gradient(180deg, rgba(40,40,60,0.55), rgba(20,20,40,0.4))", border: `1px solid ${edge}66`, color: "var(--bone)" }}
          title={title}>
      <span className="opacity-70 text-[8px]">{label}</span>{value}
    </span>
  );
}

function DeckIndicator({ count, edge }: { count: number; edge: string }) {
  const low = count > 0 && count <= 3;
  const empty = count === 0;
  return (
    <span
      className={cn("relative inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-sm font-num text-[9px] font-bold",
        low && "animate-deck-low-pulse", empty && "opacity-40")}
      style={{
        background: "linear-gradient(180deg, #2a2a4a, #1a1a3a)",
        border: `1px solid ${low ? "var(--gold-bright)" : empty ? "var(--bone-deeper)" : `${edge}66`}`,
        color: low ? "var(--gold-bright)" : empty ? "var(--bone-deeper)" : "var(--bone)",
      }}
      title={`${count} cards in deck`}
    >
      {count}
    </span>
  );
}

// ── Hooks ────────────────────────────────────────────────────────────────────

/** Flash signal when hp changes: "damage" on drop, "heal" on rise. */
function useHpFlash(hp: number): "damage" | "heal" | null {
  const prevRef = useRef(hp);
  const [flash, setFlash] = useState<"damage" | "heal" | null>(null);
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = hp;
    if (hp === prev) return;
    setFlash(hp < prev ? "damage" : "heal");
    const id = window.setTimeout(() => setFlash(null), 450);
    return () => window.clearTimeout(id);
  }, [hp]);
  return flash;
}

/** Brief scale pulse when a numeric value changes. */
function useValuePulse(value: number): boolean {
  const prevRef = useRef(value);
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (prevRef.current === value) return;
    prevRef.current = value;
    setPulse(true);
    const id = window.setTimeout(() => setPulse(false), 220);
    return () => window.clearTimeout(id);
  }, [value]);
  return pulse;
}

/** Portrait reactivity driven by hero-state choreo events (same contract as
 *  the legacy HeroPanel). */
function usePortraitState(snapshot: HeroSnapshot): HeroPortraitState {
  const lastEvent = useChoreoStore(s => s.playing);
  const [state, setState] = useState<HeroPortraitState>("idle");
  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.t === "hero-state" && lastEvent.player === snapshot.player) {
      switch (lastEvent.state) {
        case "hit":          setState("hit"); break;
        case "defended":     setState("defended"); break;
        case "low-hp-enter": setState("low-hp"); break;
        case "low-hp-exit":  setState("idle"); break;
        case "victorious":   setState("victorious"); break;
        case "defeated":     setState("defeated"); break;
        case "idle":         setState("idle"); break;
      }
    }
  }, [lastEvent, snapshot.player]);
  if (state === "victorious" || state === "defeated") return state;
  if (snapshot.isLowHp) return "low-hp";
  return state;
}

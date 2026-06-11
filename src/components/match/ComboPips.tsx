/**
 * ComboPips — the per-pip combo readiness strip (bible Part 3.4).
 *
 * Three pip states form the commitment hierarchy:
 *   pulse    — required face is on a LOCKED die (committed, reroll-safe)
 *   gold     — required face is on an UNLOCKED settled die (present, at risk)
 *   outlined — required face is missing
 *
 * Tumbling dice contribute nothing: pass `rolling: true` while the tray is
 * mid-tumble and unlocked dice drop out of the derivation (gold reverts to
 * outlined; pulse survives).
 *
 * Handles all canonical combo kinds (symbol-count / n-of-a-kind / straight /
 * compound) plus the legacy kinds still present in content.
 */
import type { DiceCombo, Die, SymbolId } from "@/game/types";
import { FACE_GLYPHS, FACE_TINT } from "@/components/game/dieFaces";
import { cn } from "@/lib/cn";

export type PipState = "pulse" | "gold" | "outlined";

export interface Pip {
  state: PipState;
  /** What to render inside: a symbol glyph, a face number, or a wildcard. */
  face: { kind: "symbol"; symbol: SymbolId } | { kind: "number"; n: number } | { kind: "any" };
}

export interface PipDerivation {
  pips: Pip[];
  /** Separator glyphs between compound terms, keyed by pip index AFTER which
   *  the separator renders ("+" for and, "/" for or). */
  separators: Map<number, string>;
  outlinedCount: number;
}

// ── Derivation ───────────────────────────────────────────────────────────────

export function derivePips(combo: DiceCombo, dice: readonly Die[], rolling: boolean): PipDerivation {
  // Tumbling dice do not contribute (bible Part 3.4): when the tray is rolling,
  // only locked dice are "settled".
  const settled = rolling ? dice.filter(d => d.locked) : dice.slice();
  const d = deriveInner(combo, settled);
  return { ...d, outlinedCount: d.pips.filter(p => p.state === "outlined").length };
}

type Inner = { pips: Pip[]; separators: Map<number, string> };

function deriveInner(combo: DiceCombo, settled: readonly Die[]): Inner {
  const none = new Map<number, string>();
  switch (combo.kind) {
    case "symbol-count":
    case "matching":
    case "at-least":
      return { pips: symbolCountPips(combo.symbol, combo.count, settled), separators: none };

    case "specific-set": {
      // One pip per listed symbol (each needed once).
      const pips: Pip[] = [];
      const counts = new Map<SymbolId, number>();
      for (const s of combo.symbols) counts.set(s, (counts.get(s) ?? 0) + 1);
      for (const [sym, n] of counts) pips.push(...symbolCountPips(sym, n, settled));
      return { pips, separators: none };
    }

    case "n-of-a-kind":
      return { pips: nOfAKindPips(combo.count, settled), separators: none };

    case "matching-any":
      return { pips: nOfAKindPips(combo.count, settled), separators: none };

    case "any-of": {
      // N dice showing any of the listed symbols.
      const lockPool   = settled.filter(d => d.locked   && combo.symbols.includes(face(d).symbol)).length;
      const loosePool  = settled.filter(d => !d.locked  && combo.symbols.includes(face(d).symbol)).length;
      const pips: Pip[] = [];
      let locks = lockPool, loose = loosePool;
      for (let i = 0; i < combo.count; i++) {
        if (locks > 0)      { locks--; pips.push({ state: "pulse",    face: { kind: "any" } }); }
        else if (loose > 0) { loose--; pips.push({ state: "gold",     face: { kind: "any" } }); }
        else                 {         pips.push({ state: "outlined", face: { kind: "any" } }); }
      }
      return { pips, separators: none };
    }

    case "straight":
      return { pips: straightPips(combo.length, settled), separators: none };

    case "compound": {
      const pips: Pip[] = [];
      const separators = new Map<number, string>();
      const sep = combo.op === "and" ? "+" : "/";
      combo.clauses.forEach((c, i) => {
        if (i > 0 && pips.length > 0) separators.set(pips.length - 1, sep);
        pips.push(...deriveInner(c, settled).pips);
      });
      return { pips, separators };
    }
  }
}

function face(d: Die) { return d.faces[d.current]; }

function symbolCountPips(symbol: SymbolId, count: number, settled: readonly Die[]): Pip[] {
  let locked   = settled.filter(d => d.locked  && face(d).symbol === symbol).length;
  let unlocked = settled.filter(d => !d.locked && face(d).symbol === symbol).length;
  return Array.from({ length: count }, (): Pip => {
    if (locked > 0)   { locked--;   return { state: "pulse",    face: { kind: "symbol", symbol } }; }
    if (unlocked > 0) { unlocked--; return { state: "gold",     face: { kind: "symbol", symbol } }; }
    return { state: "outlined", face: { kind: "symbol", symbol } };
  });
}

function nOfAKindPips(n: number, settled: readonly Die[]): Pip[] {
  // Find the face value with the best (pulse-weighted) match count.
  let best: { value: number; locked: number; loose: number } = { value: 0, locked: 0, loose: 0 };
  for (let v = 1; v <= 6; v++) {
    const locked = settled.filter(d => d.locked  && face(d).faceValue === v).length;
    const loose  = settled.filter(d => !d.locked && face(d).faceValue === v).length;
    const total = locked + loose, bestTotal = best.locked + best.loose;
    if (total > bestTotal || (total === bestTotal && locked > best.locked)) {
      best = { value: v, locked, loose };
    }
  }
  let { locked, loose } = best;
  return Array.from({ length: n }, (): Pip => {
    if (locked > 0) { locked--; return { state: "pulse",    face: { kind: "any" } }; }
    if (loose > 0)  { loose--;  return { state: "gold",     face: { kind: "any" } }; }
    return { state: "outlined", face: { kind: "any" } };
  });
}

function straightPips(length: number, settled: readonly Die[]): Pip[] {
  // Best window: most pulse, then fewest outlined, then lowest start (bible 3.4).
  let best: { score: [number, number, number]; pips: Pip[] } | null = null;
  for (let s = 1; s <= 7 - length; s++) {
    const lockPool = new Map<number, number>();
    const loosePool = new Map<number, number>();
    for (const d of settled) {
      const v = face(d).faceValue;
      const m = d.locked ? lockPool : loosePool;
      m.set(v, (m.get(v) ?? 0) + 1);
    }
    const pips: Pip[] = [];
    for (let i = 0; i < length; i++) {
      const v = s + i;
      if ((lockPool.get(v) ?? 0) > 0)       { lockPool.set(v, lockPool.get(v)! - 1);   pips.push({ state: "pulse",    face: { kind: "number", n: v } }); }
      else if ((loosePool.get(v) ?? 0) > 0) { loosePool.set(v, loosePool.get(v)! - 1); pips.push({ state: "gold",     face: { kind: "number", n: v } }); }
      else                                    pips.push({ state: "outlined", face: { kind: "number", n: v } });
    }
    const score: [number, number, number] = [
      pips.filter(p => p.state === "pulse").length,
      -pips.filter(p => p.state === "outlined").length,
      -s,
    ];
    if (!best || cmp(score, best.score) > 0) best = { score, pips };
  }
  return best?.pips ?? [];
}

function cmp(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
  return 0;
}

// ── Rendering ────────────────────────────────────────────────────────────────

export function ComboPipStrip({
  combo, dice, rolling, size = 18, variant = "offensive",
}: {
  combo: DiceCombo;
  dice: readonly Die[];
  rolling: boolean;
  size?: number;
  /** defensive = static frost-tinted outlined pips (picker context). */
  variant?: "offensive" | "defensive";
}) {
  const derived = variant === "defensive"
    ? staticOutline(combo)
    : derivePips(combo, dice, rolling);

  return (
    <span className="flex items-center gap-[3px] shrink-0" aria-label="Combo requirement">
      {derived.pips.map((pip, i) => (
        <span key={i} className="inline-flex items-center gap-[3px]">
          <PipBox pip={pip} size={size} defensive={variant === "defensive"} />
          {derived.separators.get(i) && (
            <span className="text-[11px] font-num" style={{ color: "var(--gold-dim)" }}>
              {derived.separators.get(i)}
            </span>
          )}
        </span>
      ))}
    </span>
  );
}

function staticOutline(combo: DiceCombo): PipDerivation {
  const d = deriveInner(combo, []);
  return { ...d, outlinedCount: d.pips.length };
}

function PipBox({ pip, size, defensive }: { pip: Pip; size: number; defensive: boolean }) {
  const lit = pip.state !== "outlined";
  const border = defensive
    ? "rgba(108,176,232,0.5)"
    : pip.state === "pulse" ? "var(--gold-bright)"
    : pip.state === "gold"  ? "var(--gold)"
    : "var(--bone-deeper)";
  const color = defensive
    ? "var(--frost-pale)"
    : lit ? "var(--gold-bright)" : "var(--bone-deeper)";
  const bg = lit && !defensive
    ? "linear-gradient(135deg, rgba(60,44,12,0.7), rgba(40,30,10,0.5))"
    : "rgba(20,24,40,0.6)";

  return (
    <span
      className={cn(
        "relative grid place-items-center rounded-[3px] shrink-0 transition-colors duration-200",
        pip.state === "pulse" && "animate-pip-pulse",
      )}
      style={{ width: size, height: size, border: `1.5px solid ${border}`, background: bg, color }}
    >
      {pip.face.kind === "symbol" ? (
        <SymbolGlyph symbol={pip.face.symbol} size={size - 6} tint="currentColor" />
      ) : pip.face.kind === "number" ? (
        <span className="font-num font-bold" style={{ fontSize: size * 0.55 }}>{pip.face.n}</span>
      ) : (
        <span className="font-num font-bold" style={{ fontSize: size * 0.5 }}>◯</span>
      )}
    </span>
  );
}

export function SymbolGlyph({ symbol, size, tint }: { symbol: SymbolId; size: number; tint?: string }) {
  const Glyph = FACE_GLYPHS[symbol];
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden
         style={{ color: tint ?? FACE_TINT[symbol] ?? "currentColor" }} fill="currentColor">
      {Glyph ? <Glyph /> : <circle cx="50" cy="50" r="30" />}
    </svg>
  );
}

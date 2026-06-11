/**
 * Token system — bible Part 4.
 *
 *  SignatureChip    — hero signature tokens (Frost-bite, Cinder w/ fuse ring,
 *                     Verdict). Circular 22px chip, count badge top-right.
 *  SignatureCounter — banked counters (Frenzy, Radiance) read from
 *                     signatureState. Rectangular chip, visible even at 0.
 *  StatusChip       — universal statuses (burn/stun/protect/shield/regen +
 *                     Smouldering Stone), colored via the engine's
 *                     visualTreatment registry.
 *  StatusTrack      — valence-grouped container: positive (buffs the strip
 *                     owner) left, negative (hurts them) right, thin gold
 *                     divider between groups.
 */
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { HeroSnapshot, StatusInstance } from "@/game/types";
import { getStatusDef } from "@/game/status";
import { ICON_REGISTRY } from "@/components/game/StatusIcon";

// ── Shared bits ──────────────────────────────────────────────────────────────

function CountBadge({ n, color }: { n: number; color: string }) {
  if (n <= 0) return null;
  return (
    <span
      className="absolute -top-1.5 -right-1.5 z-[2] grid place-items-center min-w-[13px] h-[13px] px-px
                 rounded-full font-num text-[8px] font-bold leading-none"
      style={{ background: "rgba(10,10,20,0.95)", border: `1px solid ${color}`, color }}
    >
      {n}
    </span>
  );
}

function FrostbiteIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden>
      <path d="M12 2v20M4 7l16 10M20 7L4 17M12 2l-2.5 3M12 2l2.5 3M12 22l-2.5-3M12 22l2.5-3"
        fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function CinderIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden>
      <path d="M12 2c1.5 3 4 4 4 8a4 4 0 1 1-8 0c0-1 .3-2 .8-2.7C9 9 10 7 10 5.5 11 6.5 12 4 12 2z"
        fill="currentColor" />
    </svg>
  );
}
function VerdictIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden>
      <path d="M12 3v18M5 8h14M3 14h6l-3-6zM15 14h6l-3-6z"
        fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── SignatureChip ─────────────────────────────────────────────────────────────

type SignatureKind = "frostbite" | "cinder" | "verdict";

const SIG_STYLE: Record<SignatureKind, { color: string; bg: string; icon: () => React.JSX.Element }> = {
  frostbite: { color: "var(--frost-bright)", bg: "linear-gradient(180deg, rgba(108,176,232,0.35), rgba(74,140,200,0.2))", icon: FrostbiteIcon },
  cinder:    { color: "var(--ember-bright)", bg: "linear-gradient(180deg, rgba(240,104,72,0.4), rgba(200,74,42,0.25))",  icon: CinderIcon },
  verdict:   { color: "var(--dawn-bright)",  bg: "linear-gradient(180deg, rgba(253,224,136,0.35), rgba(212,165,72,0.2))", icon: VerdictIcon },
};

export function signatureKindOf(statusId: string): SignatureKind | null {
  if (statusId.endsWith(":frostbite")) return "frostbite";
  if (statusId.endsWith(":cinder"))    return "cinder";
  if (statusId.endsWith(":verdict"))   return "verdict";
  return null;
}

export function SignatureChip({ kind, count, title }: { kind: SignatureKind; count: number; title?: string }) {
  const s = SIG_STYLE[kind];
  const Icon = s.icon;
  // Cinder fuse: detonation threshold is 5 (engine truth); warn-pulse at 4+.
  const threshold = kind === "cinder" && count >= 4;
  const fuse = kind === "cinder" ? Math.min(100, (count / 5) * 100) : 0;
  return (
    <span
      className={cn(
        "relative grid place-items-center w-[22px] h-[22px] rounded-full shrink-0",
        threshold && "animate-cinder-pulse",
      )}
      style={{ background: s.bg, border: `1.5px solid ${s.color}`, color: s.color, boxShadow: `0 0 6px ${s.color}55` }}
      title={title}
      aria-label={`${kind} ${count}`}
    >
      {kind === "cinder" && (
        <span className="fuse-ring" style={{ ["--fuse" as never]: fuse }} aria-hidden />
      )}
      <Icon />
      <CountBadge n={count} color={s.color} />
    </span>
  );
}

// ── SignatureCounter (Frenzy / Radiance) ─────────────────────────────────────

const COUNTER_STYLE: Record<string, { color: string; label: string; cap: number }> = {
  frenzy:   { color: "var(--frost-bright)", label: "FRZ", cap: 6 },
  radiance: { color: "var(--gold-bright)",  label: "RAD", cap: 6 },
  rage:     { color: "var(--ember-bright)", label: "RGE", cap: 6 },
};

export function SignatureCounter({ counterKey, count }: { counterKey: string; count: number }) {
  const s = COUNTER_STYLE[counterKey] ?? { color: "var(--gold-bright)", label: counterKey.slice(0, 3).toUpperCase(), cap: 6 };
  const capped = count >= s.cap;
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center w-[26px] h-[22px] rounded shrink-0",
        "font-display text-[8px] font-bold tracking-wider",
        count === 0 && "opacity-55",
        capped && "animate-pulse-glow",
      )}
      style={{
        background: "linear-gradient(180deg, rgba(253,224,136,0.16), rgba(20,20,42,0.5))",
        border: `1.5px solid ${s.color}`,
        color: s.color,
        ["--glow" as never]: `${s.color}88`,
      }}
      title={`${counterKey} ${count}/${s.cap}`}
      aria-label={`${counterKey} ${count} of ${s.cap}`}
    >
      {s.label}
      <CountBadge n={count} color={s.color} />
    </span>
  );
}

// ── StatusChip (universal statuses) ──────────────────────────────────────────

export function StatusChip({ inst }: { inst: StatusInstance }) {
  const def = getStatusDef(inst.id);
  const color = def?.visualTreatment.color ?? "var(--bone-dim)";
  const iconKey = def?.visualTreatment.icon ?? "burn";
  const Icon = ICON_REGISTRY[iconKey] ?? ICON_REGISTRY[String(inst.id).split(":").pop() ?? ""] ?? null;
  return (
    <span
      className="relative grid place-items-center w-[22px] h-[22px] rounded-full shrink-0"
      style={{
        background: `color-mix(in oklab, ${color} 16%, transparent)`,
        border: `1.5px solid ${color}`,
        color,
      }}
      title={`${def?.name ?? inst.id} ×${inst.stacks}`}
      aria-label={`${def?.name ?? inst.id} ${inst.stacks}`}
    >
      {Icon ? <Icon size={13} /> : <span className="text-[9px] font-num font-bold">{String(inst.id)[0]?.toUpperCase()}</span>}
      <CountBadge n={inst.stacks} color={color} />
    </span>
  );
}

// ── StatusTrack — valence grouping (bible Part 4.6) ──────────────────────────

interface TrackItem {
  key: string;
  valence: "positive" | "negative";
  node: React.ReactNode;
}

export function StatusTrack({ snapshot, className }: { snapshot: HeroSnapshot; className?: string }) {
  const items: TrackItem[] = [];

  // Signature counters lead the positive group (the hero's signature slot —
  // visible even at 0 so the player always knows the mechanic exists).
  for (const [key, value] of Object.entries(snapshot.signatureState)) {
    if (!(key in COUNTER_STYLE) && value === 0) continue;  // unknown zero-keys stay hidden
    items.push({
      key: `ctr:${key}`,
      valence: "positive",
      node: <SignatureCounter counterKey={key} count={value} />,
    });
  }

  for (const inst of snapshot.statuses) {
    const sig = signatureKindOf(String(inst.id));
    if (sig) {
      // Opponent-applied signature accumulators always read negative on the
      // receiving strip (strip-owner valence — bible Part 4.6).
      items.push({
        key: `sig:${inst.id}`,
        valence: "negative",
        node: <SignatureChip kind={sig} count={inst.stacks} title={`${getStatusDef(inst.id)?.name ?? sig} ×${inst.stacks}`} />,
      });
    } else {
      const def = getStatusDef(inst.id);
      items.push({
        key: `st:${inst.id}`,
        valence: def?.type === "buff" ? "positive" : "negative",
        node: <StatusChip inst={inst} />,
      });
    }
  }

  const pos = items.filter(i => i.valence === "positive");
  const neg = items.filter(i => i.valence === "negative");

  return (
    <div className={cn("flex items-center gap-1.5 min-h-[26px]", className)} aria-label="Status tokens">
      <Group items={pos} valence="positive" />
      {pos.length > 0 && neg.length > 0 && (
        <span className="w-px h-4 shrink-0" style={{ background: "var(--frame-stroke-dim)" }} aria-hidden />
      )}
      <Group items={neg} valence="negative" />
    </div>
  );
}

function Group({ items, valence }: { items: TrackItem[]; valence: "positive" | "negative" }) {
  if (items.length === 0) return null;
  const tint = valence === "positive" ? "rgba(74,140,90,0.16)" : "rgba(196,56,72,0.16)";
  return (
    <span className="flex items-center gap-1.5 rounded-md px-0.5 py-0.5" style={{ background: tint }}>
      <AnimatePresence initial={false}>
        {items.map(i => (
          <motion.span
            key={i.key}
            layout
            initial={{ opacity: 0, x: 18, scale: 0.6 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ type: "spring", stiffness: 480, damping: 24 }}
            className="inline-flex"
          >
            {i.node}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
}

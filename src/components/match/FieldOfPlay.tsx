/**
 * FieldOfPlay — the middle-band resolution cinematic (bible Part 5).
 *
 * Renders the choreoStore's current FOP scene over the ability ladder:
 *   ability    — ability name display (Cinzel caps, tone glow)
 *   damage     — big damage number with overshoot pop + damage-type styling
 *   heal       — green +N
 *   upkeep     — lightweight label/value beat (status ticks, +1 CP, draw)
 *   detonation — "— Detonation —" + bursting cinder chips
 *
 * Pure presentation: scenes are set/cleared by the Choreographer pump.
 * Particles are CSS-only and capped; reduced-motion renders none.
 */
import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useChoreoStore, type FopScene, type FopTone } from "@/store/choreoStore";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const TONE_BG: Record<FopTone, string> = {
  gold:    "radial-gradient(ellipse at center, rgba(240,198,104,0.30) 0%, rgba(212,165,72,0.10) 40%, transparent 80%)",
  ember:   "radial-gradient(ellipse at center, rgba(240,104,72,0.35) 0%, rgba(200,74,42,0.12) 40%, transparent 80%)",
  frost:   "radial-gradient(ellipse at center, rgba(108,176,232,0.32) 0%, rgba(74,140,200,0.10) 40%, transparent 80%)",
  dawn:    "radial-gradient(ellipse at center, rgba(253,224,136,0.35) 0%, rgba(251,191,36,0.12) 40%, transparent 80%)",
  crimson: "radial-gradient(ellipse at center, rgba(196,56,72,0.40) 0%, rgba(138,24,40,0.15) 40%, transparent 80%)",
  green:   "radial-gradient(ellipse at center, rgba(108,176,122,0.30) 0%, rgba(74,140,90,0.10) 40%, transparent 80%)",
};

const TONE_COLOR: Record<FopTone, string> = {
  gold: "var(--gold-bright)", ember: "var(--ember-bright)", frost: "var(--frost-bright)",
  dawn: "var(--dawn-bright)", crimson: "var(--crimson-bright)", green: "var(--green-bright)",
};

export function FieldOfPlay() {
  const fop = useChoreoStore(s => s.fop);
  const reduced = useReducedMotion();

  return (
    <AnimatePresence>
      {fop && (
        <motion.div
          key={`${fop.startedAt}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="absolute inset-0 z-[5] grid place-items-center overflow-hidden fop-stripes pointer-events-none"
          style={{ background: TONE_BG[sceneTone(fop.scene)] }}
        >
          {!reduced && fop.scene.kind !== "upkeep" && <ParticleField tone={sceneTone(fop.scene)} burst={fop.scene.kind === "detonation"} />}
          <SceneContent scene={fop.scene} reduced={reduced} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function sceneTone(scene: FopScene): FopTone {
  return scene.tone;
}

function SceneContent({ scene, reduced }: { scene: FopScene; reduced: boolean }) {
  const color = TONE_COLOR[scene.tone];
  switch (scene.kind) {
    case "ability":
      return (
        <div className="text-center px-4">
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="font-display font-bold text-[15px] tracking-[0.25em] uppercase"
            style={{ color, textShadow: `0 0 8px ${color}` }}
          >
            {scene.name}
          </motion.div>
          <div className="font-num text-[8px] tracking-[0.3em] uppercase mt-1.5" style={{ color: "var(--bone-dim)" }}>
            Tier {scene.tier}{scene.critical ? " · Critical" : ""}
          </div>
        </div>
      );

    case "damage": {
      const big = scene.amount >= 10;
      const dmgColor =
        scene.type === "pure" ? "#B89FE0" :
        scene.type === "undefendable" ? "var(--bone-bright)" :
        scene.tone === "crimson" ? "var(--crimson-bright)" :
        "var(--ember-bright)";
      return (
        <div className="text-center">
          <motion.div
            initial={reduced ? { opacity: 0 } : { scale: 0, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
            className="font-display font-extrabold leading-none"
            style={{
              fontSize: big ? 64 : 52,
              color: dmgColor,
              textShadow: `0 0 24px ${dmgColor}aa, 0 4px 8px rgba(0,0,0,0.7)`,
            }}
          >
            {scene.amount}
          </motion.div>
          <div className="font-num text-[9px] tracking-[0.25em] uppercase mt-1" style={{ color: "var(--bone-dim)" }}>
            {scene.type === "normal" ? "damage" : `${scene.type} damage`}
          </div>
        </div>
      );
    }

    case "heal":
      return (
        <motion.div
          initial={reduced ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
          className="font-display font-extrabold leading-none"
          style={{ fontSize: 48, color: "var(--green-bright)", textShadow: "0 0 24px rgba(108,176,122,0.7)" }}
        >
          +{scene.amount}
        </motion.div>
      );

    case "upkeep":
      return (
        <div className="text-center">
          <div className="font-display text-[11px] font-semibold tracking-[0.25em] uppercase" style={{ color }}>
            {scene.label}
          </div>
          {scene.value != null && (
            <motion.div
              initial={reduced ? { opacity: 0 } : { scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
              className="font-display font-extrabold leading-none mt-1"
              style={{ fontSize: 34, color, textShadow: `0 0 14px ${color}88` }}
            >
              {scene.value}
            </motion.div>
          )}
          {scene.sub && (
            <div className="font-body italic text-[13px] mt-1" style={{ color: "var(--bone)" }}>
              {scene.sub}
            </div>
          )}
        </div>
      );

    case "detonation":
      return (
        <div className="text-center">
          <div className="font-display text-[13px] font-bold tracking-[0.25em] uppercase"
               style={{ color: "var(--ember-bright)", textShadow: "0 0 10px rgba(240,104,72,0.8)" }}>
            — Detonation —
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-2.5">
            {Array.from({ length: scene.stacks }, (_, i) => (
              <motion.span
                key={i}
                initial={reduced ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
                animate={reduced ? { opacity: 1 } : { scale: [0.5, 1.35, 1], opacity: 1 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="relative grid place-items-center w-6 h-6 rounded"
                style={{
                  background: "linear-gradient(180deg, rgba(240,104,72,0.55), rgba(200,74,42,0.3))",
                  border: "1.5px solid var(--dawn-bright)",
                  boxShadow: "0 0 8px rgba(240,104,72,0.7), 0 0 16px rgba(240,104,72,0.35)",
                  color: "var(--dawn-bright)",
                }}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden>
                  <path d="M12 2c1.5 3 4 4 4 8a4 4 0 1 1-8 0c0-1 .3-2 .8-2.7C9 9 10 7 10 5.5 11 6.5 12 4 12 2z" fill="currentColor" />
                </svg>
              </motion.span>
            ))}
          </div>
          <div className="font-num text-[9.5px] tracking-[0.12em] mt-2.5">
            <span style={{ color: "var(--dawn-bright)", fontWeight: 700 }}>Cinder ×{scene.stacks}</span>
            <span style={{ color: "var(--gold)" }}> → </span>
            <span style={{ color: "var(--ember-bright)", fontWeight: 700 }}>detonation</span>
          </div>
        </div>
      );
  }
}

// ── ParticleField — CSS-only ambient drift, hard-capped (bible Part 5.5) ────

function ParticleField({ tone, burst }: { tone: FopTone; burst: boolean }) {
  const color = TONE_COLOR[tone];
  const particles = useMemo(() => {
    const n = burst ? 14 : 8;
    return Array.from({ length: n }, (_, i) => ({
      left: 8 + ((i * 37 + 13) % 84),
      top: 12 + ((i * 53 + 29) % 70),
      size: 3 + ((i * 7) % 5),
      delay: (i * 167) % 1200,
      opacity: 0.4 + ((i * 11) % 50) / 100,
    }));
  }, [burst]);
  return (
    <span className="absolute inset-0 pointer-events-none" aria-hidden>
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full animate-particle-drift"
          style={{
            left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size,
            background: color, boxShadow: `0 0 4px ${color}`,
            opacity: p.opacity, animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
    </span>
  );
}

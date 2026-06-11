/**
 * DefenseSelectLayer — the DefensiveOverlay (bible Part 6.1), shown to the
 * defender after `attack-intended` fires while `state.pendingAttack` is set.
 *
 * Structure: ember-framed panel with a centered IncomingDamageBlock at the
 * top, then the two drafted defenses as equal-weight frost rows (no engine
 * recommendation — bible: the pick is the player's), each with name, effect
 * text, frost combo pips, and a dice-count badge. "Take It" sits below.
 *
 * If the defender has no defensive ladder, the overlay still appears with
 * just the "TAKE IT" option so the player explicitly acknowledges the hit.
 */
import { useGameStore, useInputUnlocked } from "@/store/gameStore";
import type { AbilityDef, DamageType } from "@/game/types";
import { ComboPipStrip } from "@/components/match/ComboPips";

export function DefenseSelectLayer() {
  const state    = useGameStore(s => s.state);
  const aiPlayer = useGameStore(s => s.aiPlayer);
  const dispatch = useGameStore(s => s.dispatch);
  const ready = useInputUnlocked();
  if (!state || !state.pendingAttack || !ready) return null;

  const pa = state.pendingAttack;
  const defenderIsAi = aiPlayer != null && aiPlayer === pa.defender;
  const defender = state.players[pa.defender];
  const ladder: readonly AbilityDef[] = defender?.activeDefense ?? [];

  function pick(idx: number | null) {
    dispatch({ kind: "select-defense", abilityIndex: idx });
  }

  return (
    <div
      role="dialog"
      aria-label="Pick a defense"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(env(safe-area-inset-bottom),16px)] pt-3 pointer-events-auto"
      style={{ background: "linear-gradient(0deg, var(--night-deep) 30%, rgba(10,10,20,0.92) 70%, transparent)" }}
    >
      <div
        className="relative mx-auto max-w-lg rounded-lg p-3.5"
        style={{
          background: "linear-gradient(180deg, rgba(20,14,14,0.97), rgba(14,10,14,0.96))",
          borderTop: "1px solid var(--ember)",
          borderBottom: "1px solid var(--ember)",
          boxShadow: "inset 0 0 60px rgba(200,74,42,0.15), 0 0 30px rgba(200,74,42,0.4)",
        }}
      >
        {/* Heraldic corner marks */}
        <span className="absolute top-1 left-2 text-[10px]" style={{ color: "var(--ember)" }} aria-hidden>◆</span>
        <span className="absolute top-1 right-2 text-[10px]" style={{ color: "var(--ember)" }} aria-hidden>◆</span>

        {/* Incoming damage block */}
        <div className="text-center rounded-md px-3 py-2 mb-3"
             style={{ background: "radial-gradient(ellipse at center, rgba(200,74,42,0.35), transparent 80%)" }}>
          <div className="font-display text-[9px] font-semibold tracking-[0.35em] uppercase"
               style={{ color: "var(--ember-bright)" }}>
            — Incoming —
          </div>
          <div className="font-display font-extrabold leading-none mt-1"
               style={{ fontSize: 32, color: "var(--ember-bright)", textShadow: "0 0 14px rgba(240,104,72,0.7)" }}>
            {pa.incomingAmount}
          </div>
          <div className="font-body italic text-[12px] mt-1" style={{ color: "var(--bone)" }}>
            {pa.abilityName} · T{pa.tier} · {damageTypeLabel(pa.damageType)}
          </div>
        </div>

        {ladder.length === 0 && (
          <div className="font-body italic text-xs text-center mb-3" style={{ color: "var(--bone-dim)" }}>
            No defensive ladder declared — take the hit.
          </div>
        )}

        {/* Equal-weight defense rows */}
        {ladder.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-2">
            {ladder.map((d, i) => (
              <button
                key={i}
                disabled={defenderIsAi}
                onClick={() => pick(i)}
                className="rounded-md px-2.5 py-2 text-left flex items-center gap-2.5 transition-all
                           hover:brightness-110 active:scale-[0.99] disabled:opacity-60 min-h-[48px]"
                style={{
                  background: "linear-gradient(90deg, rgba(20,24,40,0.85), rgba(26,30,48,0.65))",
                  border: "1px solid var(--frost)",
                }}
              >
                <span className="flex-1 min-w-0">
                  <span className="block font-display font-bold text-[12px] tracking-[0.05em] truncate"
                        style={{ color: "var(--frost-bright)" }}>
                    {d.name}
                  </span>
                  <span className="block font-body italic text-[11.5px] truncate" style={{ color: "var(--bone)" }}>
                    {d.shortText}
                  </span>
                </span>
                <ComboPipStrip combo={d.combo} dice={[]} rolling={false} size={14} variant="defensive" />
                <span className="font-num text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{ background: "rgba(74,140,200,0.2)", border: "1px solid rgba(74,140,200,0.4)", color: "var(--frost-bright)" }}>
                  {d.defenseDiceCount ?? 3}D
                </span>
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          disabled={defenderIsAi}
          onClick={() => pick(null)}
          className="w-full text-center font-display text-[10px] tracking-[0.2em] uppercase py-2.5 rounded-md
                     disabled:opacity-60 hover:brightness-125 transition-all"
          style={{ border: "1px solid rgba(212,165,72,0.25)", color: "var(--bone-dim)" }}
        >
          Take it · no defense
        </button>

        {defenderIsAi && (
          <div className="mt-2 font-num text-[9px] uppercase tracking-[0.25em] text-center" style={{ color: "var(--bone-dim)" }}>
            Opponent choosing…
          </div>
        )}
      </div>
    </div>
  );
}

function damageTypeLabel(t: DamageType): string {
  switch (t) {
    case "normal":        return "normal damage";
    case "undefendable":  return "undefendable";
    case "pure":          return "pure damage";
    case "collateral":    return "collateral";
    case "ultimate":      return "ultimate";
  }
}

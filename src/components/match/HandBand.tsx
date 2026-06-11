/**
 * HandBand — the player's hand (bible Part 2.9).
 *
 * Recognition surface, not a reading surface: compact 80×116 cards with a
 * cost pip, a cardCategory-tinted illustration glyph, a name strip, and the
 * compact effect text. Horizontal scroll with snap; tapping a card opens
 * the ExpandedCardView (Play / Sell / Cancel).
 */
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import type { Card, CardCategory, CardId, GameState, HeroSnapshot } from "@/game/types";
import { canPlay } from "@/game/cards";
import { useUIStore } from "@/store/uiStore";

const CATEGORY_STYLE: Record<CardCategory, { grad: string; glyph: string; color: string; label: string }> = {
  generic:          { grad: "linear-gradient(135deg, rgba(212,165,72,0.30), rgba(110,85,36,0.12))",   glyph: "◆", color: "var(--gold-bright)", label: "Generic" },
  "dice-manip":     { grad: "linear-gradient(135deg, rgba(160,130,220,0.30), rgba(70,50,110,0.12))",  glyph: "⚄", color: "var(--frost-bright)", label: "Dice" },
  "ladder-upgrade": { grad: "linear-gradient(135deg, rgba(253,224,136,0.35), rgba(140,110,60,0.15))", glyph: "▲", color: "var(--dawn-bright)", label: "Ladder" },
  signature:        { grad: "linear-gradient(135deg, rgba(200,74,42,0.35), rgba(110,32,16,0.15))",    glyph: "✦", color: "var(--ember-bright)", label: "Signature" },
};

const KIND_LABEL: Partial<Record<Card["kind"], string>> = {
  "main-phase": "Main", "roll-phase": "Roll", instant: "Instant", mastery: "Mastery",
  upgrade: "Mastery", "main-action": "Main", "roll-action": "Roll", status: "Main",
};

interface HandBandProps {
  state: GameState;
  hero: HeroSnapshot;
  opponent: HeroSnapshot;
  accent: string;
  enabled: boolean;
  onPlay: (cardId: CardId) => void;
  onSell: (cardId: CardId) => void;
  className?: string;
}

export function HandBand({ state, hero, opponent, accent, enabled, onPlay, onSell, className }: HandBandProps) {
  const liftedId = useUIStore(s => s.liftedCardId);
  const liftCard = useUIStore(s => s.liftCard);

  useEffect(() => {
    if (liftedId && !hero.hand.find(c => c.id === liftedId)) liftCard(null);
  }, [hero.hand, liftedId, liftCard]);

  const lifted = liftedId ? hero.hand.find(c => c.id === liftedId) : null;

  return (
    <>
      <div
        className={cn("relative w-full overflow-x-auto overflow-y-visible no-scrollbar", className)}
        style={{ WebkitOverflowScrolling: "touch", scrollSnapType: "x mandatory", scrollPaddingLeft: 12 }}
        aria-label="Hand"
      >
        <div className="flex items-end gap-1.5 px-3 pt-1 pb-1.5 min-w-max">
          {hero.hand.length === 0 && (
            <span className="font-body italic text-xs px-3 py-6" style={{ color: "var(--bone-dim)" }}>
              no cards in hand
            </span>
          )}
          {hero.hand.map(card => {
            const playable = enabled && canPlay(state, hero, opponent, card);
            const affordable = hero.cp >= card.cost;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => { if (enabled) liftCard(liftedId === card.id ? null : card.id); }}
                className={cn(
                  "relative shrink-0 transition-transform duration-200 ease-snap-soft",
                  liftedId === card.id && "-translate-y-1.5",
                )}
                style={{ scrollSnapAlign: "start" }}
                aria-label={`${card.name}, ${card.cost} CP${playable ? ", playable" : ""}`}
              >
                <HandCard card={card} playable={playable} affordable={affordable} dimmed={enabled && !playable} />
              </button>
            );
          })}
        </div>
      </div>

      {lifted && enabled && (
        <ExpandedCardView
          card={lifted}
          accent={accent}
          playable={canPlay(state, hero, opponent, lifted)}
          affordable={hero.cp >= lifted.cost}
          canSell={state.phase === "main-pre" || state.phase === "main-post"}
          onPlay={() => { onPlay(lifted.id); liftCard(null); }}
          onSell={() => { onSell(lifted.id); liftCard(null); }}
          onClose={() => liftCard(null)}
        />
      )}
    </>
  );
}

// ── HandCard (bible Part 2.9.3) ──────────────────────────────────────────────

export function HandCard({ card, playable, affordable, dimmed }: { card: Card; playable: boolean; affordable: boolean; dimmed?: boolean }) {
  const cat = CATEGORY_STYLE[card.cardCategory] ?? CATEGORY_STYLE.generic;
  return (
    <span
      className="relative flex flex-col w-[80px] h-[116px] rounded-md p-[5px] text-left"
      style={{
        background: "linear-gradient(180deg, #221a3a 0%, #14142a 100%)",
        border: playable ? "1.5px solid var(--gold)" : affordable ? "1px solid var(--frame-stroke)" : "1px solid var(--bone-deeper)",
        boxShadow: playable ? "0 0 10px rgba(212,165,72,0.35)" : "0 2px 8px rgba(0,0,0,0.5)",
        filter: dimmed ? "brightness(0.6) saturate(0.7)" : undefined,
      }}
    >
      {/* Cost pip */}
      <span
        className="absolute -top-[5px] -left-[5px] z-[2] grid place-items-center w-5 h-5 rounded-full font-display font-extrabold text-[11px]"
        style={affordable ? {
          background: "radial-gradient(circle at 30% 30%, var(--gold-glow), var(--gold))",
          border: "1px solid var(--gold-deep)", color: "var(--night-deep)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.6), 0 0 6px rgba(212,165,72,0.5)",
        } : {
          background: "radial-gradient(circle at 30% 30%, var(--bone-dim), var(--bone-deeper))",
          border: "1px solid var(--ember)", color: "var(--bone-dim)",
        }}
      >
        {card.cost}
      </span>

      {/* Illustration slot */}
      <span className="grid place-items-center h-[40px] rounded-[3px] mb-[3px]" style={{ background: cat.grad }}>
        <span className="text-[20px] leading-none" style={{ color: cat.color }}>{cat.glyph}</span>
      </span>

      {/* Name strip */}
      <span
        className="flex items-center gap-1 h-[15px] px-0.5 mb-[3px]"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.4), rgba(0,0,0,0.1))", borderBottom: "1px solid rgba(212,165,72,0.12)" }}
      >
        <span className="text-[8px] leading-none shrink-0" style={{ color: cat.color }}>{cat.glyph}</span>
        <span className="font-display font-bold text-[8px] tracking-[0.03em] truncate" style={{ color: "var(--bone-bright)" }}>
          {card.name}
        </span>
      </span>

      {/* Effect text */}
      <span className="flex-1 overflow-hidden font-body text-[8.5px] leading-[1.25] px-0.5" style={{ color: playable ? "var(--bone-bright)" : "var(--bone)" }}>
        {card.text}
      </span>

      {/* Kind tag */}
      <span className="font-num text-[6.5px] tracking-[0.2em] uppercase text-right pr-0.5" style={{ color: "var(--bone-dim)" }}>
        {KIND_LABEL[card.kind] ?? "Card"}
      </span>
    </span>
  );
}

// ── ExpandedCardView (bible Part 6.6) ────────────────────────────────────────

function ExpandedCardView({
  card, accent, playable, affordable, canSell, onPlay, onSell, onClose,
}: {
  card: Card;
  accent: string;
  playable: boolean;
  affordable: boolean;
  canSell: boolean;
  onPlay: () => void;
  onSell: () => void;
  onClose: () => void;
}) {
  const cat = CATEGORY_STYLE[card.cardCategory] ?? CATEGORY_STYLE.generic;
  return (
    <div
      role="dialog"
      aria-label={`Card ${card.name}`}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 px-6 bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[210px] rounded-lg p-3 flex flex-col relative"
        style={{
          background: "linear-gradient(180deg, #2a2440 0%, #14142a 100%)",
          border: "1.5px solid var(--gold)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.8), 0 0 20px rgba(212,165,72,0.4)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <span
          className="absolute -top-2 -left-2 grid place-items-center w-7 h-7 rounded-full font-display font-extrabold text-sm"
          style={affordable ? {
            background: "radial-gradient(circle at 30% 30%, var(--gold-glow), var(--gold))",
            border: "1px solid var(--gold-deep)", color: "var(--night-deep)",
            boxShadow: "0 0 8px rgba(212,165,72,0.5)",
          } : {
            background: "radial-gradient(circle at 30% 30%, var(--bone-dim), var(--bone-deeper))",
            border: "1px solid var(--ember)", color: "var(--bone-dim)",
          }}
        >
          {card.cost}
        </span>

        <span className="grid place-items-center h-[88px] rounded mb-2" style={{ background: cat.grad }}>
          <span className="text-[34px] leading-none" style={{ color: cat.color }}>{cat.glyph}</span>
        </span>

        <div className="text-center mb-2">
          <div className="font-display font-bold text-base tracking-wide" style={{ color: "var(--gold-bright)", textShadow: "0 0 6px rgba(240,198,104,0.3)" }}>
            {card.name}
          </div>
          <div className="font-num text-[8px] tracking-[0.2em] uppercase mt-0.5" style={{ color: "var(--bone-dim)" }}>
            {KIND_LABEL[card.kind] ?? "Card"} · {cat.label} · {card.cost} CP
          </div>
        </div>

        <div className="font-body text-[14px] leading-relaxed px-1 pt-2 min-h-[56px]"
             style={{ color: "var(--bone)", borderTop: "1px solid var(--frame-stroke-dim)" }}>
          {card.text}
        </div>
        {card.oncePerMatch && (
          <div className="font-num text-[7.5px] tracking-[0.15em] uppercase text-center mt-1.5" style={{ color: "var(--bone-dim)" }}>
            once per match
          </div>
        )}
      </div>

      <div className="flex gap-2 w-full max-w-[300px]" onClick={e => e.stopPropagation()}>
        {canSell && (
          <button
            type="button"
            onClick={onSell}
            className="flex-1 h-11 rounded-md font-display text-[10px] tracking-[0.14em] uppercase"
            style={{ border: "1px solid var(--gold-dim)", color: "var(--bone)", background: "linear-gradient(180deg, rgba(212,165,72,0.12), rgba(110,85,36,0.05))" }}
          >
            Sell · +1 CP
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-11 rounded-md font-display text-[10px] tracking-[0.14em] uppercase"
          style={{ border: "1px solid rgba(212,165,72,0.25)", color: "var(--bone-dim)", background: "linear-gradient(180deg, rgba(40,40,60,0.6), rgba(20,20,40,0.4))" }}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!playable}
          onClick={onPlay}
          className="flex-[1.4] h-11 rounded-md font-display text-xs font-extrabold tracking-[0.2em] uppercase disabled:opacity-40"
          style={{
            background: "linear-gradient(180deg, var(--gold-bright), var(--gold-dim))",
            border: "1px solid var(--gold)", color: "var(--night-deep)",
            boxShadow: playable ? "0 0 20px rgba(212,165,72,0.5)" : undefined,
          }}
        >
          Play ›
        </button>
      </div>
      {!playable && (
        <span className="font-num text-[8px] tracking-[0.12em] uppercase -mt-2" style={{ color: "var(--ember-bright)" }}>
          {!affordable ? `Need ${card.cost} CP` : "Wrong timing"}
        </span>
      )}
      <span className="sr-only">{accent}</span>
    </div>
  );
}

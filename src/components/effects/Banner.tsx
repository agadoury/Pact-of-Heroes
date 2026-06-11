/**
 * Banner — top-of-screen announcer for turn-started, match-won, etc.
 * Auto-dismisses; controlled by choreographer state. Cathedral styling:
 * gold Cinzel caps with diamond brackets over a night gradient.
 */
import { useChoreoStore } from "@/store/choreoStore";

export function Banner() {
  const text = useChoreoStore(s => s.bannerText);
  if (!text) return null;
  return (
    <div
      className="fixed top-[max(env(safe-area-inset-top),16px)] left-1/2 -translate-x-1/2 z-30
                 flex items-center gap-2 px-5 py-2 rounded-md pointer-events-none
                 animate-[banner-in_240ms_cubic-bezier(.34,1.56,.64,1)]"
      style={{
        background: "linear-gradient(180deg, rgba(26,24,48,0.96), rgba(10,10,20,0.96))",
        border: "1px solid var(--gold-dim)",
        boxShadow: "0 0 24px rgba(212,165,72,0.25), 0 8px 24px rgba(0,0,0,0.6)",
      }}
    >
      <span className="text-[9px]" style={{ color: "var(--gold-dim)" }} aria-hidden>◆</span>
      <span className="font-display font-bold text-[11px] tracking-[0.25em] uppercase"
            style={{ color: "var(--gold-bright)", textShadow: "0 0 8px rgba(240,198,104,0.4)" }}>
        {text}
      </span>
      <span className="text-[9px]" style={{ color: "var(--gold-dim)" }} aria-hidden>◆</span>
      <style>{`
        @keyframes banner-in {
          from { transform: translate(-50%, -16px); opacity: 0; }
          to   { transform: translate(-50%, 0);     opacity: 1; }
        }
      `}</style>
    </div>
  );
}

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    // Mobile-first; lg: 1024px is the mobile -> desktop boundary.
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        // Arena (night palette)
        "arena-0": "var(--c-arena-0)",
        "arena-1": "var(--c-arena-1)",
        "arena-2": "var(--c-arena-2)",
        // Brand & semantic (legacy aliases — now gold/night values)
        brand:   "var(--c-brand)",
        ember:   "var(--c-ember)",
        cyan:    "var(--c-cyan)",
        dmg:     "var(--c-dmg)",
        heal:    "var(--c-heal)",
        ink:     "var(--c-ink)",
        muted:   "var(--c-muted)",
        // Bible palette — first-class names for the revamped match UI.
        gold:        { DEFAULT: "var(--gold)", bright: "var(--gold-bright)", glow: "var(--gold-glow)", dim: "var(--gold-dim)", deep: "var(--gold-deep)" },
        frost:       { DEFAULT: "var(--frost)", bright: "var(--frost-bright)", deep: "var(--frost-deep)", pale: "var(--frost-pale)" },
        emberfire:   { DEFAULT: "var(--ember)", bright: "var(--ember-bright)", deep: "var(--ember-deep)", glow: "var(--ember-glow)" },
        dawn:        { DEFAULT: "var(--dawn)", bright: "var(--dawn-bright)", deep: "var(--dawn-deep)" },
        bone:        { DEFAULT: "var(--bone)", bright: "var(--bone-bright)", dim: "var(--bone-dim)", deeper: "var(--bone-deeper)" },
        crimson:     { DEFAULT: "var(--crimson)", bright: "var(--crimson-bright)" },
        greenlife:   { DEFAULT: "var(--green)", bright: "var(--green-bright)", deep: "var(--green-deep)" },
        "night-velvet": "var(--night-velvet)",
        "night-stone":  "var(--night-stone)",
      },
      fontFamily: {
        display: ["Cinzel", "Georgia", "serif"],
        body:    ["Cormorant Garamond", "Georgia", "serif"],
        num:     ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        // Display ramp
        "d-1": ["clamp(1.6rem, 5vw, 2.4rem)",   { lineHeight: "1.05", letterSpacing: "0.04em" }],
        "d-2": ["clamp(1.25rem, 4vw, 1.75rem)", { lineHeight: "1.1",  letterSpacing: "0.05em" }],
        "d-3": ["clamp(1.05rem, 3vw, 1.35rem)", { lineHeight: "1.15", letterSpacing: "0.06em" }],
        // Numeric
        "num-xl": ["clamp(2.5rem, 8vw, 4rem)",  { lineHeight: "1",    letterSpacing: "-0.01em" }],
        "num-l":  ["clamp(1.5rem, 5vw, 2rem)",  { lineHeight: "1" }],
        "num-m":  ["1.125rem", { lineHeight: "1" }],
      },
      spacing: {
        // Touch targets
        tap:     "44px",   // HIG min
        "tap-l": "56px",   // primary actions
        "tap-xl":"64px",
        // Safe-area helpers
        "safe-t":"env(safe-area-inset-top)",
        "safe-b":"env(safe-area-inset-bottom)",
        "safe-l":"env(safe-area-inset-left)",
        "safe-r":"env(safe-area-inset-right)",
      },
      borderRadius: {
        die:  "12px",
        card: "10px",
      },
      boxShadow: {
        "panel":   "0 1px 0 rgba(240,198,104,0.07) inset, 0 -1px 0 rgba(0,0,0,0.4) inset, 0 12px 24px rgba(5,5,16,0.5)",
        "die":     "0 2px 0 rgba(0,0,0,0.35), 0 6px 14px rgba(5,5,16,0.55)",
        "ember":   "0 0 24px rgba(240,198,104,0.45)",
        "brand":   "0 0 24px rgba(212,165,72,0.45)",
        "lethal":  "0 0 0 1px var(--crimson-bright), 0 0 22px rgba(196,56,72,0.55)",
        "eligible":"0 0 0 1px var(--gold), 0 0 16px rgba(212,165,72,0.35)",
        "ultimate":"0 0 0 1px var(--dawn), 0 0 18px rgba(251,191,36,0.45)",
      },
      transitionTimingFunction: {
        "snap":        "cubic-bezier(.34,1.56,.64,1)",
        "snap-soft":   "cubic-bezier(.22,1,.36,1)",
        "in-quart":    "cubic-bezier(.5,0,.75,0)",
        "out-quart":   "cubic-bezier(.25,1,.5,1)",
      },
      transitionDuration: {
        "hitstop":  "100ms",
        "ladder":   "200ms",
        "tumble":   "900ms",   // mobile baseline
        "tumble-d": "1200ms",  // desktop
      },
      keyframes: {
        "torch-flicker": {
          "0%,100%": { opacity: "0.85" },
          "47%":     { opacity: "0.7"  },
          "53%":     { opacity: "1"    },
        },
        "breathe": {
          "0%,100%": { transform: "scale(1)" },
          "50%":     { transform: "scale(1.015)" },
        },
        "pulse-glow": {
          "0%,100%": { filter: "drop-shadow(0 0 8px var(--glow, currentColor))" },
          "50%":     { filter: "drop-shadow(0 0 18px var(--glow, currentColor))" },
        },
        // ── Bible keyframes (Part 1.5) ─────────────────────────────────────
        "lethal-pulse": {
          "0%,100%": { boxShadow: "0 0 0 1px var(--crimson-bright), 0 0 22px rgba(196,56,72,0.55)" },
          "50%":     { boxShadow: "0 0 0 1px var(--crimson-bright), 0 0 32px rgba(196,56,72,0.8)" },
        },
        "cinder-pulse": {
          "0%,100%": { transform: "scale(1)",    boxShadow: "0 0 6px rgba(240,104,72,0.5)" },
          "50%":     { transform: "scale(1.06)", boxShadow: "0 0 14px rgba(255,200,100,0.9)" },
        },
        "pip-pulse": {
          "0%,100%": { boxShadow: "0 0 5px rgba(212,165,72,0.5), inset 0 1px 0 rgba(240,198,104,0.3)" },
          "50%":     { boxShadow: "0 0 12px rgba(240,198,104,0.9), inset 0 1px 0 rgba(253,224,136,0.5)" },
        },
        "hp-shimmer": {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "damage-pop": {
          "0%":   { transform: "scale(0)",   opacity: "0" },
          "60%":  { transform: "scale(1.1)", opacity: "1" },
          "100%": { transform: "scale(1)",   opacity: "1" },
        },
        "particle-drift": {
          "0%":   { transform: "translateY(0) scale(1)",      opacity: "1" },
          "100%": { transform: "translateY(-14px) scale(1.2)", opacity: "0" },
        },
        "deck-low-pulse": {
          "0%,100%": { boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 0 4px rgba(212,165,72,0.4)" },
          "50%":     { boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 0 8px rgba(240,198,104,0.8)" },
        },
        "counter-gain": {
          "0%":   { transform: "scale(1)" },
          "40%":  { transform: "scale(1.18)" },
          "100%": { transform: "scale(1)" },
        },
        "deny-shake": {
          "0%,100%": { transform: "translateX(0)" },
          "25%":     { transform: "translateX(-2px)" },
          "75%":     { transform: "translateX(2px)" },
        },
      },
      animation: {
        "torch-flicker": "torch-flicker 2.4s ease-in-out infinite",
        "breathe":       "breathe 4s ease-in-out infinite",
        "pulse-glow":    "pulse-glow 1.8s ease-in-out infinite",
        "lethal-pulse":  "lethal-pulse 1.2s ease-in-out infinite",
        "cinder-pulse":  "cinder-pulse 0.6s ease-in-out infinite",
        "pip-pulse":     "pip-pulse 1.6s ease-in-out infinite",
        "hp-shimmer":    "hp-shimmer 2.6s ease-in-out infinite",
        "damage-pop":    "damage-pop 0.25s cubic-bezier(.34,1.56,.64,1) both",
        "particle-drift":"particle-drift 1.5s ease-out infinite",
        "deck-low-pulse":"deck-low-pulse 2s ease-in-out infinite",
        "counter-gain":  "counter-gain 0.35s cubic-bezier(.2,.7,.2,1)",
        "deny-shake":    "deny-shake 0.1s linear 2",
      },
    },
  },
  plugins: [],
};

export default config;

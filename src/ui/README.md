# src/ui — the rebuilt game UI

Greenfield rebuild of the Pact of Heroes UI. The engine (`src/game/`) and
stores (`src/store/`) stay canonical; this tree consumes them through a
selector layer that translates engine state into UI-shaped props.

The old UI tree (`src/components/`) remains in place until this rebuild
reaches match-screen parity; at that point routes flip to the new
`MatchScreen` and the old tree is deleted.

## Directory layout

```
theme/            CSS-variable tokens, fonts, shared @keyframes, reset
components/
  atoms/          Lowest-level primitives (Button, Icon, StatLabel, ...)
  tokens/         Signature/status/buff chips (SignatureChip, StatusChip, ...)
  bands/          The seven horizontal bands of the match screen
  ladder/         Ability ladder + defensive picker components
  fop/            Field-of-play resolution cinematics
  modals/         Ability + card detail modals
  overlays/       Modal overlays (Defensive, Spend, Tooltip, Toast, ActivityLog)
  screens/        Top-level route screens (Home, HeroSelect, Match, Summary, ...)
  shared/         Cross-component utilities (ScreenBands container, etc.)
hooks/            useGameState, useReducedMotion, useLongPress, ...
util/             clsx re-export, easing constants, duration constants
types/            UI-specific types (not game state — those live in src/game/types.ts)
store/            UI-only zustand store (transient animation + interaction state)
selectors/        Pure functions turning engine state into UI-shaped props
content/          UI-side content (hero barks, keyword registry, ...)
locale/           i18n string tables (en, fr)
```

## Design principles

1. **Engine is truth.** When engine state and bible spec disagree, the engine wins.
   See `DECISIONS.md` for the specific bible deviations this rebuild adopts.
2. **Bible is visual reference.** Colors, typography, spacing, animation timings,
   component names/structure, and interaction patterns come from the bible verbatim.
3. **CSS Modules only** for component-scoped styles. Global CSS lives in `theme/`.
   No Tailwind classes in this tree.
4. **Multiplayer-ready conventions** even though MVP is single-player: components
   take `playerId: PlayerId`, not `side: 'self' | 'opponent'`. Data keyed by PlayerId,
   not by side.
5. **No inline `style` attributes** except for dynamic CSS custom properties driving
   animations (canonical case: Cinder fuse-ring `--fuse` percentage).
6. **No magic numbers.** All timings reference `util/duration.ts`; all colors
   reference `theme/tokens.css` variables.

# Pact of Heroes — Agent Handoff

**Last updated:** 2026-07-06 (game-loop stall fixes + AAA polish pass)
**Branch:** `claude/game-polish-bugs-unafrj` (from `main`)
**Live:** Deployed on Vercel from `main`

You are picking up mid-rebuild. This doc gives you the fastest possible
onboarding so you can be productive without re-deriving the last few weeks
of work.

---

> Game reference: `docs/design-bible.html` — the single consolidated design
> doc (rules, heroes, abilities, cards, tokens, balance). Data sections are
> generated from `src/content`; regenerate via `npx tsx scripts/build-design-doc.ts`.

## What Pact of Heroes is

A 1v1 dice-and-card duel. Mobile-first (390×844 portrait target). Installable
as a PWA. Two heroes face off; each turn: upkeep → roll five dice (up to
three attempts) → commit an ability (or fizzle) → defender picks a defense
→ damage resolves → repeat until HP hits 0.

Three heroes ship in content: **Berserker** (frost/rush), **Pyromancer**
(ember/burn), **Lightbearer** (dawn/survival). Each has a full ability
catalog (T1–T4 + defenses), a signature passive (Frenzy / Ashfall+Cinder /
Radiance), and a 12-card deck.

---

## Project layout

```
src/
  App.tsx                 Router root — wraps <RouteTransition><Routes>…
  main.tsx                Bootstraps: theme CSS, migrateLegacyStorage(),
                          wireMatchPersistence(), ambient music (audio-unlock)

  game/                   ENGINE — pure TypeScript, no React
    engine.ts             applyAction(state, action) → { state, events }
    phases.ts             Phase machinery (upkeep/income/main-pre/…)
    ai.ts                 nextAiAction(state, playerId) → Action
    cards.ts              canPlay + effect resolution
    dice.ts               DiceCombo evaluation + landing-rate audit
    damage.ts             Damage pipeline
    status.ts             Universal statuses (burn/stun/protect/shield/regen)
    match-summary.ts      Stats aggregator
    types.ts              THE CANONICAL ENGINE TYPES

  audio/                  WebAudio SFX synth (no assets)
    manager.ts            audio.play, setSfxVolume, setMuted
    sfx.ts                20 synth SFX recipes
    library.ts            (unused — reserved for Howler-backed sprite loader)

  content/                Hero + card data
    heroes/{berserker,pyromancer,lightbearer}.ts
    cards/{generic,berserker,pyromancer,lightbearer}.ts
    index.ts              getHero / getRegisteredHeroIds / getCardCatalog / getDeckCards

  store/                  Engine-adjacent stores
    gameStore.ts          Zustand — { state, dispatch, startMatch, reset,
                          matchLog, lastEvents, mode, aiPlayer }
    deckStorage.ts        loadDeck / saveDeck (per hero, localStorage)
    loadoutStorage.ts     loadLoadout / saveLoadout (per hero)

  lib/
    migrate-storage.ts    One-shot 'diceborn:*' → 'pact-of-heroes:*' migration

  styles/globals.css      html/body reset + safe-select utility only

  ui/                     THE UI TREE — rebuilt greenfield
    theme/                Design tokens + reset + fonts + shared @keyframes
    types/                UI-only types (PhaseDisplay, LadderAbility,
                          FOPScene, EffectSegment, StatusToken, …)
    util/                 duration, easing, clsx, parseEffect, ambientMusic
    hooks/                useReducedMotion, useLongPress, useGameState,
                          useAnimationTimer, useResolutionDriver,
                          useAiDriver, useAudioDriver, useJuice
    store/                uiStore (view-only state), matchPersistence,
                          fopAggregator lives under selectors/
    selectors/            Pure functions turning engine state → UI props
                          (phaseDisplay, ladder, statusTrack, cardVisual,
                          derivePips, actionBar, abilityValue, fopAggregator)
    content/              (empty — reserved for UI-side content like barks)
    components/
      atoms/              Button, Icon (Lucide SVGs), Pip, ProgressBar,
                          StatLabel, StatValue, StatDivider
      bands/              The 7 horizontal bands of MatchScreen +
                          HeroStrip / DiceTray / Hand / etc.
      ladder/             AbilityRow / AbilityLadder / AbilityValueBadge
                          / ComboGlyphStrip / DefensiveRow / DefensiveLadder
                          / DefDiceBadge / TierBadge
      tokens/             SignatureChip / StatusChip / BuffChip / StatusTrack
                          / ConsumedToken
      fop/                FieldOfPlay + all resolution content components
      modals/             (currently empty — modals live under overlays/)
      overlays/           DefensiveOverlay / SpendOverlay / ExpandedAbilityView
                          / ExpandedCardView / CardPlayOverlay
                          / OffensivePickPrompt / InstantPrompt / ActivityLog
                          / TooltipRenderer / ToastQueue
      screens/            HomeScreen / HeroSelectScreen / HeroBookScreen /
                          HeroDetailScreen / HeroCustomizationScreen /
                          OnboardingFlow / MatchScreen / MatchIntro /
                          MatchSummary / SettingsScreen / UIPreview
      shared/             ScreenBands / ScreenShake / TurnBanner /
                          DamageFloaters / AmbientBackdrop / HeroSilhouette
                          / RouteTransition

tests/
  ui/                     Vitest tests for UI logic
    parseEffect.test.ts   Card-text → EffectSegment parser
    derivePips.test.ts    Pip derivation for all combo kinds
    fopAggregator.test.ts FOPScene aggregator with cross-batch state
    matchFlow.test.ts     Integration tests dispatching through the UI's
                          exact action pattern

scripts/
  simulate.ts             npm run simulate — AI-vs-AI matches + landing-rate audit
```

---

## Cardinal architectural rule

**The engine is source of truth for data + mechanics. The bible is source
of truth for visuals + interaction.** Where they collide, engine wins.

See `src/ui/DECISIONS.md` for every specific reconciliation — this includes:

- Engine's `Phase` (`main-pre` / `offensive-roll` / etc.) is authoritative;
  bible's `PhaseEnum` (`roll` / `plan` / `resolve`) is a UI **projection**
  built by `selectors/phaseDisplay.ts`.
- `DieFace` is the engine's object shape `{ faceValue, symbol, label }`, not
  the bible's string-literal union.
- `Frenzy` is a 0–6 counter gained from taking damage (not a binary glyph).
- `HAND_CAP = 6` (bible said 8; wrong).
- Card kind mapping: `main-phase`/`roll-phase`/`instant`/`mastery`.
- Real Instant cards: **Counterstrike, Phoenix Veil, Final Heat, Aegis of
  Dawn** (bible's Sanctuary/Faith/Steady/Sun's Blessing/Vow of Light are
  all wrong).
- Real ability names: Cleave (not Brutal Strike), Wolf's Howl (not Ragnarok),
  Judgment of the Sun (not Judgment), Pyro Lance (not Pyre Lance), etc.

---

## Runtime dataflow

```
                          ┌─────────────────────┐
                          │  User interaction   │
                          │  (tap, drag, …)     │
                          └──────────┬──────────┘
                                     │ handlers in MatchScreen
                                     ▼
                          ┌─────────────────────┐
                          │  gameStore.dispatch │
                          │  (action envelope)  │
                          └──────────┬──────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │  applyAction()      │
                          │  (src/game/engine)  │
                          └──────────┬──────────┘
                                     │ { state, events[] }
                                     ▼
                     ┌───────────────────────────────┐
                     │  gameStore state & matchLog   │
                     └───────┬────────────┬──────────┘
                             │            │
                subscribe    │            │  select
                             ▼            ▼
                  ┌───────────────┐  ┌─────────────┐
                  │ FOPScene      │  │ Selectors   │
                  │ aggregator    │  │ (phase,     │
                  │ (subscribes   │  │  ladder,    │
                  │  to lastEvents│  │  status, …) │
                  │  and folds    │  └─────┬───────┘
                  │  into queue)  │        │
                  └───────┬───────┘        │
                          │                │
                          ▼                ▼
                  ┌───────────────────────────┐
                  │ uiStore.resolutionQueue,  │
                  │  currentResolution, phase │
                  └───────┬───────────────────┘
                          │
              useResolutionDriver walks phases
                          │
                          ▼
                  ┌───────────────────┐
                  │ FieldOfPlay renders│
                  └───────────────────┘

Alongside:
- useAiDriver ticks AI actions on opponent's turn
- useAudioDriver fires SFX from matchLog events
- useJuice (screen shake + hit flash) fires from damage events
- DamageFloaters watches matchLog for damage/heal/cp/passive-counter
- TurnBanner watches for turn-started
- CardPlayOverlay watches for card-played (looks up card from caster.deck)
- Match persistence (200ms debounced localStorage save)
```

---

## Engine phase model — how the turn flows

```
pre-match → upkeep → income → main-pre → offensive-roll → (picker) →
defensive-roll → main-post → discard → next player's upkeep …
```

- **upkeep** — status ticks fire (Burn ticks damage, Regen heals, etc.).
- **income** — CP +1 + draw 1 card (start player skips first income).
- **main-pre** — player can play main-phase cards OR call `roll-dice`.
- **offensive-roll** — player rolls (up to 3 attempts), locks/unlocks dice.
- **advance-phase** from offensive-roll runs `beginOffensivePick`:
  - 0 matches → fizzle → main-post
  - 1 match → auto-commit that ability → defensive-roll
  - 2+ matches → `pendingOffensiveChoice` set → UI shows picker
- **defensive-roll** — defender picks defense via `select-defense`.
- **main-post** — player plays main-phase cards → calls `end-turn`.

Key actions the UI dispatches:

- `roll-dice` — from main-pre, auto-transitions to offensive-roll.
  From offensive-roll, consumes another attempt.
- `toggle-die-lock` — during main-pre/offensive-roll.
- `advance-phase` — the "commit" / "end rolling" trigger.
- `select-offensive-ability` — only valid when `pendingOffensiveChoice` set.
- `play-card` — takes `card` id + optional `casterPlayer`, `targetDie`,
  `targetPlayer`, `targetFaceValue`.
- `select-defense` — takes defense abilityIndex (or null).
- `spend-bank` / `decline-bank-spend` — Radiance spend prompt.
- `end-turn` — from main-post.

**The AI dispatches these same actions.** `useAiDriver(aiPlayer)` reads
gameStore state, calls `nextAiAction(state, aiPlayer)`, dispatches the
result. Waits for the resolution queue to drain between ticks so cinematics
have time to play.

---

## The seven-band match screen

```
┌──────────────────────────┐  13%   OpponentStrip
├──────────────────────────┤  3.5%  PhaseBanner
├──────────────────────────┤  13%   DiceTray
├──────────────────────────┤  28%   MiddleBand (AbilityLadder OR FieldOfPlay)
├──────────────────────────┤  12%   SelfStrip
├──────────────────────────┤  20%   Hand
└──────────────────────────┘  7.5%  ActionBar
```

The active player's dice + ladder render in the middle. The strips are
always the same two players. Overlays anchor absolutely against
`<ScreenBands>` with `inset: X% 0 Y% 0` — a modal that covers dice + middle
+ self-strip has `inset: 16.5% 0 30.5% 0`, one that also covers hand has
`inset: 16.5% 0 7.5% 0`, etc.

---

## Selectors — engine state → UI props

Each selector is a pure function. Component doesn't touch engine directly;
it calls the selector.

- `derivePhaseDisplay(state, viewerId)` → `PhaseDisplay` for PhaseBanner
- `deriveLadder({ self, opponent, dice, viewerId })` → `LadderAbility[]`
- `deriveStatusTrack(snapshot)` → `{ positive, negative, signatures, overflowCount }`
- `deriveCardVisualStyle(card)` → `'attack' | 'defense' | 'buff' | 'utility'`
- `deriveActionBar(input)` → `ActionButton[]`
- `derivePips(combo, dice)` → `{ descriptor, combo }` — handles symbol-count,
  n-of-a-kind, straight, compound (and/or)
- `deriveAbilityValue({ effect, dice, scalingSymbol })` → `AbilityValue`
- `aggregateEvents(state, events)` → `{ state, emitted: FOPScene[] }`

---

## uiStore + hooks

`uiStore` is Zustand:

- `viewerId: PlayerId` — whose perspective the screen renders for
- `resolutionPhase, resolutionQueue, currentResolution` — cinematic pipeline
- `aggregatorState` — cross-batch state for the FOPScene aggregator
- `activeOverlay: 'none' | 'defensive' | 'spend' | 'card' | 'ability' |
  'ultimate' | 'offensive-pick' | 'skip-confirm' | 'log' | 'menu' |
  'instant-prompt' | 'match-summary'`
- `tooltipTarget`
- `selectedAbilityId, focusedCardId, selectedDefenseId, selectedSpendOptionId`
- `reducedMotionOverride, activityLogOpen`

Hooks:

- `useReducedMotion()` — subscribes to `prefers-reduced-motion`
- `useLongPress(cb, opts)` — 400ms long-press with 8px movement tolerance
- `useGameState()`, `usePlayerSnapshot(id)`, `useActivePlayer()`, `useEnginePhase()`
- `useAnimationTimer(onPhase)` — coordinated multi-step timer
- `useResolutionDriver()` — walks the FOP phase sequence per scene kind
- `useAiDriver(aiPlayer)` — ticks the AI when it's their turn
- `useAudioDriver()` — matchLog → SFX
- `useJuice()` — matchLog → screen shake + hit flash

---

## Art layer (visual identity)

`src/ui/art/` is the visual identity layer — all hand-built vector art,
zero binary assets:

- `heroArt.tsx` — painted-style layered SVG bust portraits per hero
  (+ HERO_PALETTE, the concrete hex palette the whole art layer shares).
  Rendered through `HeroSilhouette variant="portrait"` (all 8 call sites)
  and circle-cropped in `PortraitOrb`. The geometric crest variant remains
  for chips/tiny sizes.
- `cardArt.tsx` — one illustrated 96×64 scene per card id (all 46 cards),
  palette-washed by hero. Wired into HandCard, ExpandedCardView, and
  CardPlayOverlay (each keeps a fallback if an id is missing).
- `/art-preview` — internal gallery route for visual QA of the whole set.

Adding a card? Add a motif to `cardArt.tsx` under the card's id — the
gallery + `CARD_ART_IDS` make missing art obvious.

## Overhaul session (multi-agent audit + fixes)

An 8-dimension multi-agent audit (engine cards/phases, MatchScreen wiring,
selectors, screens/flows, hooks/drivers, layout, AI quality) with
adversarial verification, plus a chaos harness (`scripts/chaos.mjs`),
surfaced ~40 confirmed defects. All fixed — see commits `b81356e`,
`f56628a`, and the overhaul-final commit for the full change list.
Highlights: Iron Focus/Last Stand face picker, instant trigger windows,
symbol-bend expiry, Verdict/Frost-bite debuffs un-nullified, defensive
Radiance spend wired end-to-end, ladder resolves upgrades/bends like the
engine, MatchIntro/CardPlayOverlay timer resets, Atone button, MatchMenu
(pause/concede/save-quit), customize navigation + valid-only persistence,
resume restores the event log, AI locks straights / plays dice-manip
cards / picks defenses by value, band heights sum to 100%.

### Balance state (after the full rebalance session)

Measured by `scripts/balance.ts` (full ordered-pair matrix with per-source
damage/heal/CP attribution; final validation at 300 matches per pairing,
2700 total):

- **Pooled winrates: Berserker 50.6% / Pyromancer 49.9% / Lightbearer 49.4%**
  (baseline before the session: 53.2 / 35.0 / 61.8).
- Matchups (pooled across seats): ber-pyro 48.0, ber-LB 53.8 for ber,
  pyro-LB 47.8 for pyro. All cells within ±4 of even.
- Seat bias: mirrors at 50.3 / 48.3 / 54.7 p1 (was 55-62 across the board).
  Fixed structurally — the player going second starts with +1 CP and +1
  card (engine.ts start-match).
- Damage throughput per match: 32.5 / 30.6 / 31.4 — flat.

What changed (all sim-verified round by round):
- **Pyromancer** (was 35%): Ashfall ember bonus threshold 3 → 2 (was
  sim-dead at <5% of fires), Cinder detonation 8 → 10 (Crater Wind
  12 → 14), Ember Strike 3/5/7 → 4/6/8 (mastery 5/7/9), Firestorm 5 → 6,
  Magma Shield reduce 3 → 4 (Mountain's Patience 5), recommended deck
  swaps phoenix-veil → phoenix-stir (the glass cannon's one heal; veil
  fired 0.1/match), AI plays Char/Phoenix Stir at sensible thresholds.
- **Lightbearer** (was 61.8%): Solar Devotion's Sun Strike 7 → 6 ub,
  Sunblade Mastery's Solar Blade 9 → 8 ub, Sun Strike base 5 → 4 ub,
  Verdict cap -4 → -3.
- **Generic pool**: Cleanse redesigned from "remove all Burn" (dead —
  nothing applies Burn) to "remove up to 2 stacks of any self debuff";
  it is deliberately catalog-only anti-stack tech now — recommended
  decks carry Battle Plan instead (a real Cleanse in default decks
  swung LB +4.5 points by defusing Cinder/Frost-bite engines).
- Remaining known asymmetry: LB going first vs Pyromancer is ~56%
  (first-strike Verdict tempo vs a slow engine) — acceptable, tracked.

## Game-loop stall fixes + polish (this branch)

The game shipped in `036a226` was unplayable: the AI played at most one
turn and then the match stalled forever. Root causes fixed on this branch:

1. **useAiDriver stale timer.** A fired timeout's handle was never
   cleared, so `if (timerRef.current == null) tick()` in the store
   subscription never re-kicked the AI after its first turn. The driver
   is rewritten: closure-owned timer, re-kick from BOTH gameStore and
   uiStore (queue drain), jittered thinking pace, and a no-progress
   watchdog that halts loudly if the engine rejects 5 dispatches in a row.
2. **Pending-actor routing.** Pending prompts (defense pick, bank spend,
   instant windows) can target the NON-active player. `pendingActorFor()`
   in ai.ts is now the single source of truth for who must act; the UI
   driver, simulator, and tests all use it. Previously the AI-vs-AI sim
   resolved every defense one turn late — p2 never attacked at all.
3. **Engine guards.** `advance-phase` is a no-op while any pending prompt
   is set (stray dispatches can no longer skip attack resolution).
   `beginOffensivePick` requires an actual roll this turn (resting dice
   can no longer ghost-fire five-of-a-kind matches via Skip).
4. **uiStore.resetForMatch()** — resolution queue / aggregator / overlays
   are cleared on every match start/resume/abandon path; stale
   `currentResolution` used to permanently block the AI on rematch.
5. **nextAiAction returns `Action | null`** and answers every prompt kind
   (including `pendingStatusRemoval` instants). It never emits
   advance-phase off-turn (which used to corrupt the human's turn).
6. **MatchScreen hooks** hoisted above the no-match early return (was a
   conditional-hooks crash waiting to happen), single-match offensive
   picks auto-commit, instant prompt filters to genuinely matching cards
   (with auto-decline safety valve), Take Hit / Confirm Defense split,
   undefendable brace notice, two-tap full-pass Skip Turn, bank-spend
   amount stepper wired to real hero spendOptions, Sell +1 CP in the
   card view, empty-hand state.
7. **Sigil SVG set** (`atoms/Sigil`) — real glyphs for all 11 die symbols
   replace first-letter placeholders on dice, ladder pips, and defense
   rows. Phase banner shows Plan during main-post and "<Hero>'s Turn"
   capitalized; attacker sees "Resolving · <ability>" while the defender
   picks. Ladder-firing chime only plays on the not-firing → firing
   transition. All matchLog subscribers resync when the log shrinks.
8. **E2E harness**: `node scripts/playtest.mjs --matches N` drives full
   matches through the real DOM via Playwright (dev server must be
   running) and fails loudly on any stall. `window.__poh` (dev-only)
   exposes the stores for it.

## Recent bugs fixed earlier (in `2325fea`)

These made the game "barely playable" in the user's words:

1. **No commit button.** Added "Fire" button in ActionBar during
   offensive-roll dispatching `advance-phase`. Was previously stuck after
   rolling.
2. **ExpandedAbilityView Activate did nothing.** Now dispatches
   `advance-phase` after storing chosen ability index in a ref;
   auto-answers `pendingOffensiveChoice` with that index via a useEffect.
3. **AI never took its turn.** Added `useAiDriver(aiPlayer)` that mounts
   from MatchScreen and dispatches `nextAiAction(state, aiPlayer)` on
   350ms ticks when it's the AI's turn. Waits for resolution queue drain.
4. **All resolutions took 2 seconds.** Now the driver uses per-scene
   sequences: 700ms for sub-events (upkeep beats), 1700ms for card-play,
   2000ms for ability/detonation/consume/defense.
5. **Card-play cinematic dropped on opponent plays.** Now MatchScreen
   watches gameStore.matchLog for card-played events and pops the
   CardPlayOverlay for both viewer and opponent. Aggregator no longer
   queues card-play scenes (which never rendered anyway).
6. **DiceTray never showed tumble.** MatchScreen now subscribes to
   dice-rolled events and sets `rollingUntil = now + 600ms`.
7. **Cards playable in wrong phases.** `cardPlayableState` now gates by
   card.kind vs current phase (main-phase in main-pre/main-post,
   roll-phase in offensive-roll/defensive-roll, instant any time).
8. **MatchSummary rematch dumped to hero select.** Now snapshots hero
   pair on mount and startMatch's with the same heroes.

---

## AAA polish added (in `2c8c101`, `42835b5`, `036a226`)

- **SFX wired end-to-end.** useAudioDriver fires 15+ SFX from matchLog
  events. Button component fires ui-tap on every click.
- **Screen shake + hit flash.** useJuice + <ScreenShake> wrapping
  <ScreenBands>. Magnitude proportional to damage.
- **HeroSilhouette component.** SVG glyphs per hero replace letter
  initials in PortraitOrb, HeroSelect cards, HeroBook, HeroDetail,
  MatchIntro, MatchSummary, UltimateTakeover.
- **AmbientBackdrop.** Aurora + drifting particles behind Home / HeroSelect
  / HeroBook / HeroDetail / MatchSummary / Settings.
- **HomeScreen atmospheric overhaul.** Silhouette parade + animated
  title glow + rotating diamond crest + gold aurora.
- **MatchIntro cinematic.** Split-screen hero pedestals with spinning
  conic-gradient rays around a central "VS" medallion.
- **RouteTransition.** Every screen fades in on route change.
- **TurnBanner.** Big skewed banner slides across on turn-started.
- **DamageFloaters.** Numbers rise above the affected strip on damage /
  heal / CP gain / passive counter change.
- **Instant card visual.** Pulsing ⚡ + "INSTANT" pill on kind==='instant'
  cards.
- **Ambient music.** src/ui/util/ambientMusic.ts synthesizes a drone
  pad + occasional C-E-G chime via WebAudio. Bus volume controllable.
- **SettingsScreen.** Real muted toggle + SFX/music sliders wired to
  audio bus.
- **Strip element accent.** Every HeroStrip has a glowing colored bar on
  the left edge (frost/ember/dawn per hero element).
- **Portrait breath.** Every portrait scales 1 → 1.03 → 1 over 4.5s.
- **ScreenBands atmosphere.** Two radial-glow accents + a very subtle
  drifting diagonal-stripe texture.

---

## Test suite

```
npx vitest run
# 11 test files, 101 tests
```

- `tests/ui/parseEffect.test.ts` — card text parser (11 tests)
- `tests/ui/derivePips.test.ts` — pip derivation for all combo kinds (11)
- `tests/ui/fopAggregator.test.ts` — cross-batch event folding (6)
- `tests/ui/matchFlow.test.ts` — UI dispatch integration (7)
- `tests/engine-loads.test.ts` — content loading (existing)
- `tests/deck-*.test.ts`, `tests/loadout-*.test.ts` — storage (existing)
- `tests/match-summary.test.ts` — stats aggregation (existing)
- `tests/ability-upgrade.test.ts` — mastery / persistent buffs (existing)

Run these before every commit. The `matchFlow` test in particular is the
guardrail against re-breaking the offensive commit path.

---

## Build + dev

```
npm install        # once — dependencies: react, react-dom, zustand,
                   # react-router-dom, clsx, framer-motion, howler
npm run dev        # vite dev server at :5173
npm run typecheck  # tsc -b --noEmit
npm run build      # tsc + vite build (PWA)
npm run test       # vitest run --passWithNoTests
npm run simulate   # AI-vs-AI + landing-rate audit
```

Tailwind is **out**. New code uses CSS Modules exclusively. Global tokens
in `src/ui/theme/tokens.css` + shared keyframes in `animations.css`.

Icons: real inline SVG paths in `src/ui/components/atoms/Icon/Icon.tsx`
(Lucide-derived, MIT). No more Unicode placeholders.

Fonts: Google Fonts, loaded via `<link>` in `index.html`. Cinzel (display),
Cormorant Garamond (body italic), JetBrains Mono (tech). `font-display: swap`.

---

## What's NOT done — pick-up items

These are known TODO / opportunity areas. Ordered by user-facing impact.

### Gameplay depth

- **Counter cards / respond-to-counter** — `pendingCounter` exists in
  types but NOTHING in the engine sets it today; if content starts
  setting it, the UI needs a responder overlay (the AI + pendingActorFor
  already handle it).
- **Mastery card UX** — mastery cards attach to a slot permanently but
  the UI doesn't visualize `masterySlots` on the strip.
- **Force face value / set die face effects** — Iron Focus, Last Stand
  could use a die/face picker UI (they take `targetFaceValue` in
  play-card). The engine currently falls back to a sensible auto-target,
  so cards work — the picker is a nicety.
- **Balance** — DONE (full rebalance session; see "Balance state" above).
  Pooled winrates 50.6/49.9/49.4 at 2700-match validation. Re-run
  `npx tsx scripts/balance.ts --n 300` after any content change.

### Polish

- **Ability activation dramatic pause** — currently row tap → modal →
  Activate → advance-phase. Could add a 300ms pre-fire zoom on the row
  before the FOP takes over.
- **HP interpolation sound tick** — the bar drops smoothly (600ms CSS
  transition) but there's no per-point SFX tick.
- **Card-drawn slide animation** — when a card is drawn during upkeep,
  it should slide from the DeckIndicator into the hand. Currently just
  appears.
- **Idle animations** — dice tray could show a subtle floating idle
  animation between rolls.
- **Onboarding step 6** (Customize option) is documented in the bible but
  not implemented — the OnboardingFlow ends at step 5.
- **HeroCustomizationScreen visual polish** — functional but plain.
- **Empty hand state** — no fallback UI if hand is empty.
- **404 route** — currently redirects to `/`; could show a proper 404.

### Missing content

- Real hero portrait art (currently HeroSilhouette geometric glyphs).
- Card illustrations (currently the category glyph + gradient placeholder).
- More status types beyond the 5 universal + hero signatures.
- Ability barks / voice callouts.

### Engine-side

- **Reactive pacing floors** (bible Part 7.3.5.8 — 150ms inter-lock, 800ms
  pre-commit hold) — deliberately skipped. Would prevent fast opponents
  from bypassing defender's Instant window in PvP, but MVP is single-player.
- **Turn timers** — engine has no timer enforcement.
- **Multiplayer transport** — engine is architecturally multiplayer-ready
  (playerId-keyed data, discriminated action union) but there's no
  networking layer.

### Tests

- No Playwright / e2e. All UI tests are logic-level (selectors, parser,
  aggregator, match-flow via direct dispatch).
- The `matchFlow` test hits the AI safety cap sometimes on rare seeds —
  raising the cap is fine, but investigate infinite-loop possibilities.
- Landing rates in `npm run simulate --rates` show ~50% of abilities are
  outside their target band. This is a content-tuning task, not a UI bug.

---

## Contact / conventions

- Every non-trivial commit was co-authored: `Co-Authored-By: Claude Opus
  4.7 <noreply@anthropic.com>` — keep that pattern.
- Bible spec (`docs/design/*` — legacy, largely superseded by DECISIONS.md
  reconciliations).
- The MEGA-spec is `pact-of-heroes-ui-bible.md` (not in repo; user has it).
  It's authoritative for visuals; where it conflicts with engine reality,
  see `src/ui/DECISIONS.md`.

Good luck. The `matchFlow` test + `npm run simulate` are your two fastest
sanity checks before landing changes.

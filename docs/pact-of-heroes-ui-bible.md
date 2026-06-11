# Pact of Heroes — UI Implementation Bible

**Version:** 1.1  
**Last updated:** 2026-06-11  
**Status:** Authoritative for v1 implementation  
**Companion document:** `pact-of-heroes-design.html` (visual reference)

> **Revision 1.1 — engine-alignment sweep.** This revision resolves every remaining `[VERIFY-IN-CONTENT]` flag against the actual engine content (`src/content/heroes/*.ts`, `src/game/status.ts`) and removes residual v0 contamination: the Part 7.3 action-envelope section (it contradicted Convention 4), stale SCREAMING_SNAKE action names, the draw-before-CP upkeep ordering in Parts 7.3/7.5/7.8/9.5.2c, deprecated components in the Part 4.7 mapping table and Part 10 roadmap, and the outdated Frenzy/ability copy in Part 8.6. Resolved engine facts: Cinder detonates at **5** stacks for **8 undefendable** damage (resets to 0); Frost-bite is a max-4 DoT that ticks 1 damage and thaws 1 stack at the holder's upkeep while imposing **−1 damage per stack** on the holder's offense (it is **not** consumed for bonus damage); Verdict is max 4, −2 damage/stack on the holder's offense, blocks main-phase + instant cards at 3+ stacks, Atone costs **2 CP** and strips all; Radiance starts at 2, caps at 6, spends at ±2 per token; Stun blocks the offensive roll then expires; `bleeding` does not exist in engine v1; Sanctuary is a **main-phase** card (cost 3, −2 incoming until next turn), not an Instant.

---

## How to use this document

This is the authoritative implementation specification for the Pact of Heroes user interface. It is written for engineering consumption — specifically for use with Claude Code, but readable by any engineer.

**Read order for first-time readers:**
1. Part 0 — Implementation Architecture (foundational; read all of it)
2. Part 1 — Visual Foundations (CSS tokens, typography, motion)
3. Skim Parts 2–6 to understand component categories
4. Read Part 7 — Match Flow to understand how everything connects
5. Use Parts 2–6 as reference while implementing
6. Use Part 9 — Test Scenarios as acceptance criteria
7. Use Part 10 — Implementation Roadmap as the build sequence

**Visual reference convention.** When a section says `design.html#p1-resolution`, open `pact-of-heroes-design.html` and navigate to that anchor. The visual is authoritative for appearance; this bible is authoritative for behavior, props, and timing.

> **Note on section IDs.** The design HTML uses legacy section ID prefixes (`p1-`, `p2-`, `p3-`, `p4-`, `p5-`) from an earlier 5-part organization. The current TOC reorganizes these into six topic-coherent parts (Composition & Layout, Match States & Cinematics, Modals & Inspection, Token System, Ability Ladder, Meta Surfaces), but the IDs themselves stay stable so the anchors keep working. To find what part a section currently lives in, consult the design HTML's TOC at the top of the file. **The design HTML's 6-part structure is independent of this bible's 11-part structure** — they organize the same material in different orders for different audiences (design HTML by visual narrative; bible by build sequence).

**How the two documents work together.** The bible and the design HTML are complementary — both are required for implementation, neither stands alone.

- The design HTML (`pact-of-heroes-design.html`) shows **what things look like**: pixel-accurate visual mockups, color palettes, typography, layout proportions, the actual rendered state of the UI in every gameplay moment.
- The bible (this document) specifies **what things do**: component props, state machines, animation timings, acceptance criteria, error handling, the rules engineers need to write working code.

The design HTML uses human-readable language like "self strip" and "opponent strip" because that's how the visual reads to a designer. The bible uses engineering language like `<OpponentStrip playerId={...}>` because that's how the contract reads to an engineer. These are two views of the same component; the bible's Part 0.4 explains the mapping.

When implementing a feature: open both, identify the design HTML section that shows your target visual, then look up the corresponding bible section for the behavior spec. The bible always points back to the design HTML for visual reference; the design HTML annotations describe what to build but defer the technical detail to the bible.

**Spec format.** Each component spec includes:
- A TypeScript interface for its props
- A visual specification (colors, dimensions, typography)
- State variations (default, hover, active, etc.)
- Animation behavior
- Acceptance criteria — verifiable conditions for "done"

**When to diverge.** If a spec doesn't work in practice during implementation (a CSS value that breaks on a specific browser, timing that feels off), surface the issue. The bible is authoritative until experience shows otherwise, then it gets updated.

---

## Master table of contents

### Part 0 — Implementation Architecture
0.1 Technology stack · 0.2 File structure · 0.3 State model · 0.4 Multiplayer-ready conventions · 0.5 Component contract conventions · 0.6 Component hierarchy · 0.7 Resolution pipeline state machine · 0.8 Performance baseline · 0.9 Accessibility baseline · 0.10 Coordinate system · 0.11 Naming conventions

### Part 1 — Visual Foundations
1.1 Color tokens · 1.2 Typography · 1.3 Spacing scale · 1.4 Animation primitives · 1.5 Animation keyframes · 1.6 Reduced motion · 1.7 Iconography · 1.8 Hero element mapping · 1.9 Card content data model · 1.10 Atomic stat components

### Part 2 — Match UI Components: The Seven Bands
2.1 ScreenBands container · 2.2 OpponentStrip · 2.3 SelfStrip · 2.4 PortraitOrb · 2.5 HPTrack · 2.5.1 CP rendering (CPValue) · 2.6 PhaseBanner · 2.7 DiceTray · 2.8 ActionBar · 2.9 Hand · 2.9.2 DeckIndicator · 2.9.3 HandCard · 2.10 MiddleBand · 2.11 OpponentHandIndicator

### Part 3 — Ladder & Ability Components
3.1 AbilityLadder · 3.2 AbilityRow · 3.3 AbilityValueBadge · 3.3.1 TierBadge (defensive picker only) · 3.4 ComboGlyphStrip · 3.5 ScaleBadge *(deprecated — superseded by AbilityValueBadge)* · 3.6 Defensive sub-ladder components

### Part 4 — Token & Resource Components
4.1 SignatureChip · 4.2 SignatureGlyph · 4.3 RadianceRing *(deprecated — see Part 4.4)* · 4.4 StatusChip *(renamed from GenericChip)* · 4.5 BuffChip · 4.6 StatusTrack · 4.7 Effect → component mapping

### Part 5 — Field of Play & Resolution Components
5.1 FieldOfPlay container · 5.2 AbilityNameDisplay · 5.3 DamageNumber · 5.3.5 UpkeepFOP variant · 5.4 EffectRows · 5.5 ParticleField · 5.6 ConsumeContent · 5.7 DetonationContent · 5.8 UltimateTakeover · 5.9 FloatingDamageNumber · 5.10 Resolution choreography integration

### Part 6 — Modal Overlay Components
6.1 DefensiveOverlay · 6.2 SpendOverlay · 6.3 TooltipRenderer · 6.4 Modal stacking · 6.5 ToastQueue · 6.5.5 ActivityLog · 6.6 ExpandedCardView · 6.6.5 CardPlayOverlay · 6.7 ExpandedAbilityView

### Part 7 — Match Flow
7.1 Match lifecycle · 7.2 PRE_MATCH → MATCH_INTRO · 7.3 The turn loop · 7.3.5 Opponent turn (what the viewer sees) · 7.4 Resolution coordination · 7.5 Turn-start sequence (upkeep choreography) · 7.6 MATCH_END detection · 7.7 MatchSummaryScreen · 7.8 State diagram · 7.9 Error and recovery · 7.10 Persistence and resume

### Part 8 — Meta Surfaces
8.1 Routing structure · 8.2 HomeScreen · 8.3 HeroSelectScreen · 8.4 SettingsScreen · 8.5 HeroBookScreen · 8.6 HeroDetailScreen · 8.6.1 HeroCustomizationScreen · 8.7 OnboardingFlow · 8.8 In-match menu · 8.9 Hooks for future surfaces

### Part 9 — Test Scenarios
9.1 Token scenarios · 9.2 Ladder scenarios · 9.3 Resolution timing · 9.4 Modal interactions · 9.5 Recovery / edge cases · 9.6 Performance scenarios · 9.7 Accessibility scenarios

### Part 10 — Implementation Roadmap
10.1 Pre-flight · 10.2 Milestone 1: Foundations · 10.3 Milestone 2: Match UI Static · 10.4 Milestone 3: Tokens · 10.5 Milestone 4: Resolution · 10.6 Milestone 5: Interaction · 10.7 Milestone 6: Meta & Polish · 10.8 Risk areas · 10.9 Out of scope · 10.10 Working with Claude Code · 10.11 Definition of ship-ready

---

## Part 0 — Implementation Architecture

### 0.1 Technology stack

The application is built as a React 18 + TypeScript + Vite SPA, mobile-first portrait (9:19.5 aspect ratio target). The current engine layer is already built — this bible covers only the UI/UX layer.

**Required dependencies (already in project or to be added):**

```
react@^18.2.0
react-dom@^18.2.0
typescript@^5.3.0
vite@^5.0.0
framer-motion@^11.0.0      // For animations and gestures
zustand@^4.5.0              // State management (likely already in place)
clsx@^2.1.0                 // Conditional className construction
```

**Optional/considered:**
- `@radix-ui/react-tooltip` for accessible tooltip primitives on long-press
- `@react-aria/focus` if keyboard navigation is added later

No CSS-in-JS library. Styling uses **CSS modules** for component-scoped styles, with a global `theme.css` for the design token layer. Rationale: smaller bundle, cleaner separation from logic, easier to inspect in DevTools.

### 0.2 File structure

```
src/
  game/                         # Existing engine layer — DO NOT MODIFY in UI work
    actions.ts
    reducer.ts
    rng.ts
    types.ts
  content/                      # Existing hero/ability/card data — DO NOT MODIFY
    heroes/
    cards/
  store/                        # Existing Zustand store
    gameStore.ts
  ui/                           # NEW: all UI code lives here
    theme/
      tokens.css                # CSS variables (colors, typography, spacing)
      fonts.css                 # Webfont loading directives
      animations.css            # Shared @keyframes
      reset.css                 # Minimal CSS reset
    components/
      atoms/                    # Lowest-level primitives
        Button/
        Icon/
        ProgressBar/
        Pip/
        StatLabel/              # Small uppercase labels ("HP", "CP")
        StatValue/              # Numeric value rendering
        StatDivider/            # Mid-dot separator between stats
      tokens/                   # Token chips and resource displays
        SignatureChip/          # Frost-bite, Cinder, Verdict (rectangular, badge count)
        SignatureGlyph/         # Frenzy (binary state glyph for self strip)
        StatusChip/             # Generic status (burn, stun, regen, etc.) — renamed from GenericChip
        BuffChip/               # Card-applied buffs
        ConsumedToken/          # Used in FOP resolution scenes — visualizes consumed signature tokens
        # RadianceRing/  ← DEPRECATED, see Part 4.3
      ladder/                   # Ability ladder system
        AbilityLadder/
        AbilityRow/
        AbilityValueBadge/      # Replaces TierBadge in offensive ladder (damage/heal/utility variants)
        ComboGlyphStrip/
        TierBadge/              # RETAINED for HeroDetailScreen reference only — defensive picker no longer renders tier badges (redundant with two-row layout)
        # ScaleBadge/  ← DEPRECATED, T1 scaling moved into AbilityValueBadge value
      bands/                    # Major UI bands of the match screen
        OpponentStrip/
        SelfStrip/
        HPTrack/
        CPValue/                # Numeric readout (0–15) — sole CP renderer; the prior CPBar/CPDisplay/CPTrack are all deprecated
        PhaseBanner/
        DiceTray/
        Die/
        Hand/
        HandCard/               # 76×112 card with cost, illustration, name, effect text
        ExpandedCardView/       # Modal — Cancel/Play with full prose
        OpponentHandIndicator/  # Inline in opp-strip name row, left of opp DeckIndicator
        ActionBar/
      fop/                      # Field-of-play resolution renderer
        FieldOfPlay/
        DamageNumber/
        AbilityNameDisplay/
        EffectRows/
        ParticleField/          # Used in card-play, passive, and ordinary damage scenes only
        ConsumeContent/         # Consumption-row visualizer for Frost-bite / Verdict
        DetonationContent/      # Cinder detonation visualizer (uses ConsumedToken with burst variant)
        UltimateTakeover/
      modals/                   # Ability and card detail modals
        ExpandedAbilityView/    # Combo readiness + value badge + Activate button
      overlays/                 # Modal overlays
        DefensiveOverlay/
        DefensiveLadder/
        SpendOverlay/
      screens/                  # Top-level screens
        HomeScreen/
        HeroSelectScreen/
        HeroBookScreen/
        HeroDetailScreen/
        HeroCustomizationScreen/  # Tabbed Abilities + Deck editor (Part 8.6.1)
        SettingsScreen/
        OnboardingFlow/
        MatchScreen/
        MatchSummaryScreen/
        SettingsScreen/
      shared/                   # Cross-component utilities
        # FrameContainer/       ← Design-mockup wrapper ONLY; not built in production. See Part 1.10.
        ScreenBands/            # Container for the 7-band layout
    hooks/
      useGameState.ts           # Selector hook over gameStore
      useAnimationTimer.ts      # Coordinated multi-keyframe animation hook
      useReducedMotion.ts       # prefers-reduced-motion subscription
      useLongPress.ts           # Tooltip trigger
    util/
      easing.ts                 # Cubic-bezier easing constants
      duration.ts               # Animation duration constants
      clsx.ts                   # Re-export
    types/
      ui.ts                     # UI-specific types (not game state)
  App.tsx                       # Root component
  main.tsx                      # Entry point
```

### 0.3 State model

The UI consumes engine state through the existing Zustand store but maintains a **separate UI-only state** for transient animation and interaction state that doesn't need to live in the canonical game state.

**A note on multiplayer readiness.** This bible specifies a single-player MVP, but synchronous PvP is the immediate next phase (post-MVP v1). To prevent painful refactoring later, the state model and component contracts use a **`PlayerId` perspective** from day one rather than implicit "self/opponent" relationships. In single-player, `viewerId === selfId` always, but the *contracts* are already player-id-keyed. See Part 0.4 for the conventions this implies for component design.

**Player identifiers.**

```typescript
// ui/types/ui.ts
export type PlayerId = 'p1' | 'p2'   // Literal union — matches engine's PlayerId

// In single-player MVP:
//   viewerId = 'p1' (always)
//   players = { 'p1': HeroSnapshot, 'p2': HeroSnapshot }
// In multiplayer:
//   viewerId = the player ID assigned by the server at match-start
//   players keyed by the same literal IDs (server assigns who is p1 vs p2 at coin flip)
```

> **Why a literal union, not an opaque string?** The engine fixes the player roster at exactly two seats (`p1`, `p2`) for both single-player and PvP. Treating `PlayerId` as an opaque string was forward-compat for hypothetical 3+ player modes that aren't on the roadmap. Narrowing to a literal union catches "wrong player ID" bugs at typecheck time. If the roster ever expands, this is a one-line widening.

**Engine constants.** Values from the engine's `config/constants.ts`. UI components reference these by name, never as magic numbers. Listed here once; cited throughout the bible.

```typescript
// Imported from engine/config/constants.ts — do not redefine in UI
export const STARTING_HP        = 30   // HP denominator for HPTrack
export const HP_CAP_BONUS       = 10   // Over-heal ceiling: hpCap = STARTING_HP + HP_CAP_BONUS = 40
export const STARTING_CP        = 2    // CP at match start
export const CP_CAP             = 15   // CP ceiling (global, not per-player)
export const STARTING_HAND      = 4    // Cards in hand at match start
export const HAND_CAP           = 6    // Maximum hand size (overflow → discard)
export const ROLL_ATTEMPTS      = 3    // 1 initial roll + 2 rerolls per turn
```

**Engine state (from `engine/state/gameStore.ts`, read-only from UI):**

The engine state is keyed differently than the bible originally specified. Dice live under each player's snapshot (not at the top level), the turn pointer is named `activePlayer` (not `currentPlayer`), and the `pendingAction` slot is actually six separate optional fields — one per kind of pending decision.

```typescript
type GameState = {
  // Deterministic replay
  rngSeed: number                       // Set at match-start; reproduces all subsequent rolls
  rngCursor: number                     // Advances on every consumption — read-only to UI
  
  // Turn pointer + history
  turn: number                          // Increments every TURN_END
  activePlayer: PlayerId                // Whose turn it is (replaces the old `currentPlayer` name)
  startPlayer: PlayerId                 // Who went first (decided by coin flip at match-start)
  startPlayerSkippedFirstIncome: boolean // Engine bookkeeping for first-turn fairness
  
  // Phase machine
  phase: PhaseEnum                      // 9-value union; see Part 7.1
  
  // Per-player snapshots (replaces the old players + dice top-level split)
  players: Record<PlayerId, HeroSnapshot>
  
  // Pending decisions — six separate optional fields, NOT a single discriminated union.
  // Exactly one is set when the engine is awaiting a player decision; otherwise all undefined.
  pendingAttack?: PendingAttack              // Defensive prompt (incoming attack landing)
  pendingBankSpend?: PendingBankSpend        // Spend Radiance/banked-resource prompt
  pendingOffensiveChoice?: PendingOffensiveChoice  // Multiple abilities match rolled dice — pick one
  pendingStatusRemoval?: PendingStatusRemoval      // Opponent strips your status; you may Instant-counter
  pendingCounter?: PendingCounter            // Opponent played a counter-eligible card
  pendingOffensiveCommit?: PendingOffensiveCommit  // Held offensive commit while spend prompt resolves
  
  // Match history + outcome
  log: LogEntry[]                       // Engine's plain-text log (UI prefers gameStore.matchLog: GameEvent[] for rich rendering — see Part 6.5.5)
  winner?: PlayerId                     // Set when match ends; absent during active play
}

type HeroSnapshot = {
  // Identity
  heroId: HeroId
  
  // Vitals
  hp: number                            // Current HP (may exceed hpStart up to hpCap via over-heals)
  hpStart: number                       // Denominator for HPTrack — always 30 (= STARTING_HP)
  hpCap: number                         // Over-heal ceiling — always 40 (= STARTING_HP + HP_CAP_BONUS)
  cp: number                            // Current CP — ceiling is global CP_CAP (15), not per-player
  isLowHp: boolean                      // Engine-computed convenience flag (used for some card triggers)
  
  // Dice (lives per-player, NOT in a top-level dice dict)
  dice: Die[]                           // Always length 5; engine Die has all 6 faces + current index — see Part 2.7
  rollAttemptsRemaining: number         // Counts down from 3 (ROLL_ATTEMPTS) per turn
  
  // Cards (deck/hand/discard)
  deck: Card[]                          // Remaining draw pile
  hand: Card[]                          // Visible only if playerId === viewerId in single-player
  discard: Card[]                       // Visible to both players (face-up pile)
  
  // Statuses + signature
  statuses: StatusInstance[]            // Plural — universal + hero-namespaced. See Part 4.4
  signatureState: SignatureState        // Hero-specific signature counters (Frenzy, Radiance, etc. — Part 4)
  
  // Active offensive/defensive commits
  activeOffense?: ActiveOffensiveCommit  // Set during offensive-roll → main-post; cleared on turn-end
  activeDefense?: ActiveDefensiveCommit  // Set during defensive-roll
  ladderState: LadderRowState[]         // Length 4 (T1-T4); engine-computed per row (firing | triggered | reachable | out-of-reach)
  
  // Buff arrays — five orthogonal categories; see Part 4.5
  abilityModifiers: ActiveAbilityModifier[]   // Mastery + persistent-buff modifiers on abilities
  pipelineBuffs: ActivePipelineBuff[]          // Damage-pipeline modifiers (Sanctuary, etc.)
  triggerBuffs: ActiveTriggerBuff[]            // CP-gain trigger modifiers (Vow-style)
  comboOverrides: ActiveComboOverride[]        // Combo relaxation (Sunburst-style)
  symbolBends: ActiveSymbolBend[]              // Temporary face-symbol re-mappings
  tokenOverrides: ActiveTokenOverride[]        // Status-threshold overrides (Crater Wind → Cinder detonation)
  
  // One-shot transient buffs (cleared on use)
  nextAbilityBonusDamage: number        // Empower-style bonus, consumed by next ability
  forcedFaceValue?: ForcedFaceValue     // From Last Stand-style effects
  
  // Card-use tracking
  consumedOncePerMatchCards: CardId[]   // Per-match singletons (oncePerMatch flag)
  consumedOncePerTurnCards: CardId[]    // Per-turn singletons (oncePerTurn flag); cleared on turn-end
  
  // Mastery (permanent ability upgrades — see Part 1.9.5)
  masterySlots: { 1?: MasterySlot, 2?: MasterySlot, 3?: MasterySlot, defensive?: MasterySlot }
  upgrades: HeroUpgrade[]               // Hero-upgrade slot occupants
  
  // Misc
  lastStripped?: { status: StatusId, by: PlayerId }   // Most recent status-strip event (for log + UI)
}
```

> **Field-count note.** HeroSnapshot is large (~25 fields) because the engine encodes a lot of mechanical state explicitly. Most of these fields are read by exactly one component (e.g., `pipelineBuffs` → BuffChip cluster in Part 4.5, `masterySlots` → mastery indicators in Part 3.3). The UI doesn't need to traverse the whole snapshot every render; component selectors pull just what they need.

> **HP semantics.** `hp` is the current value. `hpStart` (30) is the denominator the HPTrack uses for its fill percentage — so a player at 33 HP renders the bar at 100% (filled to the cap) plus a small over-heal indicator. `hpCap` (40) is the hard ceiling beyond which heals are wasted. The bible's earlier `hpMax` field doesn't exist in engine; use `hpStart` for the bar denominator and `hpCap` for over-heal logic.

> **`activePlayer` vs the bible's old `currentPlayer`.** The engine field is named `activePlayer`. Use that name throughout. References to "current player" in prose are fine; references to the field should match the engine.

**Engine-side identifier types.** Opaque string IDs used throughout the data model. Engineers should treat these as nominal types rather than raw strings — passing an `AbilityId` where a `CardId` is expected should fail typecheck. For MVP these are simple string aliases; if stricter nominal typing is wanted later, swap to branded types (`type AbilityId = string & { readonly __brand: 'AbilityId' }`) without changing call sites.

```typescript
// ui/types/ids.ts
export type AbilityId = string             // Stable identifier for an Ability content entry
export type CardId    = string             // Stable identifier for a Card content entry
export type StatusEntryId = string         // Instance ID for a live StatusEntry on a player
export type EventId   = string             // Unique ID for a ResolvedEvent
```

**Ability type (engine `AbilityDef`).** Static ability definition from content files. The UI projects this into `LadderAbility` (Part 3.1) at runtime by adding `comboState`, `ladderRowState`, and `onTap`. Used by `HeroAbilityCatalog` (Part 8.6.1) for the loadout picker and by the engine when resolving a player's chosen ability.

```typescript
// ui/types/ability.ts
import type { AbilityCombo, AbilityEffect, DamageType, CriticalEffect } from 'ui/types'

export type Ability = {
  id: AbilityId                            // Stable identifier
  tier: AbilityTier                        // Offensive 1-4 or defensive D1/D2
  name: string                             // "Cleave", "Judgment of the Sun", "Dawn-Ward"
  shortText: string                        // Short prose for ladder rows (~30 chars) — engine AbilityDef.shortText
  longText: string                         // Full prose for ExpandedAbilityView modal — engine AbilityDef.longText
  combo: AbilityCombo                      // 4 canonical engine combo kinds — see Part 3.4
  effect: AbilityEffect                    // Structured engine effect tree (~20 kinds)
  damageType: DamageType                   // 'normal' | 'undefendable' | 'pure' | 'collateral' | 'ultimate'
  targetLandingRate?: number               // Engine's design-target hit rate (for tuning)
  
  // Defensive abilities only
  defenseDiceCount?: 2 | 3 | 4 | 5
  offensiveFallback?: OffensiveFallback    // See Part 3.6 — fires when offense fizzles
  
  // T4 / critical-condition abilities
  criticalCondition?: AbilityCombo         // More-restrictive combo for enhanced cinematic
  criticalEffect?: CriticalEffect          // Enhanced effect when criticalCondition fires
  criticalCinematic?: string               // Optional named cinematic variant
  ultimateBand?: 'standard' | 'career-moment'   // Engine's tier-4 cinematic intensity category
}

export type AbilityTier = 1 | 2 | 3 | 4 | 'D1' | 'D2'

// AbilityScaling — note: derived from engine's `scaling-damage` effect kind, not a separate field.
// The bible projects this into a UI-friendly preview struct (Part 3.4).
```

> **Bible v0 correction.** Earlier drafts had `Ability` carrying `comboType: 'sigil' | 'straight'` + a flat `combo: DieFace[]` array, plus `lethalCondition` and `comboLength` fields. The engine ships richer combo shapes (the `AbilityCombo` union with 4 canonical kinds — see Part 3.4) and uses `criticalCondition` (separate concept from "lethal" — see Part 3.1 and Decision 4) instead of `lethalCondition`. The type above reflects engine reality.



> **`ResolvedEvent` is a UI-side aggregation, not an engine field.** The bible originally specified a `lastResolvedEvent` slot on GameState that the UI would subscribe to. The engine doesn't ship that — instead it emits a stream of `GameEvent[]` (~30 typed variants: `ability-triggered`, `damage-dealt`, `status-applied`, `hp-changed`, etc.) via `enqueueEvents()` into `choreoStore.queue`. The UI aggregates these events into FOP scenes itself. See Part 5.1 for the FOPScene aggregation rules and the event → scene mapping table.

**Pending decisions.** Six separate optional fields on `GameState`, exactly one set at a time when the engine awaits a player decision. The UI reads whichever is set and opens the corresponding overlay (Part 6.x).

```typescript
export type PendingAttack = {
  attacker: PlayerId
  defender: PlayerId
  abilityId: AbilityId
  incomingAmount: number                  // Pre-defense estimate
  damageType: DamageType                  // 'normal' | 'undefendable' | 'pure' | 'collateral' | 'ultimate'
  sourceLabel: string                     // Display string for UI; e.g., "Firestorm · ub + 2 Cinder"
  defenseOptions: AbilityDef[]            // The defender's two configured defenses
  injectedReduction?: number              // Pre-applied damage reduction from a fired Instant (e.g., Phoenix Veil)
}

export type PendingBankSpend = {
  player: PlayerId                        // Whose Radiance/banked resource is offered
  resource: 'radiance'                    // Engine has no momentum bank; only Radiance has spend modes today
  available: number                       // How much is in the bank
  options: PassiveSpendOption[]           // Engine-supplied spend modes — see Part 6.2
}

export type PendingOffensiveChoice = {
  player: PlayerId
  candidates: AbilityIndex[]              // Indices into the hero's offensive catalog
  // Surfaces when the player's locked dice satisfy multiple abilities at once.
  // UI opens an <OffensivePickPrompt> modal (Part 6.4) to disambiguate.
}

export type PendingStatusRemoval = {
  holder: PlayerId                        // Player whose status is about to be stripped
  status: StatusId                        // Which status is being removed
  attemptedBy: PlayerId                   // Opponent triggering the removal
  // The holder may have an Instant card that can prevent the strip.
  // UI opens an <InstantPrompt> if the holder has a matching card; otherwise auto-confirms.
}

export type PendingCounter = {
  triggerCard: CardId                     // The card that opened the counter window
  target: PlayerId                        // Who would be affected if uncounteredd
  candidateCounters: CardId[]             // Counter-eligible cards in target's hand
  // UI opens an <InstantPrompt> showing the candidate counter cards.
}

export type PendingOffensiveCommit = {
  player: PlayerId
  abilityIndex: number                    // The picked ability, held while a spend prompt resolves first
  // After the spend prompt closes, the engine resumes by committing this ability.
  // UI rarely needs to surface this directly — it's engine-internal state.
}
```

**StatusInstance.** Live status on a player. Engine's name is `StatusInstance` (not `StatusEntry`). Note `statuses` is plural on HeroSnapshot.

```typescript
export type StatusInstance = {
  id: StatusId                           // Universal: 'burn'|'stun'|'protect'|'shield'|'regen'.
                                          // Hero-namespaced: 'berserker:frostbite'|'pyromancer:cinder'|
                                          // 'lightbearer:verdict'|'pyromancer:defense-handicap-1'|'bleeding'
  stacks: number                          // Current stack count (1..max for that status)
  appliedBy: PlayerId                     // Source attribution — used for "applierUpkeep" ticks
}
```

**Phase enum.** Engine's 9 phases. The bible's earlier names (`turn_start`, `roll`, `plan`, `resolve`, `turn_end`, `match_intro`) don't exist as engine phases — they were UI projections. The correct mapping is below; see Part 7.1 for the full lifecycle.

```typescript
export type PhaseEnum =
  | 'pre-match'           // Before any rolls; HeroSelectScreen active
  | 'upkeep'              // Status ticks (Burn, Regen, etc.)
  | 'income'              // CP gain + card draw — in this order, see Part 7.5
  | 'main-pre'            // Pre-roll planning window (player may play main-phase cards)
  | 'offensive-roll'      // Active rolling; rollAttemptsRemaining counts down
  | 'defensive-roll'      // Defender phase; pendingAttack is set
  | 'main-post'           // Post-resolution; player may end turn or use main-phase cards
  | 'discard'             // Discard step before next player's upkeep
  | 'match-end'           // Winner set; MatchSummaryScreen
```

> **UI projections layered on top of engine phases.** The PhaseBanner (Part 2.6) and the resolution pipeline (Part 0.7) use additional UI-only states: `'rolling'` (during the 600ms dice tumble animation), `'resolving'` (during the FOP cinematic between commit and damage), `'match-intro'` (the brief 1500ms intro before `pre-match` → `upkeep` transition). These don't exist as engine phases — they're computed from engine events. See Part 7.1 for the full mapping.

**UI state (separate Zustand store, `ui/store/uiStore.ts` — TO CREATE):**

```typescript
type UIState = {
  // Viewer perspective
  viewerId: PlayerId                         // Whose perspective the UI is rendering from
  // In single-player, this never changes. In multiplayer, set on match start.

  // Animation state
  resolutionPhase: 'idle' | 'preconfirm' | 'fadeIn' | 'holding' | 'fadeOut'
  resolutionStartedAt: number | null         // ms timestamp for animation timing
  diceRollingUntil: number | null            // ms timestamp; dice show tumble state if now < this

  // Interaction state (always belongs to the viewer)
  hoveredAbilityId: string | null            // for desktop; null on mobile
  selectedAbilityId: string | null
  pendingDefensiveChoice: string | null
  pendingSpendChoice: SpendOption | null

  // Modal state
  activeOverlay: 'none' | 'defensive' | 'spend' | 'tooltip' | 'menu'
  tooltipTarget: { x: number, y: number, content: string } | null

  // Preferences (persisted, viewer-scoped)
  reducedMotion: boolean
  volume: { music: number, sfx: number, voice: number }
  language: 'en' | 'fr'
  
  // Actions
  startResolution: () => void
  endResolution: () => void
  setOverlay: (overlay: UIState['activeOverlay']) => void
  // ...
}
```

**State flow rules:**
1. UI state never mutates engine state directly. To advance the game, the UI dispatches actions through `gameStore.dispatch(action)`.
2. Engine state changes trigger UI state changes through subscriptions, not direct calls. When `lastResolvedEvent` updates, a subscription in the UI store flips `resolutionPhase` to `'fadeIn'`.
3. Animation timing is anchored to `performance.now()` timestamps stored in UI state, not to `setTimeout` callbacks. This makes the UI deterministic and testable. (Note: in multiplayer this becomes engine-event timestamps, not wall-clock; flagged for that phase.)
4. **Viewer perspective is constant for a match.** `viewerId` is set when the match starts and never changes during the match. Components derive "is this my side?" by comparing `playerId === viewerId`, never by checking a hardcoded `side` value.

**Persistent player state (outside the match):**

The state types above describe what's needed DURING a match. Two more types describe what's persisted ACROSS matches — the player's hero customizations:

```typescript
// ui/types/loadout.ts
// See Part 8.6.1 HeroCustomizationScreen for the full customization spec.

export type HeroLoadout = {
  heroId: HeroId
  abilities: {
    t1: AbilityId        // Selected from hero's T1 catalog
    t2: AbilityId
    t3: AbilityId
    t4: AbilityId        // Selected from hero's T4 (ultimate) catalog — typically 2–4 options per hero
  }
  defenses: [AbilityId, AbilityId]  // Exactly 2 — fill D1 and D2 in match
  updatedAt: number
}

export type DeckConfig = {
  heroId: HeroId
  cards: CardId[]        // Length 12. Max 2 copies of any cardId.
  updatedAt: number
}
```

Both are persisted in localStorage under keys `pact-of-heroes:loadout:<heroId>` and `pact-of-heroes:deck:<heroId>`. The match-start sequence reads these and passes them into the engine's match-init payload. If no saved config exists, defaults are generated from the hero's content catalog. See Part 8.6.1 for full persistence and default behavior.

### 0.4 Multiplayer-ready conventions

The MVP ships single-player vs. AI, but synchronous PvP is the immediate next phase. These conventions add no runtime complexity to single-player but prevent every-component refactoring when multiplayer arrives. **They are mandatory for new components**, not optional.

**Convention 1 — No "self" or "opponent" props.** Components that render player-specific data take a `playerId: PlayerId` prop, not a `side: 'self' | 'opponent'` prop. The component looks up state via `players[playerId]` and decides its visual treatment by comparing `playerId === viewerId`.

```typescript
// CORRECT — multiplayer-ready
type HeroStripProps = {
  playerId: PlayerId
  // viewerId is read from uiStore inside the component
}

// INCORRECT — bakes single-player assumption into the contract
type HeroStripProps = {
  side: 'self' | 'opponent'
}
```

Component implementations may internally derive a `perspective: 'self' | 'opponent'` value from `playerId === viewerId` and use that for styling — that's fine. The constraint is on the *prop contract*, not the internal logic.

**Convention 2 — Data keyed by `PlayerId`, not by side.** Where the engine or UI groups data by player, use `Record<PlayerId, T>` not `{ self: T, opponent: T }`. This makes the data structure trivially extend to more than two players (spectators, replays, future game modes) and removes the implicit "self is special" assumption.

```typescript
// CORRECT
players: Record<PlayerId, PlayerState>
dice: Record<PlayerId, Die[]>

// INCORRECT
players: { self: PlayerState, opponent: PlayerState }
```

**Convention 3 — `interactable` derives from viewer + turn state, not from a hardcoded flag.** Components that have interactive elements (DiceTray, AbilityLadder, Hand, ActionBar) should derive their interactivity from `currentPlayer === viewerId`, not from a separately-passed `interactable` boolean. The dice tray is interactable when it's the viewer's turn, period — there's no need for a parent to compute and pass this.

In MVP, `currentPlayer === viewerId` is true exactly when it's the player's turn (vs. the AI's). In multiplayer, the same logic applies to the human opponent. No code change needed.

**Convention 4 — Actions match the engine's flat kebab-case discriminated unions.** Every action dispatched to the engine is a flat `{ kind, ...payload }` object whose `kind` is a kebab-case string. There is **no envelope** wrapping the action — no separate `type`, `version`, `payload`, `clientTimestamp` fields. Versioning is deferred to the multiplayer transport layer (which can wrap engine actions in a transport envelope without affecting the engine itself).

```typescript
// Discriminated union — every action the UI can dispatch to the engine.
// Names match engine/state/actions.ts exactly.
export type GameAction =
  | { kind: 'start-match', seed?: number, coinFlipWinner?: PlayerId,
      p1Hero: HeroId, p2Hero: HeroId,
      p1Deck?: CardId[], p2Deck?: CardId[],
      p1Loadout?: LoadoutSelection, p2Loadout?: LoadoutSelection }
  | { kind: 'toggle-die-lock', dieIndex: number }      // Single action — engine has no separate lock/unlock split
  | { kind: 'roll-dice' }                              // Covers both first roll and rerolls (decrements rollAttemptsRemaining)
  | { kind: 'select-offensive-ability', abilityIndex: number }
  | { kind: 'play-card', cardId: CardId,
      targetDie?: number, targetPlayer?: PlayerId, casterPlayer?: PlayerId, targetFaceValue?: number }
  | { kind: 'sell-card', cardId: CardId }              // Discard card → CP
  | { kind: 'select-defense', abilityIndex: number }   // Single action — no two-step select/confirm
  | { kind: 'spend-bank', amount: number }             // Engine supports partial spend via amount
  | { kind: 'decline-bank-spend' }
  | { kind: 'status-holder-action', status: StatusId, actionIndex?: number }
                                                        // Generic holder-action (replaces the old ATONE verb;
                                                        // Atone is implemented as status: 'lightbearer:verdict', actionIndex: 0)
  | { kind: 'respond-to-counter', cardId: CardId | null }      // null = decline
  | { kind: 'respond-to-status-removal', cardId: CardId | null } // null = allow strip
  | { kind: 'advance-phase' }                          // Engine progresses; UI rarely dispatches manually
  | { kind: 'end-turn' }                               // Ends turn from main-post (replaces the old SKIP_TURN verb)
  | { kind: 'concede', player: PlayerId }
```

**Verb mapping from earlier bible drafts** — if any older spec or scenario references the SCREAMING_SNAKE names, here is the migration table:

| Old (bible drafts) | New (engine) | Notes |
|--------------------|--------------|-------|
| `LOCK_DIE` / `UNLOCK_DIE` | `toggle-die-lock` | Single action, not two |
| `REROLL` | `roll-dice` | Same action also fires the first roll |
| `CONFIRM_ABILITY` (with `abilityId`) | `select-offensive-ability` (with `abilityIndex`) | Indexed, not ID'd |
| `PLAY_CARD` | `play-card` | Plus optional targeting params |
| `SELECT_DEFENSE` + `CONFIRM_DEFENSE` | `select-defense` | Single action |
| `SELECT_SPEND_OPTION` + `CONFIRM_SPEND` | `spend-bank` (with `amount`) | Engine supports partial spend |
| `SKIP_SPEND` | `decline-bank-spend` | |
| `SKIP_TURN` | `end-turn` | Only valid from `main-post` |
| `RESOLUTION_COMPLETE` | *(removed)* | Engine doesn't wait for UI; see Part 7.4 |
| `START_MATCH` | `start-match` (no `aiPersonality` field) | AI difficulty deferred |
| `ATONE` | `status-holder-action` (`status: 'lightbearer:verdict'`) | Generic mechanism |

**Convention 5 — Player-specific layout slots, not hardcoded positions.** The seven-band layout in Part 2 places the opponent's strip at the top and the viewer's at row 5. This is a *rendering choice*, not a hardcoded position. Components should not assume "I am at the top of the screen, therefore I render the opponent." Instead: a layout component receives `playerId` for each strip and decides positioning based on `playerId === viewerId`.

For MVP, this looks identical to "self at row 5, opponent at row 1." For multiplayer, the same code handles spectator views (where neither strip belongs to the viewer) by treating both as "non-viewer."

**Convention 6 — Reserve a layout slot for opponent's hand and dice (visibility deferred).** Even though the MVP doesn't show the opponent's hand or dice in detail, the layout should *reserve* space (or have a hooks for inserting them) at the top of the screen near the opponent strip. The visibility rules (face-down? count only? hidden entirely?) are deferred to the multiplayer phase, but the component slots exist from day one.

Concretely: `<OpponentHand>` and `<OpponentDicePreview>` are real components in MVP, they just render `null` by default. When the multiplayer phase begins and you decide on visibility rules, you fill in their render logic without touching the layout.

**What's intentionally deferred to the multiplayer phase:**
- Network transport (WebSocket setup, message protocol, heartbeat)
- Animation timeline coordination via engine timestamps (replacing `setTimeout` chains)
- Turn timers (planning timer, defense timer, reconnect grace period)
- Connection state UI (reconnecting overlay, disconnect handling)
- Waiting-state UI on the attacker's side during defender's reaction window

> **Instant card mechanics — engine's trigger-based model.** Instant cards (`kind: 'instant'`, see Part 1.9) are **NOT** a free reactive window the viewer can open at will during the opponent's turn. Engine reality: each Instant declares a `trigger: CardTrigger` (e.g., `self-takes-damage`, `opponent-fires-ability`, `opponent-removes-status`, `match-state-threshold`). The engine surfaces an instant-play opportunity ONLY when the current event matches the card's trigger — typically via `pendingCounter`, `pendingStatusRemoval`, or `choreoStore.instantPrompt`. There is no 800ms pre-commit hold, no engine-enforced reactive-window pacing floor — those were earlier bible speculation that didn't survive engine alignment. See Part 7.3.5 for the full opponent-turn Instant flow against the trigger-based model. For multiplayer the model is identical; the attacker sees a "Reacting…" indicator while the defender resolves a triggered Instant, and Instants are subject to the defender's turn-timer rules (still TBD).

**Open design questions to resolve before multiplayer build:**
- Is the opponent's hand visible (face-down cards, card count only, or hidden entirely)?
- What's the turn timer cap for planning (likely 30-45s) and defense (likely 15-20s)?
- How is reconnect handled (grace window, forfeit threshold)?

The bible will be revised with answers when multiplayer becomes the active phase. Until then, components should not bake assumptions about these into their contracts.

### 0.5 Component contract conventions

Every component in this codebase follows these conventions:

**Props are explicit and typed.** No `any`, no `unknown` without a guard. Props interface is exported from the component's index file.

**State is local unless it needs to be shared.** Component-level state (toggle flags, hover states) lives in `useState`. Cross-component state lives in stores.

**Animations are declarative.** Use Framer Motion's `<motion.div>` with `animate` / `initial` / `exit` props rather than imperative `setTimeout` choreography. Where coordinated multi-element animations are needed (the resolution pipeline), use a single `useAnimationTimer` hook that returns the current phase as a string.

**Components accept `className` as a prop.** This allows parent components to add positioning or layout-specific styles without coupling to internal styling.

**Components export named types.** A component `Foo` in `Foo.tsx` exports both `Foo` (the component) and `FooProps` (the props interface).

**No magic numbers.** Animation durations, opacity values, dimensions — all reference constants from `ui/util/duration.ts` or `ui/theme/tokens.css`.

**No inline `style` attributes — with one exception.** All visual styling lives in CSS modules. The exception is **dynamic CSS custom properties driving animations**, where the property's value changes frequently in response to engine state. The canonical example is the Cinder fuse-ring: `<div className="sig-chip cinder" style={{ '--fuse': cinderStacks * 20 }} />` — the `--fuse` custom property controls the conic-gradient fill percentage and updates as Cinder stacks change. This is a deliberate exception because CSS modules can't express runtime-computed values. Any other inline `style` usage is a code smell and should be moved to a CSS class or a CSS custom property.

### 0.6 Component hierarchy

The full tree, from root to leaves:

```
App
├── Router
│   ├── HomeScreen
│   ├── HeroSelectScreen
│   ├── HeroBookScreen
│   ├── HeroDetailScreen
│   ├── HeroCustomizationScreen        // Tabbed Abilities + Deck editor; persists per hero
│   ├── SettingsScreen
│   └── MatchScreen
│       ├── ScreenBands (the 7-band layout container)
│       │   ├── OpponentStrip
│       │   │   ├── PortraitOrb
│       │   │   ├── StripName + OpponentHandIndicator + DeckIndicator (inline in name row, right-aligned pair)
│       │   │   ├── HPTrack
│       │   │   ├── StatLabel("HP") + StatValue + StatDivider
│       │   │   ├── StatLabel("CP") + CPValue   // 0–15 numeric — no bar; more horizontal room for status chips
│       │   │   └── StatusTrack
│       │   │       ├── SignatureChip[]            // Frost-bite, Cinder, Verdict — corner-badge count
│       │   │       ├── StatusChip[]               // generic statuses, was GenericChip
│       │   │       └── BuffChip[]
│       │   ├── PhaseBanner
│       │   ├── DiceTray
│       │   │   └── Die[5]
│       │   ├── MiddleBand
│       │   │   ├── AbilityLadder                  // shown during planning
│       │   │   │   └── AbilityRow[4]
│       │   │   │       ├── AbilityValueBadge      // replaces TierBadge — damage/heal/utility variants
│       │   │   │       ├── AbilityInfo (name + text)
│       │   │   │       └── ComboGlyphStrip
│       │   │   └── FieldOfPlay (overlay shown during resolution)
│       │   │       ├── ParticleField              // only for card-play / passive / ordinary damage
│       │   │       ├── ConsumeContent             // Frost-bite/Verdict consumption scenes
│       │   │       │   └── ConsumedToken[]        // chips with strikethrough
│       │   │       ├── DetonationContent          // Cinder detonation scenes
│       │   │       │   └── ConsumedToken[]        // chips with radial burst
│       │   │       ├── DamageNumber
│       │   │       ├── EffectRows
│       │   │       └── AbilityNameDisplay
│       │   ├── SelfStrip
│       │   │   ├── PortraitOrb                    // no orbiting children; RadianceRing deprecated
│       │   │   ├── StripName + DeckIndicator      // hero name + inline deck count (replaces old StripTier slot)
│       │   │   ├── HPTrack
│       │   │   ├── StatLabel("HP") + StatValue + StatDivider
│       │   │   ├── StatLabel("CP") + CPValue
│       │   │   └── StatusTrack                    // same shape as opponent
│       │   │       └── SignatureGlyph             // e.g., Berserker Frenzy (binary lit/dark, no count)
│       │   ├── Hand
│       │   │   └── HandCard[]                     // 76×112 with cost + illustration + name + effect
│       │   └── ActionBar
│       │       └── Button[]                       // Reroll · N + Skip Turn during planning; Confirm/Cancel during prompts
│       ├── ExpandedAbilityView (modal, when tapping an ability row)
│       │   ├── ComboReadinessPanel
│       │   ├── AbilityValueBadge (large)
│       │   └── ActivateButton                     // 4 states: ineligible / eligible / spend / lethal
│       ├── ExpandedCardView (modal, when tapping a card)
│       │   ├── CardFullPreview                    // 200×288 enlarged HandCard
│       │   ├── EffectProsePanel                   // full descriptive text
│       │   └── CancelPlayBar
│       ├── DefensiveOverlay (modal, when defending)
│       │   ├── IncomingDamageBlock
│       │   └── DefensiveLadder
│       │       └── DefensiveRow[2]                 // No TierBadge — see Part 3 DefensiveRow JSX
│       ├── SpendOverlay (modal, when offered Radiance spend)
│       │   ├── AvailableResource
│       │   └── SpendOptions
│       ├── UltimateTakeover (modal, when ultimate fires)
│       │   ├── UltimatePortrait
│       │   ├── UltimateBark
│       │   └── UltimateDamageDisplay
│       └── MatchSummaryScreen (terminal, on match end)
└── GlobalLayer
    ├── ToastQueue
    └── TooltipRenderer
```

> **Notes on deprecated and renamed components.** Three components from the original tree no longer appear here: `RadianceRing` (deprecated — radiance is now a StatusChip in the status track, see Part 4.3), `ScaleBadge` (deprecated — T1 scaling now flows through the AbilityValueBadge's `value.amount`, which is the *current* achievable damage given locked dice, see Part 3.3), and `Card` (renamed to `HandCard` to make the role explicit and to distinguish it from any future card-shaped UI elements). Additionally, `GenericChip` was renamed to `StatusChip` (see Part 4.4) and `TierBadge` was first demoted from the offensive ladder and then removed from the defensive picker (the two-row layout makes the D1/D2 label redundant) — TierBadge now only renders in HeroDetailScreen reference contexts (see Part 3.3.1).

### 0.7 The resolution pipeline as a state machine

The single most important interaction model in the game is the **ability resolution pipeline**. It must be implemented as an explicit state machine, not as nested setTimeout calls. States:

```
IDLE → PRECONFIRM → FADE_IN → HOLDING → FADE_OUT → IDLE
```

Transitions and their triggers:

| From | To | Trigger | Duration |
|------|-----|---------|----------|
| IDLE | PRECONFIRM | Engine dispatches `RESOLVE_ABILITY` action | 0ms (instant) |
| PRECONFIRM | FADE_IN | After 100ms delay (allows confirm button flash) | 250ms |
| FADE_IN | HOLDING | When all entry animations complete | ~0ms |
| HOLDING | FADE_OUT | After 400ms hold | 300ms |
| FADE_OUT | IDLE | When all exit animations complete | ~0ms |

**Total resolution arc: ~2000ms.** Specifically:
- 0–100ms: confirm button flash
- 100–250ms: ladder fade-out begins, FOP fade-in begins  
- 250–450ms: ability name + base damage scale in
- 450–700ms: HP bar drops, opponent strip flashes, multi-effect rows fade in
- 700–1000ms: secondary effects render (token application, resource gain)
- 1000–1400ms: hold (everything visible, particles drift)
- 1400–1700ms: FOP fades, ladder fades back in
- 1700–2000ms: settle

This state machine is implemented in `ui/store/uiStore.ts` and the timings are constants in `ui/util/duration.ts`. Components subscribe to `resolutionPhase` and render their appropriate animations.

### 0.8 Performance baseline

Target metrics:

- **Initial bundle (before code splitting):** < 200KB gzipped JS, < 50KB CSS
- **Frame budget during resolution animation:** 16.67ms (60fps) on iPhone 12 / Pixel 6 baseline
- **Frame budget during particle bursts (Cinder detonation, ultimate cinematic):** 33.33ms (30fps) acceptable on baseline
- **Memory ceiling during a match:** < 50MB RSS
- **Time-to-interactive on first match load:** < 2 seconds on 4G

To meet these:
- Lazy-load `MatchSummaryScreen` and `HeroSelectScreen` via `React.lazy()`
- Use `will-change: transform, opacity` only on actively animating elements; remove after animation completes
- Particle field caps at 12 particles simultaneously; older particles are recycled rather than added to a growing list
- Avoid layout-triggering animations: animate `transform` and `opacity` only, never `width`/`height`/`top`/`left`/etc.

### 0.9 Accessibility baseline

- **Reduced motion.** Respect `@media (prefers-reduced-motion: reduce)`. When set, all opacity transitions remain (informational), but particle systems, scale-overshoot eases, and screen flashes are disabled. Total resolution time stays the same (~2s) so engine tick rate and UI cadence remain in sync.
- **Touch targets.** All tappable elements have a minimum 44×44px hit area (WCAG 2.2 AA). The visible art may be smaller (a 24×24 chip), but the interactive zone is expanded.
- **Color contrast.** All text in chips meets WCAG AA against its background (4.5:1 for body, 3:1 for large text). The token color palette has been audited; values in `tokens.css` are authoritative.
- **Screen reader support.** Every interactive element has an `aria-label`. Status changes (ability eligible, damage taken, ultimate ready) announce via `aria-live="polite"` regions. The match itself is not "fully accessible" via screen reader — playing the game requires sight — but key state changes are announced for context.
- **Keyboard navigation (desktop only).** Tab order: dice tray → ladder rows → hand → action bar → modals. Enter/Space confirms. Escape closes modals.

### 0.10 Coordinate system and dimensions

All dimensions in this document are given in **CSS pixels** (1 CSS pixel = 1 logical pixel, scales with device pixel ratio for HiDPI).

The reference viewport is **390×844 CSS pixels** (iPhone 14 portrait). The phone frame in the design doc is shown at 340×720 because it includes margin for the doc presentation; in production the phone *is* the viewport, edge-to-edge minus safe area insets.

When the design doc says "the middle band is 24%", that means 24% of viewport height. On the 390×844 reference viewport, the middle band is `0.24 × 844 = 202.56px`.

Components should use percentage-based heights for the seven main bands (so they adapt to different phone aspect ratios), and pixel-based sizing for internal elements (icons, badges, chips).

### 0.11 Naming conventions

- **Components:** PascalCase, named export. `AbilityRow`, not `abilityRow`.
- **CSS classes (CSS modules):** camelCase. `.abilityRow`, not `.ability-row`.
- **CSS variables (theme tokens):** kebab-case with double-dash prefix. `--gold-bright`, not `$goldBright`.
- **Animation keyframes:** kebab-case. `@keyframes lethal-pulse`, not `@keyframes LethalPulse`.
- **TypeScript types:** PascalCase. `AbilityState`, `SignatureChipProps`.
- **Constants:** SCREAMING_SNAKE_CASE. `RESOLUTION_HOLD_MS`, not `resolutionHoldMs`.
- **Engine action kinds:** kebab-case discriminators per Part 0.4 Convention 4. `select-offensive-ability`, `toggle-die-lock`. Engine event kinds are likewise kebab-case (`damage-dealt`, `status-applied`).


---

## Part 1 — Visual Foundations

This part defines the atomic visual layer: color tokens, typography, animation primitives, and accessibility rules that every component above consumes. Implement this part **first**. Until these foundations exist, no component should be built.

### 1.1 Color tokens

Tokens live in `ui/theme/tokens.css` as CSS custom properties on `:root`. All component styling references these tokens; no hardcoded colors in component CSS files.

```css
:root {
  /* === Night palette (backgrounds, surfaces) === */
  --night-deep:     #0a0a14;   /* deepest background */
  --night-mid:      #14142a;   /* mid-level surface */
  --night-stone:    #1a1830;   /* slightly lighter surface */
  --night-velvet:   #221a3a;   /* card/chip surface */

  /* === Gold palette (accents, eligible halos, gold UI) === */
  --gold:           #d4a548;
  --gold-bright:    #f0c668;
  --gold-glow:      #ffe09a;
  --gold-dim:       #6e5524;
  --gold-deep:      #443418;

  /* === Frost palette (Berserker, defensive, ice) === */
  --frost:          #4a8cc8;
  --frost-bright:   #6cb0e8;
  --frost-deep:     #1a3a5a;
  --frost-pale:     #a8d0f0;

  /* === Ember palette (Pyromancer, offense, fire) === */
  --ember:          #c84a2a;
  --ember-bright:   #f06848;
  --ember-deep:     #6e2010;
  --ember-glow:     #ff8a6a;

  /* === Dawn palette (Lightbearer, Radiance, dawn-gold) === */
  --dawn:           #fbbf24;
  --dawn-bright:    #fde088;
  --dawn-deep:      #8a6810;

  /* === Bone palette (text, neutrals) === */
  --bone:           #d8d4c0;   /* primary body text */
  --bone-bright:    #f0ecd8;   /* emphasized text, damage numbers */
  --bone-dim:       #88826c;   /* secondary text, captions */
  --bone-deeper:    #4a4638;   /* disabled, ineligible */

  /* === Status effect palette === */
  --green:          #4a8c5a;   /* Regen, beneficial effects */
  --green-bright:   #6cb07a;
  --green-deep:     #1a3a22;
  --purple:         #6a4a9a;   /* Original purple (legacy) */
  --purple-bright:  #8a6abc;
  --electric-purple:        #a778ff;   /* Stun status — Lucide zap icon */
  --electric-purple-bright: #c89bff;
  --toxic-green:        #6ec854;       /* Poison status — Lucide skull icon */
  --toxic-green-bright: #8ee874;
  --crimson:        #8a1828;   /* Lethal state */
  --crimson-bright: #c43848;

  /* === Frame and edge accents === */
  --frame-stroke:   rgba(212, 165, 72, 0.4);

  /* === Semantic aliases (component-level) === */
  --color-text:           var(--bone);
  --color-text-emphasis:  var(--bone-bright);
  --color-text-muted:     var(--bone-dim);
  --color-text-disabled:  var(--bone-deeper);

  --color-background:     var(--night-deep);
  --color-surface:        var(--night-mid);
  --color-surface-elevated: var(--night-velvet);

  --color-action-primary: var(--gold);
  --color-action-hover:   var(--gold-bright);
  --color-action-active:  var(--gold-glow);

  --color-hero-frost:     var(--frost);
  --color-hero-ember:     var(--ember);
  --color-hero-dawn:      var(--dawn);

  --color-damage:         var(--ember-bright);
  --color-heal:           var(--frost-bright);
  --color-resource:       var(--dawn-bright);
  --color-lethal:         var(--crimson-bright);
}
```

**Color contrast verification.** All UI text/background pairings must meet WCAG AA. The following pairings are pre-verified:

| Foreground | Background | Ratio | WCAG |
|-----------|-----------|-------|------|
| `--bone` | `--night-deep` | 13.6:1 | AAA |
| `--gold-bright` | `--night-deep` | 11.2:1 | AAA |
| `--ember-bright` | `--night-deep` | 8.4:1 | AAA |
| `--bone-dim` | `--night-deep` | 7.1:1 | AAA |
| `--bone-deeper` | `--night-deep` | 3.2:1 | AA-large only |
| `--gold` on `--gold-bright` | (button states) | 1.4:1 | NOT for text — borders only |

When implementing, if a contrast pairing isn't in this table, run it through a contrast checker before shipping.

### 1.2 Typography

Three font families. All are webfonts loaded from Google Fonts. The CSS in `ui/theme/fonts.css` includes preload hints to minimize FOIT.

```css
@font-face {
  font-family: 'Cinzel';
  src: url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900') format('woff2');
  font-display: swap;
  /* Use for: headings, ability names, damage numbers, tier badges, hero names */
}

@font-face {
  font-family: 'Cormorant Garamond';
  src: url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400') format('woff2');
  font-display: swap;
  /* Use for: body text, ability effect text, italic emphasis, narrative prose */
}

@font-face {
  font-family: 'JetBrains Mono';
  src: url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700') format('woff2');
  font-display: swap;
  /* Use for: technical data, dice counts, HP/CP numbers, timing display, status chip labels */
}
```

**Type scale.** Use the following scale; do not introduce intermediate sizes without updating this table.

| Token | Size | Line-height | Weight | Family | Use |
|-------|------|-------------|--------|--------|-----|
| `--font-display` | 48px | 1.1 | 800 | Cinzel | Match results (VICTORY), main heroes |
| `--font-h1` | 26px | 1.15 | 800 | Cinzel | Section titles, ultimate name |
| `--font-h2` | 18px | 1.2 | 700 | Cinzel | Modal titles |
| `--font-damage` | 56px | 0.9 | 800 | Cinzel | Field-of-play damage numbers |
| `--font-damage-ult` | 84px | 0.9 | 900 | Cinzel | Ultimate damage numbers |
| `--font-damage-small` | 18px | 1 | 800 | Cinzel | Floating status damage (e.g., Burn tick) |
| `--font-ability-name` | 11px | 1.1 | 700 | Cinzel | Ability row name |
| `--font-ability-text` | 11px | 1.25 | 400 italic | Cormorant Garamond | Ability row effect text |
| `--font-fop-ability` | 13px | 1.2 | 700 | Cinzel | FOP ability name display |
| `--font-strip-name` | 10.5px | 1 | 700 | Cinzel | Hero name on opponent/self strip |
| `--font-body` | 14px | 1.6 | 400 | Cormorant Garamond | Annotation prose, body copy |
| `--font-button` | 9.5px | 1 | 600 | Cinzel | Button labels |
| `--font-tech` | 9px | 1 | 600 | JetBrains Mono | Technical labels, HP/CP, eyebrows |
| `--font-tech-small` | 8px | 1 | 600 | JetBrains Mono | Status chip count labels |

Letter spacing is family-specific. Cinzel uses 0.04em–0.4em depending on weight; Cormorant has no extra spacing; JetBrains Mono uses 0.1em–0.5em for label text.

```css
:root {
  --font-display: 48px;
  --font-h1: 26px;
  --font-h2: 18px;
  --font-damage: 56px;
  --font-damage-ult: 84px;
  --font-damage-small: 18px;
  --font-ability-name: 11px;
  --font-ability-text: 11px;
  --font-fop-ability: 13px;
  --font-strip-name: 10.5px;
  --font-body: 14px;
  --font-button: 9.5px;
  --font-tech: 9px;
  --font-tech-small: 8px;

  --letter-spacing-display: 0.06em;
  --letter-spacing-cinzel-tight: 0.04em;
  --letter-spacing-cinzel-default: 0.08em;
  --letter-spacing-cinzel-wide: 0.15em;
  --letter-spacing-cinzel-eyebrow: 0.25em;
  --letter-spacing-cinzel-banner: 0.35em;
  --letter-spacing-tech: 0.1em;
  --letter-spacing-tech-eyebrow: 0.3em;
}
```

### 1.3 Spacing scale

Use a 4px base unit. Define tokens for the values that actually appear in the design:

```css
:root {
  --space-1: 2px;
  --space-2: 4px;
  --space-3: 6px;
  --space-4: 8px;
  --space-5: 10px;
  --space-6: 12px;
  --space-8: 16px;
  --space-10: 20px;
  --space-12: 24px;
  --space-14: 28px;
  --space-16: 32px;
  --space-20: 40px;
}
```

No 1px, 3px, 5px, or 7px spacing values. If a measurement falls between scale steps, round to the nearest scale step. Exception: border widths (1px, 1.5px, 2px, 3px allowed as `border` values, not spacing).

### 1.4 Animation primitives

All animation durations live in `ui/util/duration.ts` and are referenced as constants:

```typescript
// ui/util/duration.ts
export const DURATION = {
  // Micro-interactions
  tap: 80,                  // Confirm button flash on tap
  hover: 150,               // Hover state transition (desktop only)
  ripple: 250,              // Tap ripple effect

  // Resolution pipeline phases (must sum to ~2000)
  resolutionConfirm: 100,   // 0 → 100ms: confirm button flash
  resolutionFadeIn: 250,    // 100 → 350ms: ladder fades out, FOP fades in
  resolutionNameIn: 200,    // 250 → 450ms: ability name renders
  resolutionDamage: 200,    // 450 → 650ms: damage number scales in with overshoot
  resolutionEffects: 200,   // 700 → 900ms: multi-effect rows stagger in (100ms each)
  resolutionHold: 400,      // 1000 → 1400ms: cinematic holds
  resolutionFadeOut: 300,   // 1400 → 1700ms: FOP fades, ladder fades back
  resolutionSettle: 300,    // 1700 → 2000ms: final settle

  // Token animations
  tokenSlamIn: 250,         // Token appears on a strip
  tokenIncrement: 300,      // Stack count goes up
  tokenDecrement: 200,      // Stack count goes down
  tokenConsume: 400,        // Token consumed by ability
  tokenDetonate: 600,       // Cinder detonates

  // Ultimate
  ultimateTakeoverIn: 400,
  ultimateHold: 2700,
  ultimateTakeoverOut: 400,

  // Dice
  diceTumble: 600,          // Rolling animation
  diceSettle: 150,          // Dice settle after roll

  // HP bar
  hpDrop: 600,              // Smooth HP decrease

  // Modal overlays
  overlayIn: 300,
  overlayOut: 200,

  // Cinder threshold pulse (continuous)
  cinderPulse: 600,
  lethalPulse: 1200,
  radiancePulse: 1400,
  dawnPipPulse: 1800,
} as const
```

**Easing functions** are stored as cubic-bezier values:

```typescript
// ui/util/easing.ts
export const EASING = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',          // Smooth in-out
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',         // Ease out (entry animations)
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',         // Ease in (exit animations)
  overshoot: 'cubic-bezier(0.34, 1.56, 0.64, 1)',   // Spring-like, for damage number entry
  emphasized: 'cubic-bezier(0.2, 0, 0, 1)',         // Sharp end, for cinematic moments
} as const
```

**Standard transition declarations** (in CSS or Framer Motion):

```css
/* Opacity transitions */
transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1);

/* Scale entries (damage numbers, badges) */
transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);

/* HP bar */
transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1);

/* Color changes */
transition: background-color 200ms ease, border-color 200ms ease;
```

### 1.5 Animation keyframes (shared)

Place all `@keyframes` in `ui/theme/animations.css`. Components reference them by name; do not redeclare keyframes inside component CSS modules.

```css
/* Cinder threshold pulse — used when stacks ≥ 5 */
@keyframes cinder-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 6px rgba(240, 104, 72, 0.5);
  }
  50% {
    transform: scale(1.06);
    box-shadow: 0 0 14px rgba(255, 200, 100, 0.9);
  }
}

/* Lethal state — T4 row when conditions met */
@keyframes lethal-pulse {
  0%, 100% {
    box-shadow: 0 0 0 1px var(--crimson-bright), 0 0 22px rgba(196, 56, 72, 0.55);
  }
  50% {
    box-shadow: 0 0 0 1px var(--crimson-bright), 0 0 32px rgba(196, 56, 72, 0.8);
  }
}

/* Radiance pip threshold (when capped at 6) */
@keyframes radiance-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Dawn pip on near-eligible ability row */
@keyframes pip-dawn-pulse {
  0%, 100% {
    box-shadow: 0 0 5px rgba(251, 191, 36, 0.6), inset 0 1px 0 rgba(253, 224, 136, 0.3);
  }
  50% {
    box-shadow: 0 0 10px rgba(251, 191, 36, 0.85), inset 0 1px 0 rgba(253, 224, 136, 0.4);
  }
}

/* Dice tumble */
@keyframes dice-tumble {
  0%, 100% { transform: rotate(-8deg) translateY(0); }
  50% { transform: rotate(8deg) translateY(-2px); }
}

/* Particle drift (subtle ambient motion during hold phase) */
@keyframes particle-drift {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-12px) scale(1.2); opacity: 0; }
}

/* HP bar shimmer (decorative; subtle moving highlight along the bar) */
@keyframes hp-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Damage number scale-in with overshoot */
@keyframes damage-pop-in {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
```

### 1.6 Reduced motion

Reduced motion is a global preference detected from the user's OS. Subscribe to it via the `useReducedMotion` hook:

```typescript
// ui/hooks/useReducedMotion.ts
import { useState, useEffect } from 'react'

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return prefersReducedMotion
}
```

**What disables under reduced motion (must be implemented uniformly):**

1. Particle systems — `<ParticleField>` returns `null` instead of rendering motion particles.
2. Scale-overshoot eases — damage number entry uses linear opacity fade instead of overshoot scale.
3. Screen tint flashes — opponent strip flash on damage is replaced with a brief border-color change.
4. Threshold pulses (Cinder, Lethal, Radiance) — pulsing animations are replaced with their "peak" state held statically.
5. Dice tumble — dice show a single instant rotation rather than oscillating tumble.

**What STAYS even under reduced motion:**

1. Opacity transitions (these carry information — "ladder is fading, attention is shifting").
2. HP bar interpolation (the smooth drop communicates the magnitude of damage).
3. Status chip slam-in (positioning information; without it, chips appear from nowhere).
4. The 2000ms resolution arc total duration (engine ticks remain synced).

CSS-level fallback for components that can't trivially branch on the hook:

```css
@media (prefers-reduced-motion: reduce) {
  .particle,
  .particleField {
    display: none;
  }

  .damageNumber {
    animation: none;
    transform: scale(1);
  }

  .cinderChip.threshold,
  .lethalRow,
  .radiancePip.threshold,
  .dawnPip {
    animation: none;
  }

  .die.tumbling {
    animation: none;
  }
}
```

### 1.7 Iconography

Game icons fall into two categories. **Die-face glyphs** are defined exhaustively in Part 1.8 (the canonical die-face registry); this section covers the **UI icons** outside the dice system (HP, locks, buttons, etc.) and a brief recap of the die-face glyphs for reference.

**Die-face glyphs (recap from Part 1.8):** sword ⚔, defense ◈, momentum ▲, ultimate ✦, blank ·. The signature face is per-hero — Berserker ❄ (frost), Pyromancer 🔥 (ember), Lightbearer ☼ (sun). These six are currently rendered as Unicode glyphs and **must be replaced with inline SVG icons in production**. Unicode rendering varies by OS and font, and emoji-rendered Unicode characters break the visual style. See Part 1.8 for the authoritative `FACE_GLYPH` map.

**UI icon registry.** Create an `Icon` component for the non-die-face glyphs (action buttons, status icons, navigation marks):

```typescript
// ui/components/atoms/Icon/Icon.tsx
export type IconName =
  // Die-face symbol icons (mirror Part 1.8 SYMBOL_GLYPH map — hero-namespaced)
  | 'berserker:axe' | 'berserker:fur' | 'berserker:howl'
  | 'pyromancer:ash' | 'pyromancer:ember' | 'pyromancer:magma' | 'pyromancer:ruin'
  | 'lightbearer:sword' | 'lightbearer:sun' | 'lightbearer:dawn' | 'lightbearer:zenith'
  // UI affordances
  | 'shield' | 'heart' | 'lock' | 'unlock'
  | 'chevron-right' | 'check' | 'cross' | 'menu' | 'settings'
  // Card-category placeholders (HandCard illustration glyphs — see Part 2.9.3)
  | 'category-generic' | 'category-dice-manip' | 'category-ladder-upgrade' | 'category-signature'

export type IconProps = {
  name: IconName
  size?: number          // pixel size; defaults to 16
  color?: string         // CSS color or var; defaults to currentColor
  className?: string
}

export function Icon({ name, size = 16, color = 'currentColor', className }: IconProps) {
  // SVG path lookups from a centralized map
  const path = ICON_PATHS[name]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={className}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  )
}
```

**Icon path inventory** (to be supplied as SVG paths during build phase):

| Name | Visual | Used by |
|------|--------|---------|
| `sword` | crossed-swords mark | Sword die face, Frenzy glyph, combo pips |
| `defense` | hollow diamond with dot (◈) | Defense die face, defensive combo pips |
| `momentum` | upward triangle (▲) | Momentum die face, T3+ combo pips |
| `signature` | placeholder; resolves to hero glyph at render | Signature die face — see hero-signature entries below |
| `ultimate` | rare star (✦) | Ultimate die face, T4 combo pips |
| `blank` | mid-dot (·) | Blank die face, null state |
| `frost` | snowflake (❄) | Berserker signature face, Frost-bite chip icon |
| `ember` | flame (🔥) | Pyromancer signature face, Cinder chip icon, Burn marker |
| `sun` | radiant disc (☼) | Lightbearer signature face, Radiance chip icon, Sun Strike combo |
| `shield` | shield outline | Shield status chip, defensive tier badges |
| `heart` | heart | HP indicator (where labeled) |
| `lock` | padlock closed | Die-lock badge |
| `unlock` | padlock open | (rare; for clearing locks) |
| `chevron-right` | › | Button affordance |
| `check` | ✓ | Confirmation states |
| `cross` | ✗ | Cancellation, dismiss |

For development/sketching, Unicode glyphs are acceptable. **For shipping production code, all in-game icons must use the `<Icon>` component with SVG paths.**

> **Note on "Dawn" labeling.** Some Lightbearer ability combos (e.g., Sun Strike) reference the **defense** face but display it as "Dawn" in the readiness panel — that's Lightbearer's elemental flavor name for the defense face in hero-specific contexts. The canonical mechanical name is **defense** (per Part 1.8); flavor labels are applied at display time via the per-hero `FACE_DISPLAY_NAME` override (Part 1.8). The same defense face glyph (◈) renders identically across all heroes regardless of flavor label.

### 1.8 Hero element mapping

Each hero is associated with a primary elemental palette. This affects strip tinting, signature chip colors, and ability text accents. Define once and reference:

```typescript
// ui/types/ui.ts
export type HeroId = 'berserker' | 'pyromancer' | 'lightbearer'

export type HeroElement = 'frost' | 'ember' | 'dawn'

export const HERO_ELEMENT: Record<HeroId, HeroElement> = {
  berserker: 'frost',
  pyromancer: 'ember',
  lightbearer: 'dawn',
}

export const ELEMENT_COLOR_VAR: Record<HeroElement, string> = {
  frost: '--frost',
  ember: '--ember',
  dawn: '--dawn',
}

export const ELEMENT_COLOR_BRIGHT_VAR: Record<HeroElement, string> = {
  frost: '--frost-bright',
  ember: '--ember-bright',
  dawn: '--dawn-bright',
}
```

Components that need to tint based on hero element accept the hero ID as a prop and look up the element color through these maps, so the tinting is consistent across the entire UI.

**Die-face glyph registry.** Each hero rolls a 5-die set whose faces are **fully hero-specific** — no shared sigils across heroes. The engine encodes a die face as an object (not a string), with three fields:

```typescript
// Engine's DieFace shape (from engine/types/die.ts)
export interface DieFace {
  faceValue: 1 | 2 | 3 | 4 | 5 | 6   // The number shown on the face (1-6, uniform across heroes)
  symbol: SymbolId                    // The hero-namespaced symbol (see registry below)
  label: string                        // Display name shown in tooltips and combo readouts ("Axe", "Fur", "Howl", etc.)
}
```

> **Important — bible v0 had this wrong.** Earlier drafts of this bible specified `type DieFace = 'sword' | 'defense' | 'momentum' | 'signature' | 'ultimate' | 'blank'` — a string union with **shared** symbols across heroes. That model doesn't exist in the engine. Every hero has fully unique symbols; there is no `sword` symbol on Berserker, no `defense` symbol anywhere, no `momentum`/`ultimate`/`blank` symbol on any hero. The bible has been corrected to match engine reality.

**Hero symbol registry.** Each hero has 3-4 unique symbols, each appearing on a fixed number of the hero's 6 die-face slots. The symbol IDs are **namespaced** (`berserker:axe`, `pyromancer:cinder`, etc.) so engine code can refer to them unambiguously across heroes.

```typescript
// engine/content/symbols.ts (read-only from UI)
export type SymbolId =
  // Berserker symbols (frost-themed feral warrior)
  | 'berserker:axe'        // 3 faces — primary offensive symbol
  | 'berserker:fur'        // 2 faces — secondary, fuels Frostbite + frost combos
  | 'berserker:howl'       // 1 face  — rarest; required for T4 (Wolf's Howl etc.)
  // Pyromancer symbols (ember/ash/magma)
  | 'pyromancer:ash'       // 2 faces — common; fuels Ashfall passive (the Cinder counter)
  | 'pyromancer:ember'     // 2 faces — secondary offensive
  | 'pyromancer:magma'     // 1 face  — heavy hits
  | 'pyromancer:ruin'      // 1 face  — rarest; required for T4 (Pyric Sentence etc.)
  // Lightbearer symbols (sword/sun/dawn/zenith)
  | 'lightbearer:sword'    // 2 faces — primary offensive
  | 'lightbearer:sun'      // 2 faces — fuels Radiance + sun combos
  | 'lightbearer:dawn'     // 1 face  — utility / heals
  | 'lightbearer:zenith'   // 1 face  — rarest; required for T4 (Judgment of the Sun etc.)
```

**Per-hero die composition** (which symbol appears on each numbered face):

```typescript
// engine/content/dice.ts
export const HERO_DIE_COMPOSITION: Record<HeroId, DieFace[]> = {
  berserker: [
    { faceValue: 1, symbol: 'berserker:axe',  label: 'Axe'  },
    { faceValue: 2, symbol: 'berserker:axe',  label: 'Axe'  },
    { faceValue: 3, symbol: 'berserker:axe',  label: 'Axe'  },
    { faceValue: 4, symbol: 'berserker:fur',  label: 'Fur'  },
    { faceValue: 5, symbol: 'berserker:fur',  label: 'Fur'  },
    { faceValue: 6, symbol: 'berserker:howl', label: 'Howl' },
  ],
  pyromancer: [
    { faceValue: 1, symbol: 'pyromancer:ash',   label: 'Ash'   },
    { faceValue: 2, symbol: 'pyromancer:ash',   label: 'Ash'   },
    { faceValue: 3, symbol: 'pyromancer:ember', label: 'Ember' },
    { faceValue: 4, symbol: 'pyromancer:ember', label: 'Ember' },
    { faceValue: 5, symbol: 'pyromancer:magma', label: 'Magma' },
    { faceValue: 6, symbol: 'pyromancer:ruin',  label: 'Ruin'  },
  ],
  lightbearer: [
    { faceValue: 1, symbol: 'lightbearer:sword',  label: 'Sword'  },
    { faceValue: 2, symbol: 'lightbearer:sword',  label: 'Sword'  },
    { faceValue: 3, symbol: 'lightbearer:sun',    label: 'Sun'    },
    { faceValue: 4, symbol: 'lightbearer:sun',    label: 'Sun'    },
    { faceValue: 5, symbol: 'lightbearer:dawn',   label: 'Dawn'   },
    { faceValue: 6, symbol: 'lightbearer:zenith', label: 'Zenith' },
  ],
}
```

> **The exact face counts and number assignments above are the engine's current content** as of the audit. The UI must not hardcode these — read from `HERO_DIE_COMPOSITION` (or, equivalently, from `playerState.dice[i].faces[currentIndex]`).

**Glyph placeholders for rendering.** The engine doesn't ship glyphs — it ships symbol IDs and labels. The UI is responsible for mapping symbol → visual glyph. For MVP, the UI uses Unicode placeholders. Production will replace these with custom SVG art.

```typescript
// ui/content/glyphs.ts
export const SYMBOL_GLYPH: Record<SymbolId, string> = {
  // Berserker (frost theme)
  'berserker:axe':       '⚒',   // Hammer-and-pick (placeholder for axe SVG)
  'berserker:fur':       '❅',   // Snowflake (frost feral theme)
  'berserker:howl':      '☾',   // Crescent moon (wolfish, rare)
  // Pyromancer (ember/ash/magma theme)
  'pyromancer:ash':      '◌',   // Dotted circle (ash particles)
  'pyromancer:ember':    '△',   // Triangle (ember flame)
  'pyromancer:magma':    '◆',   // Filled diamond (heavy molten)
  'pyromancer:ruin':     '✺',   // Eight-pointed star (destructive radiance, rare)
  // Lightbearer (sword/sun/dawn theme)
  'lightbearer:sword':   '⚔',   // Crossed swords
  'lightbearer:sun':     '☼',   // Radiant sun
  'lightbearer:dawn':    '◑',   // Dawn half-circle
  'lightbearer:zenith':  '✦',   // Six-pointed star (rare peak)
}

/** Resolve glyph + label for a given die face. */
export function getFaceDisplay(face: DieFace): { glyph: string; label: string } {
  return { glyph: SYMBOL_GLYPH[face.symbol], label: face.label }
}
```

> **Why hero-unique symbols (not shared)?** A shared `sword` symbol across heroes would force every hero to have a "sword-fueled" T1, which is mechanically homogenizing. Hero-unique symbols let abilities be authored against the hero's own thematic vocabulary — Berserker abilities key off axes/fur/howl, Pyromancer off ash/ember/magma/ruin, etc. The UI is glyph-agnostic: every dice/combo widget reads symbols and labels from engine state, never assumes a specific symbol name.

**Why both number AND symbol on every face?** Each die face is a `(faceValue, symbol)` tuple. Abilities can be authored against either axis:
- **Symbol-count combos** (most common): "3 axes" reads the `symbol` field and ignores `faceValue`
- **Straight combos** (less common): "any 4 consecutive numbers" reads `faceValue` and ignores `symbol`
- **N-of-a-kind combos**: "any 3 dice matching" reads `faceValue` for sameness
- **Compound combos**: combine the above with `and`/`or` operators

One roll satisfies all reading modes simultaneously — the player never "switches mode." See Part 3.4 (ComboGlyphStrip) for the combo-type taxonomy.

**Die visual rendering** (unchanged from earlier spec): each die in the dice tray shows the symbol glyph as the main centered icon AND the `faceValue` as a small badge in the top-left corner. See `design.html#p1-layout` for the visual reference.

```css
/* Number badge on each die (top-left corner) — unchanged from v0 */
.die-number {
  position: absolute;
  top: 2px;
  left: 3px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  font-weight: 700;
  color: var(--bone-dim);
  letter-spacing: 0.02em;
  line-height: 1;
  z-index: 2;
}
.die.locked .die-number {
  color: var(--gold-bright);
}
```

> **Glyph vs card-art distinction.** Two diamond shapes appear across the visual identity and engineers should NOT confuse them:
> - **`◆` (filled diamond)** is the `pyromancer:magma` die-face glyph — rendered inside `.die-glyph` spans in the dice tray. Conveys "this die rolled a magma face."
> - **`◆` (filled diamond)** is also the card-art glyph for defensive cards (Guard, Heatward) — rendered inside `.card-art` divs in the hand. Conveys "this card is a defensive card."
>
> Same Unicode placeholder, different semantic contexts. When SVG art replaces the placeholders, magma and defensive-card-art should use visually distinct iconography (e.g., magma = molten texture; defensive card = shield silhouette).

### 1.9 Card content data model

The engine ships a structured Card type with two orthogonal axes that determine card behavior. UI rendering needs both. Visual treatment derives from `cardCategory`; playability gating derives from `kind`.

> **Important — bible v0 had this conflated.** Earlier drafts of this bible had a flat `category: 'attack' | 'defense' | 'buff' | 'utility'` field that mixed *when* a card is playable with *what kind of effect* it has. The engine separates these into `kind` (the play-time axis) and `cardCategory` (the deck-building / visual axis). The bible has been corrected to match.

**Card schema (matches engine):**

```typescript
// ui/types/card.ts — mirrors engine/types/card.ts

export type Card = {
  // Identity
  id: string                              // Stable content ID (e.g., 'lightbearer/sanctuary')
  hero: HeroId | 'generic'                // Hero who owns the card, or 'generic' for the shared pool
  name: string                             // Display name (e.g., "Sun's Blessing")
  
  // Two orthogonal classification axes:
  kind: CardKind                          // WHEN the card is playable (drives playability gating)
  cardCategory: CardCategory              // WHAT KIND of card it is (drives visual grouping, deck-build rule)
  
  // Cost + prose
  cost: number                            // CP cost to play; affordability = player.cp >= cost
  text: string                             // Raw prose; UI parses to EffectSegment[] at render time — see below
  
  // Mechanical fields (engine-side; UI rarely reads these directly)
  trigger: CardTrigger                    // When the card auto-fires (for Instants) or 'manual' (active play)
  effect: AbilityEffect                   // Structured effect tree — engine-side, ~20 effect kinds
  
  // Optional gating
  playable?: boolean                      // Computed at render time — see playCondition below
  playCondition?: CardPlayCondition       // HP threshold, damage-type match, passive-counter floor, etc.
  
  // One-shot consumption
  oncePerMatch?: boolean                  // Consumed once per match (e.g., signature Instants)
  oncePerTurn?: boolean                   // Consumed once per turn (resets at end-turn)
  
  // Mastery-specific (only set if kind === 'mastery'; see Part 1.9.5)
  masteryTier?: 1 | 2 | 3 | 'defensive'   // Which slot this mastery targets
  upgradesAbilities?: string[]            // Ability names this mastery can attach to (engine resolves by name)
  occupiesSlot?: 1 | 2 | 3 | 'defensive'  // Which masterySlot the card occupies on play
  
  // Optional cosmetics
  flavor?: string                         // OMITTED in v1 per game design — no flavor text on cards
  fx?: CardFx                             // Optional choreography hints (particle effects, beam color, etc.)
}

// ── The two classification axes ─────────────────────────────────────────────

export type CardKind = 
  | 'main-phase'      // Playable only on the owner's turn during main-pre or main-post
  | 'roll-phase'      // Playable during the owner's offensive-roll phase (between rolls)
  | 'instant'         // Playable in response to an engine trigger (see CardTrigger below)
  | 'mastery'         // Persistent ability upgrade; played main-phase, attaches to a slot

export type CardCategory =
  | 'generic'         // Hero-agnostic utility cards (the 4-of-12 baseline)
  | 'dice-manip'      // Cards that manipulate dice (set face, reroll, force value)
  | 'ladder-upgrade'  // Cards that modify abilities/ladder state (Mastery typically)
  | 'signature'       // Hero-specific signature cards (the Instants, key combos)

// ── Trigger model (replaces the bible's earlier "free reactive window") ─────

// When `kind === 'instant'`, the engine fires the card only when its trigger matches
// the current event. There is NO free reactive window — Instants are event-driven.
export type CardTrigger =
  | { kind: 'manual' }                                  // Active play on owner's turn (most cards)
  | { kind: 'self-takes-damage' }                       // Owner is being hit (Counterstrike)
  | { kind: 'self-attacked' }                           // Owner targeted by an ability (Phoenix Veil)
  | { kind: 'opponent-fires-ability', tierFilter?: number[] }  // Aegis of Dawn — fires when opponent commits an ability
  | { kind: 'opponent-removes-status', statusFilter?: StatusId[] }
  | { kind: 'opponent-applies-status', statusFilter?: StatusId[] }
  | { kind: 'self-ability-resolved', tierFilter?: number[] }
  | { kind: 'match-state-threshold', condition: ThresholdCondition }   // e.g., HP ≤ N
  | { kind: 'opponent-attempts-remove-status', statusFilter?: StatusId[] }
  | { kind: 'on-symbol-rolled', symbols: SymbolId[] }   // Fires when the owner rolls specific symbols
  | { kind: 'on-tier-fired', tier: number }             // Fires when a specific ability tier resolves

// ── UI-rendering types ──────────────────────────────────────────────────────

export type EffectSegment =
  | { kind: 'text', content: string }
  | { kind: 'keyword', id: string }       // References KEYWORD_REGISTRY[id] — see below
  | { kind: 'value', content: string }    // Numeric values, rendered in damage/heal/resource color

export type IllustrationRef = {
  asset: string                           // Asset path; e.g., "cards/sun-blessing.png"
  placeholderGradient?: string            // Optional override; defaults derived from cardCategory
}
```

> **`kind` vs `cardCategory` — which one drives what in the UI?**
> 
> - **HandCard category glyph** (Part 2.9.3): uses `cardCategory`. The four-symbol grouping (generic, dice-manip, ladder-upgrade, signature) is what players use to scan their hand and recognize card families.
> - **HandCard playability shading**: uses `kind` + current phase + `playCondition`. A `kind: 'main-phase'` card is dimmed during `offensive-roll` even if affordable.
> - **HandCard "instant available" pulse**: uses `kind === 'instant'` AND a matching `trigger` on the current engine event. Engine surfaces this via `pendingCounter` / `pendingStatusRemoval`.
> - **ExpandedCardView header label**: shows the human-readable `kind` and `cardCategory` separately (e.g., "Instant · Signature").

**Engine's `AbilityEffect` is a structured tree, not flat prose.** A typical card or ability has effects like `compound([damage(4, undefendable), apply-status('lightbearer:verdict', 1), passive-counter-modifier('radiance', +1)])`. The UI doesn't render this tree directly — the displayable prose lives in `Card.text` and `AbilityDef.shortText`/`longText`. Engineers parse the prose into `EffectSegment[]` at render time via `parseEffectText()`, and the effect tree drives engine logic. **The EffectSegment[] view is UI-only, not engine state.**

**`effectCompact` for HandCard thumbnails.** Engine's `Card.text` is the full prose. For the HandCard's 3-line thumbnail (Part 2.9.3), the UI either truncates or maintains an authored compact version. The simplest approach is a single source: the parser produces a full `EffectSegment[]` and the HandCard renderer truncates intelligently (preserving keywords). Authoring a separate compact version is optional.

**`CardPlayCondition`.** Engine's gating for whether a card can be played at all (vs. the card's *effect* having a conditional bonus, which is a separate concept). Examples: "playable only when opponent's HP ≤ 10", "playable only when an attack of damage-type 'normal' is incoming", "playable only when you have ≥ 3 Radiance banked." The UI surfaces "why this card is unplayable" via a tooltip on the dimmed card (Part 2.9.3). The full condition union is engine-defined; the UI only needs to read `playable: boolean` plus a `reasonNotPlayable?: string` hint for tooltips.

**Mastery-specific fields.** When `kind === 'mastery'`, the engine populates `masteryTier`, `upgradesAbilities`, and `occupiesSlot` to declare which slot the card targets and which abilities it can attach to. See Part 1.9.5 for the full mastery semantics, including the visual treatment of upgraded ability rows.

**Once-per-match / once-per-turn.** The engine tracks consumption via `HeroSnapshot.consumedOncePerMatchCards: CardId[]` and `consumedOncePerTurnCards: CardId[]`. The UI must visually communicate "this card has been used" — see Part 2.9.3 for the exhausted state rendering (greyscaled illustration + faded text + small "Used" badge).



**Example card data:**

```typescript
// Example: Lightbearer's "Sanctuary" — engine reality (cards/lightbearer.ts):
// a kind: 'main-phase' signature card. Cost 3. "Until your next turn, all
// incoming damage reduced by 2." Implemented as a persistent-buff with a
// pipelineModifier (incoming-damage, add −2, min 0) discarded on next-turn-of-self.

const SANCTUARY_CARD: Card = {
  id: 'lightbearer/sanctuary',
  hero: 'lightbearer',
  name: 'Sanctuary',
  kind: 'main-phase',
  cardCategory: 'signature',
  cost: 3,
  text: 'Until your next turn, all incoming damage reduced by 2.',
  trigger: { kind: 'manual' },
  effect: {
    // Engine effect tree — schematic; actual shape per engine's AbilityEffect union
    kind: 'persistent-buff',
    id: 'sanctuary',
    pipelineModifier: { target: 'incoming-damage', operation: 'add', value: -2, cap: { min: 0 } },
    discardOn: { kind: 'next-turn-of-self' },
  },
}

// The UI parses Card.text into EffectSegment[] at render time:
const SANCTUARY_SEGMENTS: EffectSegment[] = [
  { kind: 'text',    content: 'Until your next turn, all incoming damage reduced by ' },
  { kind: 'value',   content: '2' },
  { kind: 'text',    content: '.' },
]
```

**Keyword registry — engine vocabulary.**

The keyword registry is the UI's authoritative list of terms that get visual emphasis (gold Cinzel, tappable tooltip in v1.1). Below is the engine's real keyword vocabulary, derived from the card-text strings the engine actually emits.

```typescript
// ui/content/keywords.ts

export type Keyword = {
  id: string
  matchText: string[]              // Strings that, in raw effect text, parse to this keyword
  displayLabel: string             // How the keyword appears when rendered
  definition: string               // Glossary text (rendered in v1.1, not MVP)
  category: KeywordCategory
}

export type KeywordCategory =
  | 'damage-type'      // Modifies how damage is applied (undefendable, pure, etc.)
  | 'status'           // References a status effect by name
  | 'mechanic'         // Game-mechanical term (Mastery, Ultimate)
  | 'buff'             // Persistent buff card (Sanctuary)

export const KEYWORD_REGISTRY: Record<string, Keyword> = {
  // ── Damage types ────────────────────────────────────────────────────────
  // Engine's DamageType union: 'normal' | 'undefendable' | 'pure' | 'collateral' | 'ultimate'
  undefendable: {
    id: 'undefendable',
    matchText: ['undefendable', 'Undefendable', 'ub'],
    displayLabel: 'Undefendable',
    definition: 'Bypasses defensive abilities. Shield/Protect still apply unless also bypassed.',
    category: 'damage-type',
  },
  pure: {
    id: 'pure',
    matchText: ['pure', 'Pure'],
    displayLabel: 'Pure',
    definition: 'Bypasses all damage reduction including Shield, Protect, and Sanctuary.',
    category: 'damage-type',
  },
  collateral: {
    id: 'collateral',
    matchText: ['collateral', 'Collateral'],
    displayLabel: 'Collateral',
    definition: 'Splash damage from an ability that primarily targeted something else.',
    category: 'damage-type',
  },
  
  // ── Statuses (universal) ────────────────────────────────────────────────
  burn: {
    id: 'burn',
    matchText: ['Burn', 'burn', 'burning'],
    displayLabel: 'Burn',
    definition: 'At upkeep, deal damage equal to stacks; decrement by 1. Max 5 stacks.',
    category: 'status',
  },
  stun: {
    id: 'stun',
    matchText: ['Stun', 'stun', 'stunned'],
    displayLabel: 'Stun',
    definition: 'Blocks your offensive roll; the stun expires after the skipped roll. Max 1 stack.',
    category: 'status',
  },
  protect: {
    id: 'protect',
    matchText: ['Protect', 'protect'],
    displayLabel: 'Protect',
    definition: 'Reduces incoming damage 2-for-1 (2 stacks absorb 1 damage). Max 5 stacks.',
    category: 'status',
  },
  shield: {
    id: 'shield',
    matchText: ['Shield', 'shield'],
    displayLabel: 'Shield',
    definition: 'Reduces incoming damage 1-for-1. Max 3 stacks.',
    category: 'status',
  },
  regen: {
    id: 'regen',
    matchText: ['Regen', 'regen', 'regeneration'],
    displayLabel: 'Regen',
    definition: 'At upkeep, heal HP equal to stacks; decrement by 1. Max 5 stacks.',
    category: 'status',
  },
  // NOTE: `bleeding` was removed in revision 1.1 — it does not exist as a registered
  // status in engine v1 (universal statuses are burn / stun / protect / shield / regen).
  // If future content registers it, re-add the keyword here and in Part 4.4.
  
  // ── Statuses (hero-namespaced — see Part 4.4) ──────────────────────────
  frostbite: {
    id: 'frostbite',
    matchText: ['Frost-bite', 'Frostbite', 'frostbite'],
    displayLabel: 'Frost-bite',
    definition: 'Berserker signature, max 4 stacks. Ticks at the holder\'s upkeep: 1 damage, then thaws 1 stack. While held, −1 damage per stack to the holder\'s offensive abilities. Not consumed for bonus damage.',
    category: 'status',
  },
  cinder: {
    id: 'cinder',
    matchText: ['Cinder', 'cinder'],
    displayLabel: 'Cinder',
    definition: 'Pyromancer signature. Detonates when stacks reach 5: 8 undefendable damage, stacks reset to 0. Pyromancer gains +2 CP on detonation and +1 CP per stack the opponent strips.',
    category: 'status',
  },
  verdict: {
    id: 'verdict',
    matchText: ['Verdict', 'verdict'],
    displayLabel: 'Verdict',
    definition: 'Lightbearer signature, max 4 stacks. −2 damage per stack to the holder\'s offensive abilities; at 3+ stacks the holder\'s main-phase and instant cards are blocked. Holder may Atone (2 CP, main phase) to remove all stacks.',
    category: 'status',
  },
  
  // ── Signature counters (not statuses; banked on signatureState) ────────
  frenzy: {
    id: 'frenzy',
    matchText: ['Frenzy', 'frenzy'],
    displayLabel: 'Frenzy',
    definition: 'Berserker counter. Gained when taking damage from opponent abilities. Each stack adds +1 damage to offensive abilities. Max 6.',
    category: 'status',
  },
  radiance: {
    id: 'radiance',
    matchText: ['Radiance', 'radiance'],
    displayLabel: 'Radiance',
    definition: 'Lightbearer counter. Starts at 2, banks to 6 (+1 when taking damage from opponent abilities); spent via spend-bank for +2 damage per token (offensive) or −2 incoming damage per token (defensive).',
    category: 'status',
  },
  empower: {
    id: 'empower',
    matchText: ['Empower', 'empower'],
    displayLabel: 'Empower',
    definition: 'Adds to nextAbilityBonusDamage; consumed by the next offensive ability.',
    category: 'status',
  },
  
  // ── Mechanics ───────────────────────────────────────────────────────────
  mastery: {
    id: 'mastery',
    matchText: ['Mastery', 'mastery'],
    displayLabel: 'Mastery',
    definition: 'A persistent ability upgrade card. Attaches to a tier slot for the rest of the match.',
    category: 'mechanic',
  },
  ultimate: {
    id: 'ultimate',
    matchText: ['Ultimate', 'ultimate'],
    displayLabel: 'Ultimate',
    definition: "A hero's tier-4 peak ability. Requires a rare symbol combo.",
    category: 'mechanic',
  },
  
  // ── Named buffs ─────────────────────────────────────────────────────────
  sanctuary: {
    id: 'sanctuary',
    matchText: ['Sanctuary', 'sanctuary'],
    displayLabel: 'Sanctuary',
    definition: 'Pipeline buff: all incoming damage reduced by 2 until your next turn.',
    category: 'buff',
  },
}
```

> **Bible v0 corrections.** Earlier drafts of the keyword registry contained `unblockable` (engine term is `undefendable`), `pierce` (does not exist in engine), and `sanctuary` defined as a keyword (it's also a card name — see the bracket "named buffs" group above). The corrected vocabulary above is derived from the engine's actual card-text strings.

```typescript
// Helper for parsing raw text into segments at content-authoring time:
export function parseEffectText(raw: string): EffectSegment[] {
  // Implementation: iterate through registry keywords, find matches by case-insensitive
  // word-boundary match against keyword.matchText, split around them, also detect
  // numeric runs and tag them as 'value' segments. Detailed implementation lives in
  // ui/util/parseEffect.ts.
}
```

**Visual treatment of segments** (defined in Part 6.6, the ExpandedCardView spec — referenced here for completeness):

- `text` segments: Cormorant Garamond, default body color (`var(--bone)`)
- `value` segments: Cormorant Garamond, bold, color depends on context (damage values in ember-bright, heal in green-bright, resource in dawn-bright)
- `keyword` segments: Cinzel, color `var(--gold-bright)`, slight underline (1px solid `var(--gold-dim)` at 1px below baseline), `font-weight: 600`. In v1.1, also tappable to open a glossary tooltip; in MVP, decorative only.

**Conditional rendering** (when `conditions` array present):

Conditions render as a small italic line above or below the gated segments. When `isMet` is true, the condition line and its gated segments render at full opacity; when `isMet` is false, both render at 0.5 opacity with a strikethrough style on the gated segments. This way the player can see "this part of the card *would* apply *if* the condition were met" without playing it to find out.

**Content authoring workflow:**

1. Game designer writes raw card text in a content file: `"Deal 4 ub damage and apply Sanctuary."`
2. Build-time script runs `parseEffectText()` to convert raw text into `EffectSegment[]`
3. Result is committed alongside the card data, ready for rendering
4. If keyword registry changes, re-run the parse step

This separation lets non-engineers author card text in plain language while keeping the renderer's data structure clean.

### 1.9.5 Mastery cards — ability upgrade semantics

Mastery is a `kind: 'mastery'` card that **upgrades an ability slot for the rest of the match**. Mastery cards are not single-use buffs (like Sun's Blessing) and they're not Instants. When a Mastery card resolves, it attaches a persistent upgrade to a specific ability slot — and that upgraded version is what renders on the ladder, gets resolved on commit, and shows up in the Activity Log going forward.

> **Bible v0 correction — field names.** Earlier drafts of this section used `mastery.targetTier: 'T1'|'T2'|'T3'|'D'` and `mastery.targetAbilityId: AbilityId` on a nested `mastery: MasteryUpgrade` field. The engine uses three top-level Card fields instead: `masteryTier: 1 | 2 | 3 | 'defensive'` (numeric, with `'defensive'` covering both D1 and D2), `upgradesAbilities: string[]` (which abilities by **name** this mastery can attach to), and `occupiesSlot: 1 | 2 | 3 | 'defensive'` (which mastery slot the card occupies once played). Engine state is in `heroSnapshot.masterySlots: { 1?, 2?, 3?, defensive? }`. The bible has been corrected throughout. All the **UI design** (✦ glyph, dawn-bright treatment, before/after preview, targeting beam, replacement rule) is preserved — only the data model changed.

**There is one Mastery card per upgradable slot**: 1 (T1), 2 (T2), 3 (T3), and `'defensive'` (covers both D1 and D2 — see below). **T4 / Ultimate is intentionally NOT Mastery-upgradeable** — the ultimate is already the hero's signature peak ability and doesn't need an upgrade path.

**Defensive slot — name-based attachment.** Each hero has two defense slots (D1 and D2). A defensive Mastery card has `masteryTier: 'defensive'` and declares which defensive abilities it can upgrade via `upgradesAbilities: string[]` (an array of ability names). The engine resolves these names against the player's loaded defenses at play-time. If a defensive Mastery's `upgradesAbilities` includes the name of an ability the player has equipped in either D1 or D2, that defense is upgraded. The card occupies the single `defensive` mastery slot regardless of which defense it upgrades — so a player can have at most one defensive Mastery active at a time.

**Two upgrade kinds (UI projection of engine's `ability-upgrade` effect).**

The engine encodes the actual upgrade in `Card.effect` as a structured `AbilityEffect` with `kind: 'ability-upgrade'`. The UI projects this into two display kinds, based on whether the upgrade replaces the ability outright or just modifies values:

1. **`'modifier'` (UI projection)** — additive deltas applied on top of the base ability. The ability's name, combo requirement, and category are unchanged. Damage values change, status effects may be appended. Render: the ladder row keeps its identity (same name, same combo glyphs) but the AbilityValueBadge reflects the boosted number, and a small mastery indicator (✦ glyph in dawn-bright) appears next to the value badge. Example: *"T2 Glacier Strike now deals +3 damage."*

2. **`'transformation'` (UI projection)** — a complete replacement. The engine's `ability-upgrade` effect provides a full replacement ability (different name, different combo, different effect prose, possibly different damage type). Render: the ladder row re-renders the replacement ability outright. The name changes, the combo glyphs may change, the value badge may change. The same ✦ mastery indicator appears, but in a more prominent treatment to signal "this row is no longer the base ability you started with." Example: *"T1 Cleave is replaced with Whirlwind Cleave — combo changes from ⚒⚒ to ⚒⚒❅, deals different damage."*

The UI inspects the engine's `ability-upgrade` effect tree to determine which projection to render. The visible distinction is binary; the engine tree may be more nuanced (a "mostly modifier" upgrade that also tweaks the combo, for instance, still renders as `transformation` if the combo changed).

**One Mastery per slot — replacement rule.** Only one Mastery card can occupy a given `occupiesSlot` at a time. If the player plays a second Mastery card targeting an already-occupied slot, the new one **replaces** the old. The Activity Log records this explicitly: *"Mastery replaced — slot {n} now: {newName}"*. Engine state holds at most one card per slot in `heroSnapshot.masterySlots`.

**Combo re-derivation on transformation.** When a transformation Mastery resolves, the ladder row immediately re-renders against the replacement ability's combo. **The player's currently-locked dice may suddenly not satisfy the new combo** — that's a deliberate consequence of transformation, not a bug. The combo strip re-derives per Part 3.4 (against the new `combo` field), and the row's eligibility class updates accordingly. The ExpandedCardView for the Mastery card (Part 6.7) shows a preview of this so it's not a surprise.

**Playable window.** Mastery cards have `kind: 'mastery'` — playable only during the player's own `main-pre` or `main-post` phases. They are **not** playable:

- During `upkeep` or `income` (the ability slots aren't yet "in play" for the turn)
- Mid-tumble during `offensive-roll` (would cause race conditions with pip re-derivation)
- During `defensive-roll` (Mastery doesn't help with reactive defense)
- During opponent's turn (Mastery is never `kind: 'instant'`)

The HandCard `playable` derivation (Part 2.9.3) extends to filter Mastery cards against these phase constraints — the engine pre-computes the boolean and the UI just reads it.

**Cost.** Mastery cards are typically more expensive than regular cards because they have durable impact. Suggested cost curve (game-design guidance, not a hard spec): T1 Mastery ~2-3 CP, T2 ~3-4 CP, T3 ~4-5 CP, defensive ~2-3 CP. Tuning is content-side.

**Resolution flow** (full play sequence):

1. Player taps Mastery card in hand → ExpandedCardView opens, showing the upgrade prose plus a **before/after preview** of the target ability row (see Part 6.7 for the preview block)
2. Player taps Play → standard CardPlayOverlay cinematic begins, with a Mastery-specific variant (see Part 6.6.5.1)
3. The card flies to centre, a targeting beam connects the card to the target ability row on the ladder (~400ms)
4. The card dissolves into the row; the row pulses dawn-bright, then re-renders with the upgrade applied (~600ms morph)
5. Engine writes `heroSnapshot.masterySlots[occupiesSlot] = { cardId, upgrade }` and recomputes the affected ladder row(s)
6. Activity Log entry: `"Mastery applied to slot {n} — {abilityName}: +3 damage"` (modifier) or `"Mastery transformed slot {n} — now: {newAbilityName}"` (transformation)
7. CardPlayOverlay closes; control returns to the player's planning phase. UI animates over the engine's already-applied state per snapshot-and-interpolate (Part 7.4)

**Visual indicators on the ladder.** An ability slot with an active Mastery renders with:

- A small ✦ glyph in dawn-bright (`var(--dawn-bright)`) appearing to the right of the AbilityValueBadge, sized 12×12px, with a subtle 1.6s pulse animation
- For `'modifier'`: the value badge gains a dawn-bright inner glow (`box-shadow: inset 0 0 6px rgba(253, 224, 136, 0.4)`) to signal "boosted"
- For `'transformation'`: the value badge AND the ability name both gain the dawn-bright glow; the ability name shows in `var(--dawn-bright)` color instead of `var(--bone-bright)` to signal "this is a transformed slot"

When the opponent has an active Mastery, the same indicators render on their ladder — the viewer can see at a glance which slots the opponent has upgraded.

**Persistence across opponent turns and beyond.** Active Masteries persist across all turns until the match ends. They are saved to engine state (`heroSnapshot.masterySlots`) and serialized on match-save (Part 7.10). They do NOT carry across matches — every new match starts with empty `masterySlots`.

**Interaction with status effects and buffs.** Status effects (Frenzy, Empower, etc.) stack on top of Mastery boosts. A T2 ability with a +3 Mastery modifier AND 2 stacks of Frenzy on the player deals base + 3 (Mastery) + 2 (Frenzy) damage on its next commit. Frenzy consumes per its normal rules; the Mastery is persistent.

**Activity Log treatment.** Mastery applications surface in the Activity Log (Part 6.5.5) with a distinct visual treatment (dawn-bright accent on the entry, ✦ glyph prefix) to differentiate them from regular card plays. The log entry includes both the target slot and the upgrade summary so the player can scan back and see "what's still active."

**Engine fields summary** (for engineers building against this):

| Field | Type | Purpose |
|-------|------|---------|
| `Card.kind` | `'mastery'` | Discriminator for Mastery cards |
| `Card.masteryTier` | `1 \| 2 \| 3 \| 'defensive'` | Which tier the card targets |
| `Card.upgradesAbilities` | `string[]` | Ability **names** this mastery can upgrade. For T1/T2/T3, typically one entry (the active tier ability). For `'defensive'`, may list multiple defenses by name. |
| `Card.occupiesSlot` | `1 \| 2 \| 3 \| 'defensive'` | Which mastery slot the card consumes once played |
| `Card.effect` | `AbilityEffect` with `kind: 'ability-upgrade'` | Engine's structured upgrade payload — UI projects to `'modifier'` or `'transformation'` |
| `HeroSnapshot.masterySlots` | `{ 1?, 2?, 3?, defensive? }` | Currently-active Masteries per slot |



### 1.10 Atomic stat components

The hero strip rows (Part 2.2 OpponentStrip, Part 2.3 SelfStrip) are composed from three small text atoms — `<StatLabel>`, `<StatValue>`, and `<StatDivider>`. These are too small to warrant full-section specs, but they're used 11×, 5×, and 3× respectively across the bible's JSX templates, so engineers need the full spec to build them without inferring from CSS.

```typescript
// ui/components/atoms/StatLabel/StatLabel.tsx
export type StatLabelProps = {
  children: React.ReactNode             // Typically "HP" or "CP"
  className?: string
}
```

**StatLabel visual spec:**
- Font: JetBrains Mono 9px, 600 weight, letter-spacing 0.2em
- Color: `var(--bone-dim)` (default)
- Text-transform: uppercase
- Line-height: 1
- Min-width: 16px right-aligned — keeps HP and CP labels in the same x-column across rows so the eye reads them as a stat block
- Padding: none; gap to the value comes from the parent row's flex gap
- No state variations — `StatLabel` is purely decorative; semantic value lives in the adjacent `<StatValue>`

```typescript
// ui/components/atoms/StatValue/StatValue.tsx
export type StatValueProps = {
  children: React.ReactNode             // The numeric value (already formatted by parent)
  emphasis?: 'normal' | 'critical'      // critical = ember-bright for low HP; default is bone-bright
  className?: string
}
```

**StatValue visual spec:**
- Font: JetBrains Mono 10px, 700 weight, letter-spacing 0.04em
- Color: `var(--bone-bright)` (default), `var(--ember-bright)` when `emphasis="critical"` (e.g., HP ≤ 25% of max — parent decides the threshold)
- Line-height: 1
- Min-width: 16px right-aligned — accommodates 2-digit values without column shift
- Tabular numerals (`font-variant-numeric: tabular-nums`) so digit width is consistent during HP/CP ticks

```typescript
// ui/components/atoms/StatDivider/StatDivider.tsx
export type StatDividerProps = {
  className?: string
}
```

**StatDivider visual spec:**
- Renders a mid-dot glyph (`·`, U+00B7) between two stat blocks
- Font: JetBrains Mono 11px, 400 weight
- Color: `var(--bone-deeper)` — visibly subordinate to the values it separates
- Margin: 0 4px (4px gap on each side)
- Use only between **inline** stat blocks (e.g., a horizontal "HP 22 · CP 8" rendering for the hero detail screen). Not used in the main match strips where HP and CP each have their own vertical row.

**Why these are atoms, not part of the strip CSS module.** Three reasons: (1) they're reused across the OpponentStrip, SelfStrip, HeroDetailScreen, and MatchSummaryScreen, so duplicating their styles in every CSS module breaks DRY; (2) the spec is fully captured by their props — no internal state, no animation — making them ideal atoms; (3) any future surface that needs a stat readout (settings screen, replay viewer) gets consistent typography for free.

**FrameContainer — scope clarification.** The file structure (Part 0.2) lists `FrameContainer/` under `ui/components/shared/` with the comment "The phone-frame wrapper." **This is design-mockup-only**, not production code. Per Part 0.10, "in production the phone *is* the viewport, edge-to-edge minus safe area insets." The design HTML uses a `.phone-frame` wrapper to present mockups at 340×720 inside a desktop browser; the live app has no such frame. Engineers should NOT build a `<FrameContainer>` component for production. If safe-area inset handling is needed (notched phones), do it at the `<ScreenBands>` level via CSS `env(safe-area-inset-*)` — no separate component.


---

## Part 2 — Match UI Components: The Seven Bands

This part specifies the seven horizontal bands of the match screen, from top to bottom. Each band is a self-contained component that subscribes to the game state and renders accordingly. Bands compose into the `<ScreenBands>` container, which is rendered by the `<MatchScreen>` route.

**Visual reference:** `design.html#p1-layout` for the band layout overview.

> **A note on component names.** Components like `OpponentStrip` and `SelfStrip` are named after their default rendering position in single-player. Per Part 0.4 (Multiplayer-ready conventions), their **prop contracts use `playerId: PlayerId`**, not `side: 'self' | 'opponent'`. They derive their visual treatment by comparing `playerId === viewerId` internally. When the multiplayer phase begins, these may be consolidated into a generic `<HeroStrip playerId={...}>` component — but for MVP the name pair is retained for readability. Engineers should think of "OpponentStrip" as "the strip rendered for the non-viewer player," not as "the strip at the top of the screen for the opponent" — those happen to coincide in single-player, but the *contract* doesn't assume so.

### 2.1 ScreenBands container

```typescript
// ui/components/shared/ScreenBands/ScreenBands.tsx

export type ScreenBandsProps = {
  children: React.ReactNode    // The seven bands, in order
}
```

**Layout requirements:**
- Full viewport height, flex column.
- Children stack vertically. No gaps between bands; visual separation comes from each band's own border treatment.
- Container has `position: relative` so overlays (Defensive, Spend, Ultimate Takeover) can be positioned absolutely against it.
- Container has `overflow: hidden` so the field-of-play overlay can be clipped to the middle band when active.

**CSS structure** (`ScreenBands.module.css`):

```css
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, var(--night-stone) 0%, var(--night-deep) 100%);
}
```

**Band heights** (percentages of total viewport height):

| Band | Height | Notes |
|------|--------|-------|
| OpponentStrip | 13% | |
| PhaseBanner | 3.5% | Thin announcer band |
| DiceTray | 13% | Five dice + FOP timeshare — FOP cinematics cover this band along with the MiddleBand during resolution (`inset: 16.5% 0 42.5% 0`); tightened internal padding (8px top/bottom) when dice are visible |
| MiddleBand | 28% | Ladder + FOP timeshare — ability ladder during planning, field of play during resolution; expanded so ladder rows breathe (especially with prominent combo strips) |
| SelfStrip | 12% | Slightly shorter than opponent |
| Hand | 20% | Card hand — accommodates 76×112 cards with effect text and horizontal scroll; trimmed top padding |
| ActionBar | 7.5% | Buttons |
| **Total** | **97%** | Remaining 3% is small bleed/padding distributed across borders |

These percentages must sum to ≤ 100%. The discrepancy (3%) is consumed by the bands' internal borders and the tiny margins between them. Do not add additional vertical spacing between bands.

> **A note on hand sizing.** The hand band is intentionally larger (20%) than its strategic neighbors. Cards are the most information-dense element in the hand area — they must display cost, illustration, name, and effect text simultaneously. Smaller cards would require players to expand each card individually to read it, adding friction to every turn. The trade-off is slightly tighter strips and ladder, but those surfaces communicate state (HP, abilities) that's easier to read at smaller sizes than card prose.

### 2.2 OpponentStrip component

**Visual reference:** `design.html#p1-layout` (top band of the layout phone).

```typescript
// ui/components/bands/OpponentStrip/OpponentStrip.tsx

export type OpponentStripProps = {
  playerId: PlayerId            // The non-viewer player's ID; component reads state via players[playerId]
  // All visual data (heroId, hp, statuses, etc.) is derived from the engine state,
  // NOT passed as individual props. The component subscribes to gameStore via useGameState.
  // Animation hints are read from uiStore subscriptions, not props.
}
```

**The data the component reads internally** (via `useGameState(playerId)` selector hook):

- `heroId: HeroId`
- `heroName: string`
- `hp: number`, `hpStart: number`, `hpCap: number` (per-player; see Part 0.3 HeroSnapshot)
- `cp: number` (capped at global `CP_CAP = 15`)
- `signatureTokens: SignatureToken[]`
- `statusTokens: StatusToken[]`
- `cardBuffs: CardBuff[]`

**Animation hints read from uiStore:**

- `isAttacking: boolean` (true during this player's resolve phase)
- `recentDamageTaken: number | null`
- `recentLethal: boolean`

**State the strip renders:**

| State | Visual treatment |
|-------|------------------|
| Default | Ember-tinted background, ember portrait orb, ember strip name |
| Just took damage | Background flashes ember-bright for 400ms, then settles. HP bar drops with smooth animation over 600ms. A FloatingDamageNumber (Part 5.9) may render briefly above the portrait orb to surface the magnitude. |
| Lethal (HP ≤ threshold for active ultimate) | Strip background tinted crimson, portrait orb has crimson glow. The lethal *signal* lives in the phase banner ("Lethal · {ability}") and the T4 ladder row's crimson pulse — not on the strip itself. |
| Just took heal/regen | Background flashes green for 400ms; HP bar interpolates to new value over 600ms. |
| Token applied to opponent | Token chip slams into status track from offscreen right (250ms slide + glow flash) |
| Token consumed | Token chip flies into field of play (handled by FieldOfPlay component, not the strip) |

**Layout structure:**

```jsx
<div className={s.strip} data-hero-element={element} data-perspective="opponent">
  <PortraitOrb playerId={playerId} />
  <div className={s.info}>
    {/* Row 1: hero name (left) + right-of-name indicators (DeckIndicator always;
        OpponentHandIndicator only on opponent perspective). No dynamic tier text —
        transient state changes (ATTACKING, LETHAL, etc.) are communicated via
        other channels (phase banner, strip flash, ability row glow). */}
    <div className={s.nameRow}>
      <span className={s.name}>{heroName}</span>
      {perspective === 'opponent' && <OpponentHandIndicator playerId={playerId} />}
      <DeckIndicator
        playerId={playerId}
        variant={perspective === 'self' ? 'default' : 'opp'}
      />
    </div>
    {/* Row 2: HP label + value (left) + full-width HP bar */}
    <div className={s.hpRow}>
      <StatLabel>HP</StatLabel>
      <StatValue>{hp}</StatValue>
      <HPTrack playerId={playerId} />
    </div>
    {/* Row 3: CP label + value (left) + status chips (right-aligned via margin-left:auto).
        No CP bar — removed to give status chips more horizontal room. */}
    <div className={s.cpRow}>
      <StatLabel>CP</StatLabel>
      <CPValue>{cp}</CPValue>
      <StatusTrack
        playerId={playerId}
        signatures={signatureTokens}
        statuses={statusTokens}
        buffs={cardBuffs}
      />
    </div>
  </div>
</div>
```

The strip-info section is **three vertically-stacked rows**: name+indicators on top, HP-with-bar in the middle, CP-with-chips on the bottom. HP and CP labels are vertically aligned via a shared `min-width` so the eye reads them as a stat block (same pattern as MMOs and ARPGs). The HP row keeps its bar (HP magnitude matters during damage scenes — a number alone doesn't communicate "how close to dead"). The CP row is bar-less: the numeric readout is enough (CP runs 0–15 and players quickly internalize the scale), and removing the bar gives the status track more horizontal room for chips — a worthwhile trade since mid-match strips routinely carry 4–5 chips and the bar's 60px was the most compressible piece of the row.

The `data-perspective` attribute reflects whether `playerId === viewerId` (`"self"`) or not (`"opponent"`), and is used by CSS to apply position-appropriate styling. The component itself doesn't care about screen position; the layout container decides where to place it.

The OpponentHandIndicator (Part 2.11) is rendered only on the non-viewer's strip. It renders inline in the name row, immediately **left of the DeckIndicator** on the opponent strip, showing the count of cards in the opponent's hand. For the viewer's own strip (the SelfStrip), the hand is already visible at the bottom of the screen via the Hand component, so no hand indicator is needed.

**Acceptance criteria:**

1. When `recentDamageTaken` is set (non-null), the strip's background tints ember-bright over 100ms, holds for 200ms, fades back over 200ms. The HP bar animates from previous value to current value over 600ms (using `transition: width 600ms ease`).
2. The right-of-name slot renders a DeckIndicator (Part 2.9.2) on both player perspectives. For opponent strips, an OpponentHandIndicator (Part 2.11) renders **immediately left of the DeckIndicator** in the same row — both ember-tinted to visually pair. Both indicators are permanent (never hidden); they're properties of the hero, not transient state signals. State changes during play are communicated through other channels: the phase banner (for active events like "Lethal · Wolf's Howl"), strip background flash (for damage taken), ability row glow (for available eligibility), button label changes (for offered actions).
3. The strip's `data-hero-element` attribute is set to `frost | ember | dawn` for CSS targeting of hero-specific colors.
4. Touch target on the portrait is 44×44 minimum even if the orb visual is smaller. Tapping the portrait opens the hero info modal (deferred — see Part 8).
5. Status track items render in two valence sub-groups (positive on the left, negative on the right, separated by a thin vertical divider). Within each sub-group, items appear in the order they were applied (most recent rightmost). Cap visible items at 5; overflow renders a "+N" indicator (see `<StatusTrack>` spec in Part 4.6 for the full valence grammar, derivation rules, and the design-HTML reference at the start of Part Four — "Token Placement & Valence Grammar").

### 2.3 SelfStrip component

**Visual reference:** `design.html#p1-layout` (the 5th band, just below the middle).

```typescript
// ui/components/bands/SelfStrip/SelfStrip.tsx

export type SelfStripProps = {
  playerId: PlayerId            // The viewer's own player ID; in single-player, this is always viewerId
  // Same as OpponentStrip: data is read from the engine state via the playerId key, not passed as props
}
```

**The data the component reads internally** (via `useGameState(playerId)` selector hook), in addition to what OpponentStrip reads:

- `signatureResource: SignatureResource | null` (Lightbearer's Radiance, future heroes' equivalents)
- `signatureTrigger: SignatureTrigger | null` (Berserker's Frenzy, etc.)

**Animation hints read from uiStore:**

- `recentDamageTaken: number | null`
- `recentResourceGained: number | null`
- `recentTriggerFired: boolean`

**Differences from OpponentStrip:**

1. **Portrait is larger.** 48px vs opponent's 44px. The viewer's hero gets visual primacy.
2. **Frost-tinted by default** instead of ember. By convention, the viewer's strip is frost-tinted and the non-viewer's is ember-tinted — these tints encode "self / non-self" relative to the viewer, independent of hero element. The hero element only affects the portrait orb's color, not the strip background.
3. **Hosts hero-signature resources as StatusChips** (Part 4.4). When the player's hero has a signature resource like Radiance (Lightbearer), it renders as a `<StatusChip effect="radiance" count={...} />` in the StatusTrack — same shape and grammar as any other status. *Hero-specific visual treatments (signature pip bars, animated rings) are deferred to v2; for MVP, signature resources use the unified StatusChip system.*
4. **Hosts the signature trigger glyph.** When the player's hero has Frenzy or similar passive (currently Berserker only), the trigger glyph is the first item in the status track.
5. **Animation hooks for self-side events.** When `recentResourceGained` is set, the strip flashes dawn-gold for ~400ms and the relevant StatusChip in the status track pulses with `isApplying`. When `recentTriggerFired` is true, the strip briefly halos with the hero's element color. These signals communicate state changes without inserting transient tier text into the strip — the strip's name row stays stable, and transient feedback lives in chip animations and the phase banner.

All other behavior (hp, cp, status track rendering) is identical to OpponentStrip.

> **Note on consolidation.** `OpponentStrip` and `SelfStrip` share most of their implementation. They differ only in: portrait size (44 vs 48), default tint (ember vs frost), and which signature elements they render (signature StatusChips and `SignatureGlyph` only render for the viewer's side in MVP). When the multiplayer phase begins, these may merge into a single `<HeroStrip playerId={...}>` component that derives all of these differences from `playerId === viewerId`. For MVP, the two components are kept separate for clarity.

### 2.4 PortraitOrb component

**Visual reference:** `design.html#p2-radiance` shows the Lightbearer's portrait orb. (Radiance itself is rendered separately in the StatusTrack as a chip — see Part 4.4.)

```typescript
// ui/components/bands/shared/PortraitOrb.tsx

export type PortraitOrbProps = {
  playerId: PlayerId
  highlight?: 'damage' | 'heal' | 'resource' | 'trigger' | null
  // The component reads heroId from gameState.players[playerId] and derives
  // size/border/glow from whether playerId === viewerId.
}
```

**Visual specifications:**

The orb's visual treatment depends on `perspective = (playerId === viewerId) ? 'self' : 'opponent'`:

| Perspective | Size | Background gradient | Border | Default glow |
|------|------|---------------------|--------|--------------|
| opponent (non-viewer) | 44×44 | `radial-gradient(circle at 35% 30%, var(--ember-bright) 0%, var(--ember) 60%, var(--ember-deep) 100%)` | `2px solid var(--ember)` | `0 0 12px rgba(240, 104, 72, 0.5)` |
| self (viewer) | 48×48 | `radial-gradient(circle at 35% 30%, var(--frost-bright) 0%, var(--frost) 60%, #1a3850 100%)` | `2px solid var(--frost)` | `0 0 12px rgba(108, 176, 232, 0.6)` |

**Highlight states** (briefly overlaid via `highlight` prop):

- `'damage'`: glow shifts to ember-bright (`0 0 18px var(--ember-bright)`) for 600ms
- `'heal'`: glow shifts to green-bright for 600ms
- `'resource'`: glow shifts to dawn-bright (`0 0 20px var(--dawn-bright)`) for 800ms
- `'trigger'`: glow doubles in intensity (`0 0 24px var(--frost-bright)`) for 400ms with subtle scale pulse to 1.05 and back

> **No more orbiting children.** The prior `children?: React.ReactNode` prop (for hosting RadianceRing) has been removed. The PortraitOrb is a self-contained element; signature resources render in the StatusTrack, not orbiting the portrait.

### 2.5 HPTrack component

**Visual reference:** Every phone mockup shows this — the bar to the right of the HP label and value, on the HP row of the strip.

```typescript
// ui/components/bands/shared/HPTrack.tsx

export type HPTrackProps = {
  playerId: PlayerId
  variant?: 'normal' | 'lethal'   // 'lethal' switches gradient to deep crimson
  // The component reads hp, hpStart, hpCap from gameState.players[playerId] and derives
  // fill color from whether playerId === viewerId.
}
```

**Specifications:**

- Bar height: 5px
- Background: `rgba(0, 0, 0, 0.5)` with `1px solid rgba(212, 165, 72, 0.15)` border
- Width: `flex: 1` inside the hp-row (it flex-grows to fill the row after label + value), `min-width: 0` so it can shrink in narrow contexts
- Fill: `linear-gradient(90deg, [darker], [lighter])`, where the colors derive from `perspective = (playerId === viewerId) ? 'self' : 'opponent'`:
  - opponent default: `#8a1818 → var(--ember)`
  - self default: `#1a4870 → var(--frost)`
  - Lethal variant (either perspective): `#5a0810 → var(--crimson)`
- Fill width: `${(Math.min(hp, hpStart) / hpStart) * 100}%` — the bar uses `hpStart` (30) as the denominator. Over-heals above `hpStart` are visualized separately (see below).
- Transition: `width 600ms cubic-bezier(0.4, 0, 0.2, 1)` for smooth animation when HP changes
- Box-shadow on fill: `0 0 4px [matching color]` for subtle glow

**Over-heal indicator** (when `hp > hpStart`, i.e., between 30 and 40):
- A small dawn-bright overlay segment renders to the right of the standard bar, sized proportionally to `(hp - hpStart) / HP_CAP_BONUS` (so 5 over-heal = ~50% of the over-heal segment width).
- Background: `linear-gradient(90deg, var(--dawn), var(--dawn-bright))` with a subtle pulse animation (1.6s cycle).
- The over-heal segment makes the bar visually wider than `hpStart` to communicate "above normal" — the standard bar already shows "100% of 30," and the dawn-bright overhang signals over-heal.

**Edge cases:**
- If `hp === 0`, fill width is 0 (empty bar).
- If `hp < 0`, treat as 0 (defensive coding; engine should never produce negative HP but UI should be robust).
- If `hp > hpCap` (engine ceiling at 40), treat as `hpCap` (extra heals are wasted).
- The denominators `hpStart` (30) and `hpCap` (40) come from engine constants (Part 0.3) — never hardcode them in the component.

### 2.5.1 CP rendering — CPValue

**Visual reference:** Every phone mockup with a hero strip shows this — the **CP row** (third row of the strip), with the CP label and numeric value at the left and the status track filling the rest of the row. The **capped state** (cp === 15, dawn coloring) is demonstrated in isolation at `design.html#p3-active-states`.

> **CP is a single numeric readout — no bar.** Earlier iterations rendered CP as a paired `<CPValue>` + `<CPBar>` (mirroring the HP row's label + value + bar structure). The bar has been removed: CP runs 0–15 and players quickly internalize the scale, so the number alone is enough. Removing the 60px bar gives the status track meaningfully more horizontal room for chips — a worthwhile trade since mid-match strips routinely carry 4–5 chips. The HP row keeps its bar because HP magnitude matters during damage scenes (a number alone doesn't communicate "how close to dead"); CP is a planning resource, not a survival meter.

```typescript
// ui/components/bands/shared/CPValue.tsx
export type CPValueProps = {
  cp: number
  // Global CP_CAP = 15 (engine constant, Part 0.3). Not a per-player field.
  isGaining?: boolean              // Briefly highlights when CP just increased
  isSpending?: boolean             // Briefly highlights when CP just decreased
}
```

> **Deprecated components.** `<CPBar>`, the legacy `<CPDisplay>` (value + bar bundled), and the older 5-pip `<CPTrack>` are all deprecated. New code uses `<CPValue>` directly inside `.cp-row`. The component directory still exposes them as stubs that render `null` with a console warning, so older code paths fail loudly rather than silently.

**Visual structure within the cp-row:**

```
  CP 12             [Burn 2][Frost 1][Shield 3][Regen 1]
  ▲  ▲              ▲
  │  │              └── StatusTrack (margin-left: auto pushes it right)
  │  └── CPValue numeric readout (JetBrains Mono 10px, gold-bright, min-width:18px)
  └── StatLabel "CP" (uppercase, bone-dim)
```

The `cp-row` is a flex container. Order: StatLabel, CPValue, then StatusTrack. The StatusTrack uses `margin-left: auto` to push itself to the right edge of the row, and the recovered 60px of horizontal space lets it hold an extra chip or two before triggering the overflow indicator.

**Specifications:**

- **CPValue (numeric readout):**
  - Font: JetBrains Mono 10px, weight 700, letter-spacing 0.04em
  - Color: `var(--gold-bright)` (default), `var(--dawn-bright)` (capped)
  - Min-width: 18px right-aligned — accommodates 2-digit values; keeps the status track starting at a stable x-position across all CP values

**Capped state** — when `cp === CP_CAP` (player has hit the 15 ceiling):
- Apply `.capped` modifier class on the parent `.cp-row` (engine sets this in render)
- Numeric readout color shifts from `var(--gold-bright)` to `var(--dawn-bright)` with `text-shadow: 0 0 4px rgba(253, 224, 136, 0.6)`
- The visual signal: "you are wasting CP if you don't spend." With the bar gone, the capped signal lives entirely in the value's color and glow — intentionally noticeable so players learn to spend before upkeep.

**Why no "/ 15" suffix:** the maximum is always 15. Players learn it once. Showing just the current value (`12`) is cleaner than `12 / 15` at this size; the capped color shift conveys "how close to max" when it matters (i.e., at the cap). The max only appears in the ExpandedAbilityView modal and ExpandedCardView modal when affordability is the question (e.g., "Need 4 CP — have 3").

**Acceptance criteria:**
1. Numeric value updates immediately on CP changes; no bar fill animation (there is no bar).
2. When `cp === CP_CAP`, the `capped` class is applied and the dawn-colored treatment renders on the value.
3. `isGaining` triggers a brief 200ms scale pulse (1.0 → 1.15 → 1.0) on the number with a gold-bright flash at peak — the primary "+1 CP" visual is the upkeep FOP beat (Part 5.3.5); this pulse is a smaller secondary signal that lands on the strip itself.
4. `isSpending` triggers a brief 150ms color flash on the number (gold-bright → ember-bright → gold-bright), signaling "value just decreased."
5. The `.cp-row` layout reserves no width for a bar — engineers must not reintroduce a `.cp-bar` element. If a future design surfaces a need to visualize CP magnitude graphically, treat it as a new design decision rather than a rollback of this one.

### 2.6 PhaseBanner component

**Visual reference:** `design.html#p1-idle` shows the default state ("Roll · 2 of 3"). Other phases throughout the design doc show variations.

```typescript
// ui/components/bands/PhaseBanner/PhaseBanner.tsx

export type PhaseBannerProps = {
  phase: PhaseDisplay
}

export type PhaseDisplay =
  | { kind: 'roll'; current: number; total: number }
  | { kind: 'rolling' }
  | { kind: 'resolving'; abilityName: string; tone: 'gold' | 'ember' | 'frost' | 'dawn' | 'crimson' }
  | { kind: 'defense' }
  | { kind: 'spend' }
  | { kind: 'card'; cardName: string }
  | { kind: 'trigger'; triggerName: string }
  | { kind: 'upkeep-tick'; statusName: string; tone: 'ember' | 'frost' | 'dawn' | 'toxic-green' | 'green' }
  | { kind: 'upkeep-draw' }
  | { kind: 'upkeep-cp-gain' }
  | { kind: 'upkeep-deck-shuffle' }
  | { kind: 'opponent-turn'; heroName: string }
```

**Text per phase:**

| Phase kind | Text | Tone |
|-----------|------|------|
| `roll` | "Roll · {current} of {total}" | gold |
| `rolling` | "Rolling…" | gold |
| `resolving` | "Resolving · {abilityName}" | matches tone prop |
| `defense` | "Choose Your Defense" | ember |
| `spend` | "Spend Radiance?" | dawn |
| `card` | "Card Played · {cardName}" | frost |
| `trigger` | "{triggerName} · Active" | frost (Frenzy) or dawn (Vow) or hero-specific |
| `upkeep-tick` | "Upkeep · {statusName} ticks" | tone-matched to status (Burn → ember, Poison → toxic-green, Regen → green, Frost-bite → frost) |
| `upkeep-draw` | "Upkeep · Draw" | gold |
| `upkeep-cp-gain` | "Upkeep · +1 CP" | gold |
| `upkeep-deck-shuffle` | "Upkeep · Deck shuffled" | gold |
| `opponent-turn` | "{heroName}'s Turn" | ember |
| Lethal (special) | "Lethal · {abilityName}" | crimson |

**Visual:**
- Height: 3.5% of viewport
- Background: `linear-gradient(90deg, transparent, rgba(212, 165, 72, 0.18), transparent)` (gold default)
- Border-bottom: `1px solid rgba(212, 165, 72, 0.2)`
- Text: Cinzel 9px, 600 weight, 0.35em letter-spacing, uppercase
- Color: matches `tone` prop (gold by default)
- Layout: flex center, `::before` and `::after` show `◆` diamond marks bracketing the text (8px gold-dim, 8px margin from text)

Crimson tone (lethal) uses a slightly different background:
```css
background: linear-gradient(90deg, transparent, rgba(196, 56, 72, 0.25), transparent);
```

**Trigger button slot.** The PhaseBanner hosts a single interactive element: the activity log trigger button at the right edge of the banner (replacing the prior decorative `::after` diamond mark). This is the only place in the seven-band layout where the activity log can be opened from. See Part 6.5.5 ActivityLog component for the trigger's full specifications, pulse-animation logic, and what happens when tapped. The left `::before` diamond mark is preserved for visual balance; only the right diamond was replaced by the button.

### 2.7 DiceTray component

**Visual reference:** `design.html#p1-idle` shows the dice tray with 2 dice locked. `design.html#p1-mid-roll` shows the tumbling state.

```typescript
// ui/components/bands/DiceTray/DiceTray.tsx
import type { DieFace, DieFaceComposition } from 'ui/content/dice'

export type DiceTrayProps = {
  dice: Die[]                     // Exactly 5 dice for the ACTIVE player (gameState.currentPlayer's dice)
  isRolling: boolean              // True during the rolling animation
  onDieTap?: (dieIndex: number) => void   // For locking/unlocking
  interactable?: boolean          // False during resolution, opponent turn, etc.
  // The active player owns these dice. When it's the opponent's turn, the DiceTray
  // renders the opponent's dice (read-only) so the viewer can watch the AI roll
  // and lock — see Part 7.3.5.1 for the active-player display rule.
}

export type Die = {
  face: DieFaceComposition        // The current rolled face — { number, sigil }
  locked: boolean
  rollSeed?: number               // For reproducible rolling animation; optional
}

// DieFace is now an OBJECT shape defined in Part 1.8 (engine's interface):
//   { faceValue: 1-6, symbol: SymbolId (hero-namespaced, e.g., 'berserker:axe'), label: string }
// Use SYMBOL_GLYPH from Part 1.8 to resolve the glyph for rendering, and read face.label
// for tooltip / combo-readout display. Do NOT use the old flat string union from bible v0
// ('sword' | 'defense' | ...) — that model doesn't exist in the engine.
```

**Layout:**
- Height: 13% of viewport
- Flex row, center-justified, 5px gaps
- Padding: 6px vertical, 8px horizontal
- Background: subtle radial gradient (`radial-gradient(ellipse at center, rgba(74, 140, 200, 0.06), transparent 70%)`)
- Decorative gold-dim lines extending from left and right edges to center (1px height, 24px wide)

**Each Die child** (`<Die>` component, separately specified):

```typescript
export type DieProps = {
  face: DieFace
  locked: boolean
  isRolling: boolean
  rollDelay?: number              // Stagger for the tumble animation (0–200ms)
  interactable: boolean
  onTap?: () => void
}
```

Die visual:
- 42×42px, aspect-ratio 1
- Background: `linear-gradient(135deg, #1a2840 0%, #0e1828 100%)` (default)
- Locked background: `linear-gradient(135deg, #3a2814 0%, #1a1408 100%)`
- Border: 1.5px `var(--frost)` default, `var(--gold)` when locked
- Border-radius: 8px
- Box-shadow: `0 3px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(108, 176, 232, 0.25)` default; locked version uses gold glow
- Face glyph: 22px, hero-element color
- Lock badge (when locked): 14×14 gold circle in bottom-right, contains "🔒" or `<Icon name="lock" />` at 8px
- Tumble animation when `isRolling`: animation `dice-tumble` 600ms ease-in-out infinite, with `rollDelay` as `animation-delay`

**Acceptance criteria:**
1. Tapping a die when `interactable` is true and the die is not currently rolling dispatches the `toggle-die-lock` action via the game store.
2. When `isRolling` is true: the unlocked dice tumble, locked dice remain stationary. The `interactable` is forced to false (no taps registered). Tumble animation runs for 600ms then dice settle to their final face values.
3. Each die's tumble has a slight stagger via `rollDelay` (die 0: 0ms, die 1: 80ms, die 2: 160ms, ...) to avoid synchronized motion that looks robotic.
4. The face glyph color follows the hero element of the **current player**, not a fixed color. Berserker's dice glyphs are frost-bright; Pyromancer's are ember-bright; Lightbearer's are dawn-bright. The locked-die glyph shifts to gold-bright regardless of hero.

### 2.8 ActionBar component

**Visual reference:** `design.html#p1-idle` shows the default planning-phase state with "Reroll · N" and "Skip Turn" buttons.

```typescript
// ui/components/bands/ActionBar/ActionBar.tsx

export type ActionBarProps = {
  buttons: ActionButton[]
}

export type ActionButton = {
  id: string
  label: string
  variant: 'default' | 'primary' | 'crimson' | 'disabled' | 'skip'
  badge?: string | number          // e.g., reroll count "1"
  onTap?: () => void
  iconRight?: IconName             // Optional chevron-right
  iconLeft?: IconName
}
```

**Layout:**
- Height: 7.5% of viewport
- Background: `linear-gradient(0deg, rgba(0,0,0,0.7), rgba(0,0,0,0.4))`
- Border-top: 1px var(--frame-stroke)
- Padding: 6px vertical, 10px horizontal
- Flex row, 6px gaps, center-aligned

**Button visuals:**

| Variant | Background | Border | Color | Flex weight |
|---------|-----------|--------|-------|-------------|
| default | `linear-gradient(180deg, rgba(212, 165, 72, 0.12), rgba(110, 85, 36, 0.05))` | `1px solid var(--gold-dim)` | `var(--bone)` | 1 |
| primary | `linear-gradient(180deg, var(--gold-bright), var(--gold-dim))` | `1px solid var(--gold)` | `var(--night-deep)` | 1.5 |
| crimson | `linear-gradient(180deg, var(--crimson-bright), var(--crimson))` | `1px solid var(--crimson-bright)` | `var(--bone-bright)` | 1.5 |
| disabled | same as default, but opacity 0.55 | same | same | same as base variant |
| skip | `linear-gradient(180deg, rgba(40, 40, 60, 0.6), rgba(20, 20, 40, 0.4))` | `1px solid rgba(212, 165, 72, 0.25)` | `var(--bone-dim)` | 0 (auto-sized via padding) |

All buttons:
- Border-radius: 4px
- Font: Cinzel 9.5px, 600 weight, 0.15em letter-spacing, uppercase (skip variant is smaller: 8.5px, 500 weight, opacity 0.75)
- Box-shadow on primary: `0 0 16px rgba(212, 165, 72, 0.4)`
- Box-shadow on crimson: `0 0 16px rgba(196, 56, 72, 0.5)`

**Common button configurations:**

Skip Turn is **always present** in the action bar at the leftmost position. Its enabled/disabled state depends on context. Roll/Reroll (or other context-specific buttons) occupy the rest of the bar:

| Context | Buttons (left → right) |
|---------|------------------------|
| Planning phase, before first roll | `[{Skip Turn, skip, enabled}, {Roll, default}]` |
| Planning phase, after first roll | `[{Skip Turn, skip, enabled}, {Reroll · N, default}]` |
| Planning phase, no rerolls left | `[{Skip Turn, skip, enabled}, {Reroll · 0, disabled}]` |
| Defensive choice | `[{Skip Turn, skip, disabled}, {Confirm Pick, primary, iconRight: chevron-right}]` |
| Spend prompt | `[{Skip Turn, skip, disabled}, {Skip Spend, default}, {Confirm Spend, primary}]` |
| Resolution active (~2000ms) | `[{Skip Turn, skip, disabled}, {Reroll · N, disabled}]` — both buttons disabled |
| Upkeep | `[{Skip Turn, skip, disabled}, {Auto-Continue, default, disabled}]` |
| Opponent's turn (UPKEEP / ROLL / PLAN) | `[{Skip Turn, skip, disabled}, OpponentTurnIndicator]` — the right slot renders as a non-interactive indicator showing `"Opponent · {phase}"` (Cinzel 11px, bone-dim, uppercase, letter-spacing 0.15em). Subtle ember tint on the slot background to reinforce "the opponent is acting." See Part 7.3.5.4 for full spec. |
| Atone prompt (Pyromancer) | `[{Skip Turn, skip, disabled}, {Decline Atone, default}, {Continue Turn, primary}]` |
| Modal open (ExpandedCardView / ExpandedAbilityView) | `[{Skip Turn, skip, disabled}, {Reroll · N, disabled}]` — modal content takes focus; action bar is locked |

> **Roll vs Reroll labeling.** The same physical button serves both states. On the player's first roll of the turn, the label reads simply "ROLL". After the first roll, the label changes to "REROLL · N" where N is the rerolls remaining (e.g., "REROLL · 2" → "REROLL · 1" → "REROLL · 0 (disabled)"). The badge counter only appears when N is meaningful (after first roll); for the initial Roll button there's no count. The same i18n key (`actionBar.roll` / `actionBar.reroll`) covers both, with the button content deriving from the dice-state at render time.

**Disabled visual specs:**

| Element | Generic `.disabled` | Skip Turn `.skip.disabled` |
|---------|---------------------|----------------------------|
| Opacity | 0.55 | 0.3 (more aggressive) |
| Cursor | not-allowed | not-allowed |
| Pointer events | none | none |
| Filter | none | `saturate(0.5)` |
| Border color | unchanged | `rgba(212, 165, 72, 0.12)` (fainter) |
| Background | unchanged | very faint gradient `rgba(30, 30, 50, 0.4) → rgba(15, 15, 30, 0.25)` |
| Text color | unchanged | `rgba(180, 168, 142, 0.5)` (muted bone) |

Skip Turn's disabled state is intentionally **more muted than the generic disabled state** because it's already a low-prominence button at full opacity. If it used the same 0.55 opacity as generic disabled, it would still draw attention competing with the active primary action. The 0.3 opacity + desaturation + faded border makes it clearly recede into the background while still occupying its slot.

**Skip Turn confirmation flow:**

Tapping the Skip Turn button (when enabled) opens a small centered confirmation sheet (`.skip-confirm-overlay`) with a title, body, and two buttons:

```
   ┌────────────────────────────┐
   │       END YOUR TURN?       │
   │                            │
   │  Skipping forfeits your    │
   │  remaining rolls and any   │
   │  cards you could play.     │
   │                            │
   │  [ Cancel ]  [  Skip  ]    │
   └────────────────────────────┘
```

- Background: rgba(0, 0, 0, 0.7) with backdrop-blur 4px
- Sheet: 80% width (max 280px), gradient background, 8px radius, gold-dim border
- Title: Cinzel 13px uppercase, bone-bright color
- Body: Cormorant Garamond italic 13px, bone color
- Buttons: 32px height, equal flex weight, Cancel (default variant) on left, Skip (primary or crimson) on right

Confirm advances the turn (engine emits `TURN_END`). Cancel dismisses and returns to planning. The confirmation overlay uses z-index 60 (above all match overlays except defense and FOP).

**Acceptance criteria:**

1. Buttons are tappable only when not in `disabled` variant. The disabled visual is dimmed (opacity 0.55 for generic; 0.3 for Skip Turn) and tap registers as a no-op with a soft denial audio cue. `pointer-events: none` ensures taps pass through to anything underneath (relevant for cases where the action bar is below a modal).
2. The primary roll-state button (Roll or Reroll · N) renders on the **right side** of the bar (matches the reading flow: secondary action → primary action, and protects the right-edge thumb-zone for the action players take most often). The Skip Turn button renders on the **left side** in its small `skip` variant — far from the primary action to prevent misclicks.
3. On tap, the button briefly scales to 0.96 then back to 1 (80ms each way) for tactile feedback. This animation is suppressed under `prefers-reduced-motion`.
4. Skip Turn requires a confirmation when tapped (in its enabled state): tap opens the confirmation sheet; user must explicitly tap "Skip" to end the turn. Tapping the backdrop or the Cancel button dismisses without ending the turn.
5. **Skip Turn never disappears.** It's always rendered in the leftmost slot of the action bar. Enabled state during player's planning phase; disabled state in all other contexts (resolution, defensive picker, spend prompt, opponent turn, Atone prompt, modal-open). Engineers must NOT conditionally remove the button from the DOM based on phase — only toggle its enabled/disabled state.

> **Localization note.** All player-facing strings — "Reroll", "Skip Turn", "End Your Turn?", "Cancel", "Skip", "Confirm Pick", "Confirm Spend", "Choose Your Defense", every ability name, every card name — live in the i18n string registry (`ui/locale/en.json`), not as hardcoded strings in JSX. French translation lands post-v1 per Part 10.9, but the registry keys must exist from day one so the swap is a content update, not a code refactor.

### 2.9 Hand component

**Visual reference:** `design.html#p4-hand` shows the 5-card hand with full anatomy callouts. `design.html#p1-idle` shows it in match context.

The hand is a **recognition surface**, not a **reading surface**. Cards in the hand are too small to read effect text legibly; that detail lives in the ExpandedCardView (Part 6.6). The hand needs to show enough that veterans recognize their cards at a glance, and newer players can tell which card is which.

```typescript
// ui/components/bands/Hand/Hand.tsx

export type HandProps = {
  playerId: PlayerId               // Whose hand to render; in MVP, always viewerId
  onCardTap?: (cardId: string) => void
  onCardLongPress?: (cardId: string, anchor: { x: number, y: number }) => void
  // The component reads card data from gameState.players[playerId].hand
  // Interactability is derived: enabled when playerId === viewerId AND currentPlayer === viewerId
}
```

**Layout:**
- Height: 20% of viewport
- Flex row, end-aligned (cards anchor to bottom)
- Gap: 6px between cards
- Padding: 4px top, 12px sides, 4px bottom (trimmed from prior 8/12/6 to give the ladder above more room and let cards sit closer to the band edge)
- Background: `linear-gradient(0deg, rgba(0,0,0,0.5), transparent)`
- **`overflow-x: auto`** — horizontal scrolling enabled
- **`scroll-snap-type: x mandatory`** — cards snap to position on swipe release
- `-webkit-overflow-scrolling: touch` — momentum scrolling on iOS
- `scrollbar-width: none` and `::-webkit-scrollbar { display: none }` — hide scrollbar
- `justify-content: flex-start` on the scroll content — cards left-align, swipe reveals more

**Why horizontal scroll:** At 76×112px per card with 5 cards in hand, the total card width is 380px + gaps (24px) = 404px. The standard phone viewport is 360-390px wide. Five cards cannot fit on screen simultaneously. The hand uses horizontal scroll with snap points so the player swipes left/right to bring off-screen cards into view.

**Cards visible at rest:** The hand sizes itself so that approximately **4 cards are fully visible** and a fifth card **peeks at the right edge** — communicating "you have more cards, swipe to see them." For typical 5-card hands, this means 4 visible + 1 peek. For 4-card or smaller hands, all cards visible, no peek. For 6+ card hands (over-cap), more cards remain off-screen.

**Card layout (NOT fanned):** Cards render upright in a single row. The earlier "fan rotation" design was incompatible with horizontal scrolling — rotated children produce off-center snap points and unreliable touch hit detection. Instead, the card the player is currently focused on (most recently tapped, or the centered card during scroll) gets a subtle **lift effect**: `translateY(-4px)` with a slightly stronger drop shadow. This preserves a sense of "this card is the one you're considering" without breaking scroll behavior.

**Scroll snap points:** Each card has `scroll-snap-align: start` with `scroll-padding-left: 12px` on the container. This snaps each card to the left edge of the visible area after the side padding, ensuring the leftmost-visible card is always fully rendered (no partial card cropping at the left edge).

**Long-press conflict:** Touch-based long-press detection must distinguish between a long-press (stationary touch) and a scroll gesture (touch with movement). The `useLongPress` hook (Part 6.3) cancels the long-press timer if pointer movement exceeds 8px during the hold window. This means scrolling never accidentally triggers a tooltip.

**Acceptance criteria:**

1. Renders one `<HandCard>` per card in `players[playerId].hand`.
2. Hand renders cards in the order returned by the engine. No re-sorting in UI.
3. When tapping a card, dispatches `onCardTap(cardId)` regardless of playability — the parent (MatchScreen) decides whether to open the ExpandedCardView or play a denial animation.
4. Long-press (≥400ms hold with <8px movement) dispatches `onCardLongPress(cardId, anchor)` for tooltip rendering.
5. Horizontal scrolling enabled; cards snap to position on release; scrollbar is invisible.
6. Approximately 4 cards visible at rest with the 5th peeking on the right edge for 5-card hands.
7. Swipe momentum scrolls smoothly on iOS (momentum-touch enabled).
8. The `<DeckIndicator>` (Part 2.9.2) is **NOT a child of the Hand band**. It lives inline in the SelfStrip's name row. The Hand band has no deck info embedded — the indicator is positionally on the strip but conceptually associated with the deck flow.

### 2.9.2 DeckIndicator component

**Visual reference:** Every match scene in `design.html` shows this inline in the **SelfStrip's name row**, right of the hero's name (e.g., "BERSERKER  ·  [12]"). `design.html#p2-upkeep-sequence` shows it in the turn-start draw beat where the count decrements as a card is drawn. Low-deck and empty states are demonstrated in scenes with `class="deck-indicator inline low"` and `class="deck-indicator inline empty"` respectively.

```typescript
// ui/components/bands/Hand/DeckIndicator.tsx

export type DeckIndicatorProps = {
  playerId: PlayerId
  // The component reads deck count from gameState.players[playerId].deck.length
  // and discardPile.length for the reshuffle detection. No interactivity in v1.
}
```

> **Note on component location.** Despite being filed under "Hand" in the directory tree, the DeckIndicator is rendered **inside the SelfStrip's name row**, not inside the Hand band. The "Hand" categorization in the file tree reflects conceptual ownership (deck → hand is the card flow), but the actual DOM placement is on the SelfStrip. This is intentional — see "Why inline in the name row" callout below.

**What it shows:**

The DeckIndicator is a compact visual element (`auto-width × 16px`) styled as a stylized card-back stack with a number. The count of cards remaining in the deck is rendered inside using JetBrains Mono 9px. **No discard count, no shuffle-history indicator** — just the remaining draw count. Players who want detailed deck state can consult the activity log.

**Visual specifications:**

- Size: `min-width: 16px` × `height: 16px`, padded `2px 5px` (auto-grows for 2- and 3-digit counts)
- Background: `linear-gradient(180deg, #2a2a4a 0%, #1a1a3a 100%)` (matches the deck-back aesthetic from card-draw animations)
- Border: `1px solid var(--gold-dim)` (or `var(--gold-bright)` in low state, `var(--bone-deeper)` in empty state)
- Border-radius: 2px
- Inner border (`::before`): `inset: 1px`, `1px solid rgba(212, 165, 72, 0.18)` — inner detail line
- Stacked-card depth effect (`::after`): a duplicate rectangle offset `-2px / -2px` behind the primary card, suggests "this is a stack"
- Font: JetBrains Mono 9px, weight 700
- Color: `var(--bone)` default, `var(--gold-bright)` in low state, `var(--bone-deeper)` in empty state

**Positioning — inline in the SelfStrip name row:**

The DeckIndicator is a flex child of `.strip-name-row` inside both the SelfStrip and OpponentStrip, anchored to the right edge of the name row via `margin-left: auto`:

```jsx
<div className={s.nameRow}>
  <span className={s.name}>{heroName}</span>
  <DeckIndicator
    playerId={playerId}
    variant={perspective === 'self' ? 'default' : 'opp'}
  />
</div>
```

Both strips render the indicator. The `opp` variant adds ember-tinted borders to distinguish from the player's gold-tinted default — same shape, same position, different tone.

```css
.deck-indicator.inline {
  display: inline-flex;
  align-items: center;
  align-self: center;
  padding: 2px 5px;
  min-width: 16px;
  height: 16px;
  margin-left: auto;  /* pushes to right end of name row */
  /* ...visual styles above */
}
```

**States:**

| State | Trigger | Visual treatment |
|-------|---------|------------------|
| Default | deck count > 3 | Static gold-dim border, bone color text. |
| Low | deck count 1–3 | Gold-bright border, gold-bright text, **pulse animation** (2s ease-in-out infinite breathing halo). Visual signal: "you're about to reshuffle." |
| Empty | deck count == 0 | Dimmed (`opacity: 0.4`), bone-deeper color, bone-deeper border, no animation. Renders "0" as text. |

```css
.deck-indicator.inline.low {
  border-color: var(--gold-bright);
  color: var(--gold-bright);
  animation: deck-low-pulse-inline 2s ease-in-out infinite;
}
@keyframes deck-low-pulse-inline {
  0%, 100% { box-shadow: 0 0 0 1px rgba(0,0,0,0.3), 0 0 4px rgba(212, 165, 72, 0.4); }
  50%      { box-shadow: 0 0 0 1px rgba(0,0,0,0.3), 0 0 8px rgba(240, 198, 104, 0.8); }
}
```

**Animation source for card draws:**

When the engine emits `CARD_DRAW`, the new card animates **from the DeckIndicator's screen position** down into the hand. Since the indicator sits in the SelfStrip's name row (above the hand), the animation flows naturally from top-right to the hand. The visual: the indicator's number decrements (with a brief gold flash), a card materializes near the indicator's position, then slides down-left to its hand position over 600ms. After the slide settles, a 100ms gold glow flash signals "drawn."

If the deck is empty when a draw is requested:
1. The discard pile is reshuffled into the deck — the indicator briefly shows "↻" (reshuffle glyph) for ~400ms, then displays the new total
2. The card draw then proceeds normally
3. The phase banner reads "Upkeep · Deck shuffled" during the reshuffle beat

**Why no interactivity:** In v1, tapping the DeckIndicator does nothing. Future iterations may make it openable to show deck composition (player's full deck list with discard pile) or to reveal "next card peek" effects from cards or abilities. Out of scope for the initial release.

**Opponent DeckIndicator:** The same component renders on the OpponentStrip's name row, showing the opponent's remaining deck count. It uses a tone-differentiated variant (`.deck-indicator.inline.opp`) — ember-tinted border instead of gold — so players can distinguish their own deck count from the opponent's at a glance. The mechanics are otherwise identical: low-state pulse, empty-state dimming.

```jsx
<div className={s.nameRow}>
  <span className={s.name}>{heroName}</span>
  <DeckIndicator playerId={playerId} variant={perspective} />
  {/* both strips now render an indicator; opponent variant uses ember tint */}
</div>
```

### 2.9.3 HandCard component

A single card in the hand. **76×112px** — sized to accommodate cost, illustration, name, and an effect text summary simultaneously, so players can read their hand at a glance.

```typescript
// ui/components/bands/Hand/HandCard.tsx

export type HandCardProps = {
  card: Card                       // From the card data model in Part 1.9
  position: number                 // 0–4 (or higher for overflow); index in hand
  playable: boolean                // True if the player can play this card now — see derivation below
  affordable: boolean              // True if the player has enough CP
  onTap: () => void
  onLongPress: (anchor: { x: number, y: number }) => void
}

// `playable` derivation (parent component computes and passes in):
//
//   const isViewerTurn = gameState.activePlayer === viewerId
//   const noBlockingModal = uiStore.activeOverlay === 'none' || uiStore.activeOverlay === 'tooltip'
//   const playable =
//     affordable &&
//     (isViewerTurn
//       ? matchesPhase(card.kind, gameState.phase) && noBlockingModal
//       : card.kind === 'instant' && hasMatchingInstantPrompt(card, choreoStore.instantPrompt))
//
// On the viewer's own turn: card playable if `kind` matches current phase (main-phase → main-pre/main-post,
// roll-phase → offensive-roll, mastery → main-pre/main-post). On the opponent's turn: only `kind: 'instant'`
// cards are playable, AND only when the engine surfaces a matching trigger via pendingCounter /
// pendingStatusRemoval / choreoStore.instantPrompt. See Part 7.3.5 for the engine's trigger-based Instant flow
// and the v1 Instant card registry.
```

**Visual structure:**

```
┌──────────────┐
│ ◉            │ ← Cost pip (20×20, top-left, overhangs by 5px)
│              │
│ [illustration]│ ← Illustration slot, ~64×44 area
│              │
├──────────────┤
│ ⚔  Sun's Bl. │ ← Name strip, 14px: category icon + name
├──────────────┤
│              │
│  Deal 4 ub   │ ← Effect text, up to 3 lines, Cormorant 8.5px
│  + Sanctuary │   with keyword highlighting inline
│              │
└──────────────┘
```

**Card body:**
- Size: **76×112px**
- Background: `linear-gradient(180deg, #2a2440 0%, #14142a 100%)`
- Border: 1px `var(--frame-stroke)` (default), `1.5px solid var(--gold)` when playable + affordable, `1px solid var(--bone-deeper)` when unaffordable
- Border-radius: 6px
- Padding: 5px
- Position: relative (for cost pip overhang)
- Display: flex column

**Cost pip** (20×20px circle, top-left overhang):
- Position: `top: -5px; left: -5px`
- Background:
  - Affordable: `radial-gradient(circle at 30% 30%, var(--gold-glow), var(--gold))` with `1px solid var(--gold-deep)`
  - Unaffordable: `radial-gradient(circle at 30% 30%, var(--bone-dim), var(--bone-deeper))` with `1px solid var(--ember)` (red tint border)
- Color: `var(--night-deep)` (affordable) or `var(--bone-dim)` (unaffordable)
- Font: Cinzel 12px, 800 weight
- Box-shadow: `0 1px 3px rgba(0,0,0,0.6), 0 0 6px rgba(212, 165, 72, 0.5)` (affordable only)
- Content: the cost number
- z-index: 2 (above card content)

**Illustration slot:**
- Position: top region of the card flex column, height ~44px
- Approximate width: 64px (full width minus padding)
- Default rendering (no art supplied): gradient background tinted by **`cardCategory`** (per Decision 8 — the visual-grouping axis, NOT `kind`), with category glyph centered at 22px:
  - `generic`: `linear-gradient(135deg, rgba(212, 165, 72, 0.30), rgba(110, 85, 36, 0.12))` + 22px diamond glyph (◆) in `var(--gold-bright)` — cross-hero utility cards
  - `dice-manip`: `linear-gradient(135deg, rgba(160, 130, 220, 0.30), rgba(70, 50, 110, 0.12))` + 22px die-cube glyph (⚂) in `var(--frost-bright)` — dice-manipulation cards
  - `ladder-upgrade`: `linear-gradient(135deg, rgba(253, 224, 136, 0.35), rgba(140, 110, 60, 0.15))` + 22px ascending-bars glyph (▲) in `var(--dawn-bright)` — ability/ladder modifiers (Masteries live here)
  - `signature`: `linear-gradient(135deg, rgba(200, 74, 42, 0.35), rgba(110, 32, 16, 0.15))` + 22px hero-element glyph in the hero's element color (frost/ember/dawn) — hero-signature cards (Instants, key combos)
- When art is supplied: render the asset image scaled to fit, preserving aspect ratio
- Border-radius: 3px
- Margin-bottom: 3px

> **Why `cardCategory` and not `kind`?** Per Decision 8, the four-category visual grouping (`generic | dice-manip | ladder-upgrade | signature`) is what players use to scan their hand at a glance — it describes *what kind of card this is in my deck*. The orthogonal `kind` axis (`main-phase | roll-phase | instant | mastery`) describes *when the card can be played* — that's playability gating, which surfaces through dimming + tooltip text, NOT through the illustration palette. A Mastery card has `kind: 'mastery'` AND `cardCategory: 'ladder-upgrade'`; the player reads the gold-bars illustration as "ladder-upgrade card," and the long-press tooltip explains "Playable during your main phase."

> **Hero-signature element color.** For `cardCategory: 'signature'` cards, the central glyph uses the **owning hero's** element color — so Berserker signature cards render with frost-blue, Pyromancer with ember-red, Lightbearer with dawn-gold. This makes hero-specific cards instantly identifiable in mixed-deck contexts (future PvP draft modes).


**Name strip:**
- Position: between illustration and effect text, 14px tall
- Background: `linear-gradient(180deg, rgba(0,0,0,0.4), rgba(0,0,0,0.1))`
- Padding: 0 4px
- Flex row: small category icon (10px, left) + name (flex-1)
- Name: Cinzel 8.5px, 700 weight, 0.04em letter-spacing, color `var(--bone-bright)`, `text-overflow: ellipsis`, `white-space: nowrap`
- Category icon: same glyph as illustration but smaller (10px), color matches category
- Border-bottom: `1px solid rgba(212, 165, 72, 0.12)` (subtle separator from effect text below)
- Margin-bottom: 3px

**Effect text region (NEW):**
- Position: bottom region of the card, fills remaining vertical space
- Height: ~38px (~3 lines of text)
- Padding: 3px 4px
- Font: Cormorant Garamond 8.5px, 400 weight, line-height 1.25
- Color: `var(--bone)` (default text), `var(--bone-bright)` if `playable && affordable`
- Word-wrap: break-word
- Overflow: hidden (truncate with ellipsis if text is genuinely too long)
- Text-align: left

**Rendering effect segments:**

The card's `Card.effect` is a `EffectSegment[]` per Part 1.9. Render each segment with appropriate styling:

```jsx
<div className={s.cardEffect}>
  {card.effect.map((segment, i) => {
    if (segment.kind === 'text') return <span key={i}>{segment.content}</span>
    if (segment.kind === 'value') return <span key={i} className={s.value}>{segment.content}</span>
    if (segment.kind === 'keyword') {
      const kw = KEYWORD_REGISTRY[segment.id]
      return <span key={i} className={s.keyword}>{kw.displayLabel}</span>
    }
  })}
</div>
```

CSS for inline segments in the card-thumbnail context:

```css
.cardEffect .value {
  font-weight: 700;
  color: var(--ember-bright);   /* damage values stand out */
}
.cardEffect .keyword {
  font-family: 'Cinzel', serif;
  font-size: 0.92em;
  font-weight: 600;
  color: var(--gold-bright);
  text-shadow: 0 0 2px rgba(240, 198, 104, 0.3);
  /* No underline at this size — too noisy. The color shift is enough. */
}
```

**Compact text rule.** Because hand-card effect text is constrained to ~3 lines at small size, cards with long effects use a **compact prose form** rather than the full prose used in the ExpandedCardView:

- Full prose (ExpandedCardView): `"Deal 4 Unblockable damage and apply Sanctuary."`
- Compact form (HandCard): `"4 ub dmg + Sanctuary"`

The compact form is authored alongside the full form in the card data:

```typescript
type Card = {
  // ... existing fields
  effect: EffectSegment[]          // Full prose for expanded view
  effectCompact: EffectSegment[]   // Short form for hand thumbnail
}
```

If a card's `effectCompact` is undefined, the renderer falls back to `effect` (truncating with ellipsis if it overflows). Authoring compact forms is a one-time content task per card.

**Keyword indicator dot** (top-right corner, retained):
- 8×8px dot in the top-right of the card if any keywords appear in the effect
- Color: `var(--gold-bright)` with `0 0 4px var(--gold-bright)` glow
- Purpose: redundant indicator that complements the inline keyword highlighting — at a glance the dot says "this card has special vocabulary worth checking"
- Position: `top: -2px; right: -2px`

**Playability and affordability states:**

| State | Card border | Cost pip | Illustration | Name + Effect text |
|-------|------------|----------|--------------|--------------------|
| Playable + affordable | gold, 1.5px | gold gradient | normal | normal, bone-bright |
| Playable, unaffordable | bone-deeper, 1px | red-tinted | normal | normal, bone |
| Wrong timing — viewer's turn but modal open | bone-deeper, 1px, dashed | gold gradient | normal, opacity 0.6 | normal, opacity 0.6 |
| Wrong timing — opponent's turn, non-Instant | `1px solid rgba(212, 165, 72, 0.15)` (gold-dim) | normal | `filter: brightness(0.55) saturate(0.7)` | same brightness/saturate filter |
| Focused (most recently tapped) | gold, 1.5px | normal | normal | normal — plus `translateY(-4px)` and enhanced drop shadow |
| Just played (animating out) | fades to transparent over 300ms while translating upward 12px | | | |

The "focused" state replaces the prior "fan rotation" treatment. Since cards no longer fan, the focused card lifts to indicate "this is the one you're considering." Triggered on tap (held until ExpandedCardView opens, dismisses with the modal close) and during scroll-snap settle (the card most centered in the viewport gets a subtle lift).

> **About the two wrong-timing states.** The dashed-bone-deeper treatment is for cards momentarily unplayable due to a viewer-side modal being open (e.g., DefensiveOverlay is up for a non-Instant defense pick). The gold-dim solid treatment is for the durable "opponent's turn, this card is not an Instant" state — distinct so the viewer can read at a glance whether they're blocked by *timing* (opponent's turn — wait it out) or *context* (a modal — close it). The affordability fail uses ember-tinted borders, which keeps three states visually separable: timing-blocked (gold-dim), modal-blocked (dashed bone-deeper), can't-afford (ember-tinted).

**Interaction:**

1. **Tap** dispatches `onTap()`. Parent (MatchScreen) opens the ExpandedCardView modal with this card. The expanded view shows full prose effect, illustration at larger size, and any conditional clauses.
2. **Long-press** (≥400ms hold, <8px movement) dispatches `onLongPress(anchor)`. Parent opens the TooltipRenderer with this card's content. Long-press works **regardless of playability** so the viewer can inspect any card any time.
3. **Tap on a non-playable card during opponent's turn** (non-Instant) plays a brief deny-shake animation (50ms × 2 cycles on the translateX axis, ±2px) and surfaces a toast: `"Cannot play during opponent's turn"` (1500ms duration, low-priority toast slot). No modal opens.
4. **Tap on an Instant card during opponent's turn** opens the ExpandedCardView modal normally; tapping Play dispatches the interrupt flow described in Part 7.3.5.6.
5. **Lift on tap**: when tapped on a playable card, the card briefly lifts (translate y up 6px over 150ms, settles back) before the modal opens. Tactile feedback that the tap registered.
6. **Sell affordance** — accessible from the ExpandedCardView modal, not directly on the HandCard. The expanded view's button row shows a secondary "Sell · +N CP" button alongside the primary "Play" button. Tapping Sell dispatches `{ kind: 'sell-card', cardId }` and triggers the sell cinematic: card slides out of hand toward a CP-glow burst on the player's strip (~700ms), then the CP value increments. The exact CP value gained per sell is engine-controlled (typically 1-2 CP depending on card cost). Sell is enabled only during the viewer's own `main-pre` or `main-post` phases and never during opponent's turn.

**Acceptance criteria:**

1. Card displays cost, illustration, name, and effect text simultaneously and legibly at 76×112px.
2. Effect text uses the compact form when authored; falls back to the full prose with ellipsis truncation otherwise.
3. Inline keyword highlighting renders in gold-bright Cinzel within the effect text.
4. The four blocked states (modal-open, opponent-turn non-Instant, unaffordable, resolution active) are visually distinct without being illegible.
5. Touch target is 76×112px — comfortably exceeds the 44×44 minimum.
6. The keyword indicator dot is present if and only if any segment in the parsed effect text is `kind: 'keyword'`.
7. Long-press works on every card regardless of state — viewers can always inspect.
8. Sell button in ExpandedCardView is enabled only during the viewer's own `main-pre` or `main-post` phases. Tapping Sell removes the card from hand and animates a CP gain on the viewer's strip.

### 2.10 MiddleBand container

This band is special: it hosts **two components that share its space**, the AbilityLadder and the FieldOfPlay overlay.

```typescript
// ui/components/bands/MiddleBand/MiddleBand.tsx

export type MiddleBandProps = {
  children: React.ReactNode    // Typically <AbilityLadder /> and conditionally <FieldOfPlay />
}
```

**Layout:**
- Height: 28% of viewport
- Position: relative (children may be absolutely positioned)
- Background: `radial-gradient(ellipse at 50% 50%, rgba(212, 165, 72, 0.04) 0%, transparent 70%)`
- Top and bottom borders: 1px `linear-gradient(90deg, transparent, var(--gold-dim), transparent)`

The container itself is dumb — it just holds the two states. The actual ladder/FOP behavior is in their respective components (see Parts 4 and 5).

### 2.11 OpponentHandIndicator component

**Visual reference:** Every match scene with an opponent strip shows this indicator inline in the name row (e.g., `design.html#p1-layout`, `design.html#p1-idle`, `design.html#p1-resolution`, and every other opp-strip rendering throughout the document).

A small visual indicator showing how many cards the non-viewer player holds. MVP shows only the count + a stacked-cards glyph, not the cards themselves. Per Part 0.4 Convention 6, the slot exists from day one so multiplayer can later extend it (face-down cards, deck-list peek, etc.).

```typescript
// ui/components/bands/OpponentHandIndicator/OpponentHandIndicator.tsx

export type OpponentHandIndicatorProps = {
  playerId: PlayerId               // The non-viewer player; component reads handCount from gameState.players[playerId].hand.length
}
```

**Position — inline in the OpponentStrip name row:**

The OpponentHandIndicator renders as a sibling of the OpponentStrip's strip-name and DeckIndicator, **inline in the name row at the right edge, immediately left of the DeckIndicator**. This pairs the hand count with the deck count — both are public counters of the opponent's resources, and grouping them gives a clean "hand and deck" pair that reads as a unit.

```jsx
<div className={s.nameRow}>
  <span className={s.name}>{heroName}</span>
  {perspective === 'opponent' && <OpponentHandIndicator playerId={playerId} />}
  <DeckIndicator playerId={playerId} variant={perspective === 'self' ? 'default' : 'opp'} />
</div>
```

```css
.handIndicator.inline {
  display: inline-flex;
  align-items: center;
  align-self: center;
  gap: 2px;
  padding: 1px 4px 1px 3px;
  min-width: 18px;
  height: 16px;
  background: linear-gradient(180deg, rgba(40, 40, 60, 0.55), rgba(20, 20, 40, 0.4));
  border: 1px solid var(--gold-dim);
  border-radius: 2px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  color: var(--bone);
  margin-left: auto;       /* pushes the indicator pair to the right edge of the name row */
}
.handIndicator.inline.opp {
  border-color: rgba(200, 74, 42, 0.4);  /* ember tint matching opp DeckIndicator */
}
/* When hand-indicator precedes deck-indicator, deck loses its own margin-left:auto
   (hand pushes both right via its own margin-left:auto). Just a small gap between them. */
.handIndicator.inline + .deckIndicator.inline {
  margin-left: 4px;
}
```

**Visual structure:**

```
[ ▤▤ 3 ] [ 12 ]   ← hand-indicator (icon + count) + deck-indicator (count only), both ember-tinted
```

- Hand-indicator: stacked-card icon (▤▤) at 8.5px JetBrains Mono with letter-spacing tightening + count digit at 9px JetBrains Mono 700 weight
- Deck-indicator: count digit only, slightly more compact
- Both use the `.opp` modifier (ember-tinted border `rgba(200, 74, 42, 0.4)`) to visually pair with the opp-strip and distinguish from the player's own gold-tinted indicators on the self-strip
- The hand-indicator and deck-indicator together form the "opponent resources pair" — one row, two metrics, consistent ember palette

**Count change animations:**

When the count changes (opponent drew, opponent played):
- **Increment** (drew): count briefly scales up to 1.2× over 200ms, the icon flashes brighter (color `var(--bone-bright)` for 250ms then settles)
- **Decrement** (played): count briefly scales down to 0.9× then back over 200ms

**Tap behavior:**
- MVP: tap opens a small tooltip via TooltipRenderer showing "Opponent's hand: {N} card(s)" — informational only, no card details
- v1.1 (multiplayer): tap may open a hero deck-list modal showing what cards the opponent's hero *could* be holding (their hero's full card pool, since deck composition is public knowledge)

**Acceptance criteria:**

1. Renders inline in every opponent strip's name row, immediately left of the DeckIndicator. **No exceptions** — the slot is permanent across all match scenes, just like DeckIndicator.
2. Renders count from `players[playerId].hand.length` reactively.
3. Animation triggers on count change (compare prev count via React.useRef pattern).
4. Touch target is 44×44 minimum even though the visible indicator is ~28×16px (achieved via padding on the tap zone).
5. If `players[playerId].hand` is undefined (engine hasn't set it yet, edge case during match init), render the indicator with count "0" rather than rendering nothing — slot stability matters for visual consistency.
6. Self-strip never renders this component — the player's hand is visible below.


---

## Part 3 — Ladder & Ability Components

This part specifies the ability ladder: the central decision-making surface of the match. The ladder is composed of four rows (one per tier), each rendering an ability the current player can fire. Eligibility, scaling, and combo information are all encoded in the ladder.

**Visual reference:** `design.html#p3-anatomy` for row anatomy; `design.html#p3-scaling` for T1 scaling; `design.html#p3-eligibility` for eligibility states; `design.html#p3-active-states` for T4 ultimate-eligible, T4 lethal, and CP capped (isolated state samples); `design.html#p3-combo` for combo grammar; `design.html#p3-lethal` for the lethal state in a full match scene.

### 3.1 AbilityLadder component

```typescript
// ui/components/ladder/AbilityLadder/AbilityLadder.tsx

export type AbilityLadderProps = {
  abilities: LadderAbility[]      // Exactly 4 rows: T1, T2, T3, T4 (in that order, bottom-to-top)
  opacity?: number                 // 0–1, defaults to 1; dimmed during resolution
  interactable?: boolean           // Defaults to true. False during opponent's turn — tapping a row opens
                                   // ExpandedAbilityView in read-only mode (Activate button hidden);
                                   // long-press tooltip still works. See Part 7.3.5.2 for the interaction matrix.
  // The active player owns these abilities. When it's the opponent's turn, the AbilityLadder
  // renders the opponent's ability set with live combo states updating as their dice change,
  // letting the viewer see eligible/lethal rows light up — Part 7.3.5.1 for the display rule.
}

export type LadderAbility = {
  id: string                       // Stable AbilityId — matches engine AbilityDef.id
  tier: 1 | 2 | 3 | 4
  name: string                     // "Cleave", "Judgment of the Sun" — engine AbilityDef.name (reflects active or replaced if mastery-transformed)
  shortText: string                // ~30-char summary for the row — engine AbilityDef.shortText
  longText: string                 // Full prose for the modal — engine AbilityDef.longText (plain string; UI parses to segments)
  fullEffect: EffectSegment[]      // UI-parsed segments from longText — see Part 1.9
  value: AbilityValue              // UI heuristic over engine's AbilityEffect tree; reflects mastery modifiers — see note below
  combo: AbilityCombo              // Engine combo definition — 4 canonical kinds + 5 legacy. See Part 3.4
  comboState: ComboState           // Pip-by-pip readiness — UI-derived per Part 3.4
  ladderRowState: LadderRowState   // Engine-computed row state (firing | triggered | reachable | out-of-reach + lethal flag)
  
  scaling?: ScalingPreview         // T1 only; from engine's scaling-damage effect — see Part 3.4
  damageType: DamageType           // 'normal' | 'undefendable' | 'pure' | 'collateral' | 'ultimate' — drives badge color + log
  
  // Critical & lethal — TWO DIFFERENT CONCEPTS (Decision 4)
  criticalCondition?: AbilityCombo // Engine's more-restrictive combo for an enhanced cinematic — see Part 6.7
  criticalEffect?: CriticalEffect  // Engine's enhanced effect when criticalCondition fires
  isLethal?: boolean               // UI-computed: would this commit kill the opponent? (incoming >= opp.hp) — see below
  
  masteryApplied?: MasteryApplied  // Present when a Mastery card has upgraded this slot — see Part 1.9.5
  
  onTap?: () => void               // Tap to open the ExpandedAbilityView modal
}

// Engine-computed row state — direct mirror of engine's LadderRowState
export type LadderRowState = {
  state: 'firing' | 'triggered' | 'reachable' | 'out-of-reach'
  lethal: boolean                  // Engine's lethal flag (separate from UI's isLethal kill-preview)
  probability?: number             // For 'reachable' state: 0-1, likelihood of becoming triggered with optimal reroll
}

// UI-render state mapping (legacy 3-state UI vocabulary maps onto engine's 4-state)
// - 'firing'       → never rendered as a row state; the row is hidden during FOP cinematic
// - 'triggered'    → 'eligible'      (combo met, ready to fire)
// - 'reachable'    → 'near-eligible' (one pip away, or reachable with a reroll)
// - 'out-of-reach' → 'ineligible'    (not achievable this turn)

export type MasteryApplied = {
  kind: 'modifier' | 'transformation'   // UI projection — see Part 3.3 + Part 1.9.5
  summary: string                       // Short summary for tooltip, e.g., "+3 damage" or "Transformed: Whirlwind Cleave"
  sourceCardName: string                // For tooltip and activity-log cross-reference
  // For 'transformation', the parent has already projected the replacement into `name`/`combo`/`value`/`longText`.
  // `masteryApplied` is the *signal* that a transformation has happened, not the data of the transformation
  // itself; that lives in `heroSnapshot.masterySlots[slotId]` — see Part 1.9.5.
}

export type AbilityValue =
  | { kind: 'damage', amount: number }       // e.g., { kind: 'damage', amount: 14 }
  | { kind: 'heal', amount: number }         // e.g., { kind: 'heal', amount: 4 }
  | { kind: 'utility', glyph: UtilityGlyph } // For non-numeric abilities

export type UtilityGlyph = 'strip' | 'draw' | 'lock' | 'cleanse' | 'buff' | 'control'
// UI classification, NOT engine-driven. The engine's AbilityEffect tree contains many shapes;
// the UI heuristically picks a primary glyph for utility abilities:
//   strip:   ⊘   ≈ engine's `remove-status` effect (target: opponent)
//   draw:    ◇   ≈ engine's `draw` effect
//   lock:    ⌂   ≈ engine's `set-die-face` or `force-face-value` effects
//   cleanse: ✦   ≈ engine's `remove-status` effect (target: self, removes debuffs)
//   buff:    ↑   ≈ engine's `apply-status` (self) or `persistent-buff` effects
//   control: ⊙   ≈ engine's `apply-status` (stun, defense-handicap-1, etc.) on opponent
// Authoritative glyph set lives in ui/content/utility-glyphs.ts. Per-ability mapping is authored,
// not inferred — abilities with hybrid effects pick the strongest single read.

// ── Lethal vs. criticalCondition — TWO SEPARATE CONCEPTS (Decision 4) ─────────

// `isLethal` is a UI-side kill-preview: computed at render time as
//   incoming >= opponent.hp
// where `incoming` is the badge's currently-displayed damage value. When true, the
// row pulses crimson and the PhaseBanner reads "Lethal · {abilityName}" (Part 2.6).
// Engine has NO `lethal` field on AbilityDef; this is pure UI logic. The kill preview
// updates whenever incoming damage changes (locking dice that scale T1, applying
// Empower, etc.) so the player sees instantly when a commit would end the match.

// `criticalCondition` is a different mechanic entirely — engine's more-restrictive
// alternative combo on top of the base combo. When the player's dice satisfy
// criticalCondition (a stricter superset of the base), the ability resolves with
// `criticalEffect` instead of its normal effect, and plays an enhanced cinematic.
// Example: T4 Pyric Sentence base combo is "5 ruin" — criticalCondition might be
// "5 ruin AND 1 ember", granting +5 damage and a different cinematic. The bible
// surfaces this in the ExpandedAbilityView modal (Part 6.7) as a secondary readout
// below the main combo.

export type CriticalEffect = {
  // Engine-defined enhanced effect; render in the modal as a secondary line.
  description: string              // "+5 damage; apply Burn 3" (parsed from engine's CriticalEffect shape)
  cinematicVariant?: string        // Optional named cinematic override
}
```

> **About variable damage:** abilities with damage that scales with extra dice (e.g., Dawnblade does 3 base, +1 per extra sword up to 6) use the `value.amount` field to express **the current achievable damage given the locked dice** — *not* the maximum potential. As the player locks more matching dice, `value.amount` updates dynamically and the badge re-renders with a brief scaling pulse (~350ms scale animation, dawn-gold flash at peak). This makes the badge an honest, reactive readout of "what would this ability deal right now if you confirmed it." The maximum is shown only in the ExpandedAbilityView modal (Part 6.7) for reference; the ladder row is about *current capability*.
>
> For T2-T4 abilities with fixed damage, `value.amount` is static — the damage doesn't scale, so the badge never changes.

> **About hybrid effects:** an ability like Sun Strike that deals 5 damage AND applies Sanctuary AND spends Radiance uses `value: { kind: 'damage', amount: 5 }` (damage is the primary read) and lets the effect text or modal communicate the rest. The badge is intentionally simple — one number, one color, one glance.

```typescript

export type ComboState = {
  status: 'eligible' | 'near-eligible' | 'ineligible'   // Derived: 0 outlined = eligible; 1 outlined = near; 2+ outlined = ineligible
  pips: PipState[]                  // Per-pip readiness; length matches combo.length. See Part 3.4 for derivation.
}

export type PipState = 'pulse' | 'gold' | 'outlined'
// 'pulse'    = required face is on a LOCKED die (committed — safe from rerolls)
// 'gold'     = required face is on an UNLOCKED, SETTLED die (present, but could be lost on reroll)
// 'outlined' = required face is not present on any contributing die (still need this)
//
// **Tumbling dice do not contribute.** A die with `isRolling: true` (mid-tumble) is in flux —
// its current face is meaningless and may change at any moment. The derivation treats such
// dice as if they were not present at all, which has two important consequences:
//   1. Before the first roll of the turn: all 5 dice are tumbling → no dice contribute → all pips
//      render as outlined. The ladder shows "this is what each ability needs" without any
//      false eligibility cues from dice that don't exist yet.
//   2. During a reroll: locked dice still contribute (they're settled), but unlocked tumbling
//      dice drop out — so any pip that was `gold` (sigil on an unlocked die) reverts to
//      `outlined` until the dice settle. Only `pulse` pips (sigils on locked dice) remain
//      colored through the tumble.
// See Part 3.4 for the full derivation function and Part 7.3 / Mid-Roll choreography for the
// engine timing.

export type ScalingPreview = {
  baseDamage: number               // Damage at minimum combo
  currentDamage: number            // Damage at current dice commitment
  maxedOut: boolean                // True when at max scaling (all dice committed)
}
```

**Layout:**
- Padding: 8px vertical, 10px horizontal
- Flex column, 5px gap
- Total height: matches MiddleBand (28% of viewport)
- Each row gets `flex: 1` so all four rows share the height equally
- Rows render in order **T4 (top), T3, T2, T1 (bottom)** — the highest tier visually first because that's where the player's eye lands when scanning for "the biggest play I can make."

Wait — review this. The design doc shows T4 at top with T1 at bottom. That's the order I'll use: `abilities` array is iterated from highest tier to lowest. If parent passes them in low-to-high order, the ladder should reverse them or accept a `reverse` prop. **Standardize: parent passes `abilities` in tier-ascending order (T1 first), ladder reverses for display.**

```typescript
const displayOrder = [...abilities].sort((a, b) => b.tier - a.tier)
```

**Opacity prop:**
- During planning phase: opacity = 1
- During resolution / when overlay is active over the field of play: opacity = 0.10 (heavily dimmed by parent via prop — the field-of-play action takes full visual attention)
- During dice tumble: opacity = ~0.4 (eligibility uncertain, dim slightly but keep readable)
- During defensive picker overlay: opacity = 0.05 (essentially invisible behind the modal)

Transition: `opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)` for smooth state changes.

**Acceptance criteria:**
1. Renders exactly 4 ability rows in tier-descending visual order.
2. Reacts to opacity prop with smooth animation.
3. If `abilities.length !== 4`, log a warning and render only the provided rows. This shouldn't happen in production but should not crash.

### 3.2 AbilityRow component

**Visual reference:** `design.html#p3-anatomy` shows the five-element anatomy.

```typescript
// ui/components/ladder/AbilityRow/AbilityRow.tsx

export type AbilityRowProps = {
  ability: LadderAbility           // Same type as above
  onTap?: () => void
}
```

**Visual specifications:**

Base row:
- Background: `linear-gradient(90deg, rgba(20, 20, 42, 0.85), rgba(26, 24, 48, 0.65))`
- Border: `1px solid rgba(212, 165, 72, 0.22)` (faint gold)
- Border-radius: 6px
- Padding: 6px vertical, 9px horizontal
- Flex row, 9px gap, center-aligned children

**State variations** (applied via class names; derived from `ability.ladderRowState`):

The engine emits a 4-state `ladderRowState.state` (`firing` | `triggered` | `reachable` | `out-of-reach`) plus a `lethal: boolean` flag. The UI maps these to a 3-state CSS treatment:

| Engine state | UI state | Border | Background | Left marker | Shadow |
|--------------|----------|--------|-----------|-------------|--------|
| `firing` | — (row hidden) | (row not rendered during FOP cinematic) |
| `triggered` (tier 1-3) | `eligible` | `1px solid var(--gold)` | `linear-gradient(90deg, rgba(60, 44, 12, 0.5), rgba(40, 30, 10, 0.35))` | 3px wide, 70% height, var(--gold), with `0 0 6px var(--gold-bright)` glow | `0 0 0 1px var(--gold), 0 0 16px rgba(212, 165, 72, 0.35)` |
| `triggered` (tier 4) | `ultimate eligible` | `1px solid var(--dawn)` | default | 3px var(--dawn) with dawn glow | `0 0 0 1px var(--dawn), 0 0 18px rgba(251, 191, 36, 0.45)` |
| `reachable` | `near-eligible` | `1px solid var(--gold-dim)` | `linear-gradient(90deg, rgba(40, 32, 10, 0.45), rgba(26, 24, 48, 0.65))` | 2px wide, 50% height, var(--gold-dim), opacity 0.7 | none |
| `out-of-reach` | `default` (ineligible) | `1px solid rgba(212, 165, 72, 0.22)` | default | none | none |
| any state with `isLethal: true` (UI-computed kill preview, Decision 4) | `lethal` (overrides) | `1px solid var(--crimson-bright)` | `linear-gradient(90deg, rgba(138, 24, 40, 0.55), rgba(60, 16, 16, 0.4))` | 3px var(--crimson-bright) with crimson glow | `0 0 0 1px var(--crimson-bright), 0 0 22px rgba(196, 56, 72, 0.55)`; animates via `lethal-pulse` keyframe |

> **`isLethal` is a UI computation, not an engine field.** Per Decision 4, lethal is computed at render time as `incoming >= opponent.hp` against whatever the badge currently displays. It can apply to ANY tier (most often T4, but a buffed T1 with Empower + Frost-bite stacks can also become lethal). When `isLethal` is true, the crimson treatment overrides whatever the eligibility border would otherwise be. The `lethal` flag from engine's `LadderRowState.lethal` is a separate concept (currently informational only for the UI) — the kill-preview is always UI-computed.

> **`reachable.probability` (engine-supplied).** Engine emits a 0-1 probability for reachable rows ("with optimal reroll, you'd reach this combo with ~62% chance"). The UI does not surface this prominently in MVP — the `near-eligible` treatment is a single visual state regardless of probability. A future v1.1 enhancement could show probability as a thin progress arc inside the marker, but bible doesn't spec that for MVP to keep the row visually simple.

> **About ineligible T4 rows.** A T4 ultimate looks identical to a T1/T2/T3 row when ineligible. Row position carries the "this is T4" information (T4 always renders at the top of the ladder). The visual distinction only kicks in when the row is actively rollable (dawn halo) or when lethal conditions are met (crimson pulse). The earlier design tinted ineligible T4 ember-red unconditionally — that was misleading (red suggests danger/active rather than "tier 4") and contradicted the principle established when the tier badge was removed: row position is the tier indicator.

The left marker is a `::after` pseudo-element:
```css
.ability.eligible::after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 70%;
  background: var(--gold);
  box-shadow: 0 0 6px var(--gold-bright);
  border-radius: 0 2px 2px 0;
}
```

**Children layout:**
```jsx
<div className={s.ability} data-state={state} onClick={onTap}>
  <AbilityValueBadge value={effectiveValue} variant={state} />
  <div className={s.info}>
    <div className={s.name}>{ability.name}</div>
    <div className={s.text}>{ability.effectText}</div>
  </div>
  <ComboGlyphStrip combo={ability.combo} state={ability.comboState} size="prominent" />
</div>
```

Where `effectiveValue` derives the displayed value, accounting for T1 scaling:

```typescript
// In the AbilityRow component, before rendering:
const effectiveValue: AbilityValue = useMemo(() => {
  // For T1 abilities with scaling preview, use the current scaling damage
  if (ability.scaling && ability.value.kind === 'damage') {
    return { kind: 'damage', amount: ability.scaling.currentDamage }
  }
  // For all other abilities, the value is static — use as-is
  return ability.value
}, [ability.value, ability.scaling?.currentDamage])
```

When `effectiveValue.amount` changes between renders (e.g., player locked another matching die and the engine recomputed `scaling.currentDamage`), the badge plays a brief scaling pulse animation (~350ms). Implementation: the AbilityValueBadge component tracks the previous value via `useRef` and applies a `scaling-pulse` className for one animation cycle when the value changes upward.

> **Tier information:** the visible tier badge has been replaced by the value badge per design decision. **Vertical position carries tier**: T4 always renders at the top of the ladder, T1 always at the bottom. Engineers reading the code should not be confused — the `tier` field on `LadderAbility` is still used internally (for sorting, eligibility logic, and modal rendering), it just isn't visually surfaced as a label on the row itself.

**Typography by state:**
- Default name: Cinzel 11px, 700, 0.08em letter-spacing, color `var(--bone)`
- Eligible name: same as above but color `var(--gold-bright)`, with `text-shadow: 0 0 4px rgba(240, 198, 104, 0.4)`
- Ultimate name: color `var(--dawn-bright)`
- Lethal ultimate name: color `var(--crimson-bright)`, with `text-shadow: 0 0 6px rgba(196, 56, 72, 0.6)`
- Default text: Cormorant 10.5px italic, color `var(--bone-dim)`
- Eligible text: same but color `var(--bone)` (brighter, more readable)

**Name and effect text must stay on one line each.** Both `.name` and `.text` use `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` to ensure long names like "Judgment of the Sun" don't wrap into a second line that would push the effect text out of the row's vertical space. If a name truly cannot fit (rare at the current sizing), the truncation is the acceptable fallback — the full name renders in the ExpandedAbilityView modal where there's no width constraint.

```css
.ability .name,
.ability .text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

> **About the effect text:** keep it short and scannable (~30 characters max). Examples: `"ub damage + Verdict"`, `"strip Verdict, then strike"`, `"spend Radiance, apply Stun"`. Avoid restating the damage value (the badge owns that), and avoid spelling out keywords if abbreviations exist ("ub" rather than "undefendable"). The modal renders the full prose.

**Lethal state additional treatment:**

When `ability.isLethal` is true (only valid on T4 rows), the effect text is **replaced** with the lethal condition statement, rendered differently:

```jsx
{ability.isLethal ? (
  <div className={s.lethalCondition}>
    LETHAL · {lethalThreshold} HP ≤ {lethalCutoff}
  </div>
) : (
  <div className={s.text}>{ability.effectText}</div>
)}
```

Lethal condition styling:
- Color: `var(--crimson-bright)`
- Font: Cinzel 10px (instead of Cormorant italic)
- Letter-spacing: 0.08em
- Text-transform: uppercase
- Font-style: normal (overrides the default italic)
- Font-weight: 600

**Acceptance criteria:**
1. The row's `data-state` attribute reflects the current eligibility for CSS targeting and testing.
2. When `state` transitions (e.g., ineligible → eligible on a dice roll), the visual transition uses a 250ms cross-fade of border-color, background, and box-shadow.
3. Lethal pulse animation (`@keyframes lethal-pulse`) runs continuously while `isLethal` is true. When `isLethal` becomes false, animation stops on the next iteration (use `animation-iteration-count` reset).
4. **On tap, the row dispatches `onTap()` regardless of eligibility.** The parent (MatchScreen) opens the ExpandedAbilityView modal (Part 6.7) for inspection. The modal's Activate button is disabled if the ability is ineligible. This means ineligible abilities are still tappable for inspection — the player can read what each tier needs without committing.
5. Touch target: minimum 44px tall. Since each row gets ~55-60px of MiddleBand height (28%) divided by 4, this is comfortable. Padding ensures the total tap zone ≥44px.

### 3.3 AbilityValueBadge component

**Visual reference:** Replaces the prior TierBadge at the left of every offensive ability row. Shows the ability's primary effect: a damage number, a heal value, or a utility glyph.

```typescript
// ui/components/ladder/AbilityValueBadge/AbilityValueBadge.tsx

export type AbilityValueBadgeProps = {
  value: AbilityValue              // See Part 3.1 — discriminated union of damage/heal/utility
  variant?: 'default' | 'eligible' | 'ultimate-eligible' | 'lethal'
  // 'default' = ineligible (any tier including T4); 'eligible' = rollable now (T1-T3);
  // 'ultimate-eligible' = T4 rollable (dawn glow); 'lethal' = T4 lethal (crimson pulse).
  // There is intentionally no 'ultimate' (ineligible) variant — T4 ineligible badges
  // use 'default' so they look identical to T1/T2/T3 ineligible badges. Row position
  // carries the tier information, not always-on color tinting.
  size?: 'default' | 'large'       // 'default' for ladder rows; 'large' for modal
}
```

**Three rendering variants based on `value.kind`:**

| `value.kind` | Visual | Color | Example |
|--------------|--------|-------|---------|
| `'damage'` | Bold number, no prefix | ember (`var(--ember-bright)`) | `5`, `14`, `7` |
| `'heal'` | Plus-prefixed number (`+N`) | green (`var(--green-bright)`) | `+4`, `+6` |
| `'utility'` | Category glyph at large size | gold (`var(--gold-bright)`) | `⊘`, `◇`, `⌂` |

The badge color signals the ability's nature before the player reads anything else: red = "I'm dealing damage," green = "I'm healing," gold = "I'm doing something else."

**Size specifications:**

| Size | Width × Height | Number font | Glyph font |
|------|----------------|-------------|------------|
| default (ladder row) | 24×24 | Cinzel 12px, 800 weight | 14px |
| large (modal) | 56×56 | Cinzel 28px, 800 weight | 32px |

**Visual structure (all variants):**

```css
.abilityValueBadge {
  width: 24px;
  height: 24px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: radial-gradient(circle at 30% 30%, rgba(0,0,0,0.35), rgba(0,0,0,0.65));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
```

**Variant tinting (border + glow):**

| State | Border | Box-shadow | Notes |
|-------|--------|-----------|-------|
| `default` / `ineligible` | `1px solid rgba(120, 90, 50, 0.5)` (muted gold) | none | Most rows during planning before any dice roll. Used by all tiers — T1, T2, T3, AND T4 — when ineligible. |
| `eligible` | `1px solid var(--gold)` | `0 0 6px rgba(212, 165, 72, 0.45)` | Visual feedback that this ability is rollable now |
| `ultimate eligible` (T4 ready) | `1px solid var(--dawn)` | `0 0 8px rgba(251, 191, 36, 0.5)` | T4 rollable — dawn glow stands out from regular gold |
| `lethal` (T4 lethal) | `1px solid var(--crimson-bright)` | `0 0 12px rgba(196, 56, 72, 0.6)` | Pulses with `lethal-pulse` keyframe |

> Note: there is no `ultimate` (ineligible) variant. T4 rows when ineligible render the badge with the `default` variant — identical to T1/T2/T3. The `ultimate-eligible` and `lethal` variants are the only T4-specific badge states, and both require an active condition (combo met, or lethal condition met). This avoids the misleading "always-on red border" that the earlier design used.

**Mastery-applied treatment (composable with the variants above).** When the parent `LadderAbility` has `masteryApplied` set (see Part 3.1 + Part 1.9.5), the row renders two additional visual signals:

1. A **mastery indicator** — small ✦ glyph in dawn-bright (`var(--dawn-bright)`), 12×12px, positioned to the immediate right of the AbilityValueBadge, with a slow 1.6s opacity pulse (`mastery-pulse` keyframe). The glyph signals "this slot has been upgraded by a Mastery card." Tooltip on hover/long-press: `"Mastered: {summary}"` from `masteryApplied.summary`.
2. **Dawn-bright inner glow** on the value badge itself — adds `box-shadow: inset 0 0 6px rgba(253, 224, 136, 0.4)` to whatever variant glow is already present. For `kind: 'transformation'`, the ability **name** also recolors to `var(--dawn-bright)` (instead of the default `var(--bone-bright)`) so the player reads at a glance "this row is no longer the base ability."

These signals are *additive* with the eligibility variants. A `kind: 'modifier'` Mastery on an eligible T1 row reads as: gold eligible border + dawn-bright inner glow + ✦ glyph next to the badge + normal bone-bright name. A `kind: 'transformation'` Mastery on the same row reads: same border + same inner glow + ✦ glyph + name in dawn-bright.

```css
.abilityValueBadge.mastery-modifier {
  box-shadow: inset 0 0 6px rgba(253, 224, 136, 0.4), /* additive with variant glow */
              0 0 6px rgba(212, 165, 72, 0.45);       /* example: eligible variant glow preserved */
}
.abilityValueBadge.mastery-transformation {
  box-shadow: inset 0 0 8px rgba(253, 224, 136, 0.55),
              0 0 6px rgba(212, 165, 72, 0.45);
}
.masteryIndicator {
  display: inline-block;
  width: 12px; height: 12px;
  margin-left: 4px;
  font-size: 12px;
  line-height: 1;
  color: var(--dawn-bright);
  text-shadow: 0 0 4px rgba(253, 224, 136, 0.6);
  animation: mastery-pulse 1.6s ease-in-out infinite;
  flex-shrink: 0;
}
@keyframes mastery-pulse {
  0%, 100% { opacity: 0.65; transform: scale(1); }
  50%      { opacity: 1.0;  transform: scale(1.08); }
}
.abilityName.mastery-transformation {
  color: var(--dawn-bright);
  text-shadow: 0 0 4px rgba(253, 224, 136, 0.35);
}
```

**Number rendering (damage and heal kinds):**

```css
.abilityValueBadge .value {
  font-family: 'Cinzel', serif;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.02em;
  transition: color 250ms ease;  /* For scaling pulse on value change */
}
.abilityValueBadge.damage .value { color: var(--ember-bright); }
.abilityValueBadge.heal .value { color: var(--green-bright); }
.abilityValueBadge.heal .value::before {
  content: '+';
  margin-right: 0;  /* tight spacing; the + is part of the value */
}
/* Scaling pulse — applied briefly when the value updates (T1 dice-locked) */
.abilityValueBadge.scaling-pulse .value {
  animation: scaling-pulse 350ms ease-out;
}
@keyframes scaling-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.25); color: var(--dawn-bright); }
  100% { transform: scale(1); }
}
```

**Utility glyph rendering:**

```jsx
<div className={s.abilityValueBadge} data-kind="utility" data-variant={variant}>
  <span className={s.glyph}>{UTILITY_GLYPH[value.glyph]}</span>
</div>
```

```typescript
const UTILITY_GLYPH: Record<UtilityGlyph, string> = {
  strip: '⊘',
  draw: '◇',
  lock: '⌂',
  cleanse: '✦',
  buff: '↑',
  control: '⊙',
}
```

**Acceptance criteria:**
1. Damage variants render in ember color with no prefix.
2. Heal variants render in green color with a `+` prefix glued tightly to the number.
3. Utility variants render with the matched glyph in gold.
4. Variant tinting (border + glow) reacts to the same eligibility state as the row.
5. Lethal pulse animation runs when `variant === 'lethal'`, syncs with the row's lethal pulse for visual coherence.
6. `large` size used in the modal (Part 6.7) scales all elements proportionally; no separate component.

### 3.3.1 TierBadge component (HeroDetailScreen reference only)

**Note:** The TierBadge component is retained **only for the hero detail screen** (Part 8.6, where abilities are listed reference-style without dice context). The offensive ladder no longer uses TierBadge (see 3.3 AbilityValueBadge), and the **defensive picker no longer renders D1/D2 badges either** — they were redundant with the two-row layout (the row position uniquely identifies the slot, and the defense name plus combo/dice info uniquely identifies the option). The `tier: 'D1' | 'D2'` field is retained in the `DefensiveOption` data model as a *slot identifier* (loadout, save/load, activity log), but no visual badge renders from it during the picker.

```typescript
// ui/components/ladder/TierBadge/TierBadge.tsx

export type TierBadgeProps = {
  tier: 1 | 2 | 3 | 4 | 'D1' | 'D2'   // HeroDetailScreen reference contexts only — see Part 8.6
  variant?: 'default' | 'lethal'
}
```

**Visual specifications:**

| Variant | Background | Border | Color |
|---------|-----------|--------|-------|
| default (T1-T4, offensive reference) | `radial-gradient(circle at 30% 30%, rgba(0,0,0,0.4), rgba(0,0,0,0.7))` | `1px solid var(--gold)` | `var(--gold-bright)` |
| default (D1/D2, defensive reference) | same | `1px solid var(--frost)` | `var(--frost-bright)` |
| lethal (T4 only, reference contexts) | `radial-gradient(circle at 30% 30%, rgba(138, 24, 40, 0.4), rgba(60, 16, 16, 0.7))` | `1px solid var(--crimson-bright)` | `var(--crimson-bright)` |

All variants:
- Size: 22×22px
- Border-radius: 4px
- Font: Cinzel 9.5px, 800 weight, 0.05em letter-spacing
- Box-shadow: `inset 0 1px 0 rgba(212, 165, 72, 0.3)` (subtle inner top highlight)
- Flex shrink: 0 (never compresses)
- Text content: literal tier label ("T1", "T2", "T3", "T4", "D1", "D2")

**Acceptance criteria:**
1. TierBadge renders only in HeroDetailScreen (Part 8.6) — never in the active offensive ladder or the defensive picker.
2. Defensive reference badges (D1/D2) use frost border; offensive reference badges (T1-T4) use gold border.
3. Lethal variant is only meaningful for T4 in reference contexts where the lethal state is being illustrated statically.

### 3.4 ComboGlyphStrip component

**Visual reference:** `design.html#p3-combo` shows the three pip states (outlined, gold, pulsing) for both sigil-type and straight-type combos.

```typescript
// ui/components/ladder/ComboGlyphStrip/ComboGlyphStrip.tsx

export type ComboGlyphStripProps = {
  combo: AbilityCombo              // Engine combo definition (4 canonical kinds — see below)
  state: ComboState                // Per-pip state: which slots are locked, unlocked-present, absent
  size?: 'default' | 'prominent' | 'reference'
  // 'default'    = 14px pips, used in defensive picker rows and reference contexts
  // 'prominent'  = 18px pips, used in offensive ladder rows (the player's primary planning surface)
  // 'reference'  = 18px pips, used in documentation / hero detail screens
  variant?: 'offensive' | 'defensive'  // Defensive variants are always static (no animations)
}

// ── Engine combo kinds ────────────────────────────────────────────────────────
// Engine ships 4 canonical combo shapes (plus 5 legacy kinds the bible doesn't render):
export type AbilityCombo =
  | { kind: 'symbol-count', symbol: SymbolId, count: number }
                                   // e.g., { kind: 'symbol-count', symbol: 'berserker:axe', count: 3 }
                                   //   = "any 3 axe faces"
                                   // Most common combo type. Each pip in the strip shows the symbol's glyph.
  | { kind: 'n-of-a-kind', n: number }
                                   // e.g., { kind: 'n-of-a-kind', n: 3 }
                                   //   = "any 3 dice showing the same number"
                                   // Used by Iron Tide, Slagspatter, Vigil, etc.
                                   // The strip shows N pips with a single "matching" indicator (no specific symbol),
                                   // and a small "match #" label appears next to the strip indicating the matched
                                   // face value (or "—" if no match yet). See visual treatment below.
  | { kind: 'straight', length: number }
                                   // e.g., { kind: 'straight', length: 4 }
                                   //   = "any 4 consecutive numbers"
                                   // The strip shows N pips with their face values (e.g., 2-3-4-5 for the current
                                   // best window). The window slides as locked dice change.
  | { kind: 'compound', op: 'and' | 'or', terms: AbilityCombo[] }
                                   // e.g., { kind: 'compound', op: 'and', terms: [
                                   //   { kind: 'symbol-count', symbol: 'pyromancer:ash', count: 2 },
                                   //   { kind: 'symbol-count', symbol: 'pyromancer:ember', count: 1 },
                                   //   { kind: 'symbol-count', symbol: 'pyromancer:magma', count: 1 }
                                   // ] } = "2 ash AND 1 ember AND 1 magma" (Firestorm-style)
                                   // Used by Firestorm, Glacier Strike, Sun Strike, and many compound combos.
                                   // The strip renders each term's pips in sequence with an operator separator
                                   // ('+' for 'and', '/' for 'or') — see visual treatment below.

// Legacy combo kinds (matching | matching-any | at-least | any-of | specific-set) are NOT rendered
// by the v1 ComboGlyphStrip. Content authored against legacy combos must be migrated to canonical
// kinds before MVP ship.

export type ComboState = {
  pips: PipState[]                 // Flattened pip readout; for compound combos, all terms' pips concatenated in render order
}

export type PipState = 'pulse' | 'gold' | 'outlined'
// 'pulse'    = the required face/number is on a die the player has LOCKED (committed, safe from rerolls)
// 'gold'     = the required face/number is on a die that's currently UNLOCKED and SETTLED (present, but a reroll could lose it)
// 'outlined' = the required face/number is not present on any contributing die (still need this)
//
// **Tumbling dice (UI-side `isRolling: true`) do not contribute to derivation.** Their face is in flux
// and any current value is provisional. This makes the lifecycle straightforward:
//   - **Pre-first-roll**: all 5 dice are tumbling, so no dice contribute → all pips render as outlined.
//   - **During a reroll**: locked dice still contribute (settled), but unlocked dice are tumbling and
//     drop out — so gold pips revert to outlined, leaving only the pulse pips from locked dice.
//   - **After settle**: locked → pulse, unlocked-settled → gold, missing → outlined.
//
// Note: `isRolling` is a UI-only flag (lives on uiStore, not in engine state). Engine's Die does not
// carry a tumbling state — tumbling is purely a UI animation concern.
```

**Four canonical combo types, four visual treatments:**

| `combo.kind` | What each pip shows | Match logic |
|--------------|---------------------|-------------|
| `'symbol-count'` | The symbol's glyph (e.g., axe ⚒, sun ☼, magma ◆) | Dice with that symbol on their current face |
| `'n-of-a-kind'` | A neutral "match" indicator (◯ or similar); plus a separate "match #" badge showing the matched value | Any N dice showing the same face value |
| `'straight'` | A number 1-6 corresponding to the current best window | Dice showing that exact number value |
| `'compound'` | Each term's pips concatenated in order, with an operator separator between terms (`+` for `and`, `/` for `or`) | Term-by-term independently; `and` requires all, `or` requires any one |

The pulse/gold/outlined classification applies identically across all four kinds.

**Visual treatment per combo kind:**

- **`symbol-count`**: straightforward — N pips, each showing the symbol's glyph. Standard treatment from earlier bible drafts. *Example: "3 axes" → `[⚒][⚒][⚒]`.*

- **`n-of-a-kind`**: N pips in a row, each rendering a small `◯` placeholder (subtle, not a glyph). To the right of the strip, a "match" badge displays the current matched face value (or "—" if no match yet). The badge's color follows pip state: bone-bright if the match is achieved on locked dice, gold-dim if on settled-unlocked, hidden if no match yet. *Example: "3 of a kind" with three locked 4s → `[◯][◯][◯] {4}`.*

- **`straight`**: N pips, each showing a face number (1-6). The engine computes the best-achievable consecutive window and the UI renders the corresponding numbers. As locked dice change, the window may slide (e.g., from `[2][3][4]` to `[3][4][5]`). *Example: "straight 4" with locked 2-3 → `[2][3][4][5]` with pip 1-2 pulsing, pip 3-4 outlined.*

- **`compound`**: each term's pips rendered in sequence, separated by a small operator glyph (`+` for `and`, `/` for `or`). The operator glyph is `font-size: 11px`, `color: var(--gold-dim)`, with `margin: 0 3px` horizontal spacing. *Example: "2 ash AND 1 ember AND 1 magma" → `[◌][◌] + [△] + [◆]`.* Nested compound is supported (a compound term inside a compound) but rare in v1 content; renders with parentheses around the inner group.

> **Pip derivation gets more complex per kind.** For `symbol-count`, the derivation is the same straightforward count-matching from earlier drafts (still works). For `n-of-a-kind`, the algorithm must scan settled dice for the best matching face value across all values 1-6, picking the value with the most matches. For `straight`, the algorithm finds the best consecutive window. For `compound`, each term derives independently and the parent assembles the strip. Engineers can compute pips client-side, OR subscribe to engine's `ladderState[i].comboReadiness` if engine exposes it (engine docs reference `firing-faces` resolution which UI can re-derive against the combo definition).

**Pip state derivation — UI-side responsibility:**

For `symbol-count` and `straight` combos, UI can derive pip states client-side from the dice tray + the combo definition. For `n-of-a-kind` and `compound` combos, derivation is more involved (n-of-a-kind requires picking the best matching face value; compound requires recursive term derivation), and **UI should prefer to subscribe to engine's `heroSnapshot.ladderState[i]` for pip readiness on these kinds** — engine already computes which faces satisfy each ability and the UI can re-derive against the combo definition for display.

```typescript
// Compute pip states from the current dice tray + the ability's combo definition.
// Returns flattened pips for the strip plus optional metadata (matched number for
// n-of-a-kind, window numbers for straight, term offsets for compound).

function derivePipStates(
  combo: AbilityCombo,
  dice: Die[]
): { pips: PipState[], meta?: PipDerivationMeta } {
  // CRITICAL: filter out tumbling dice — they don't contribute until they settle.
  // This single rule handles both pre-first-roll (all 5 tumbling → all outlined) and
  // mid-reroll (locked still contribute, unlocked tumbling drop out → gold reverts to outlined).
  // Note: `isRolling` is a UI-only flag (lives on uiStore), not on engine's Die.
  const settledDice = dice.filter(d => !uiStore.isDieRolling(d.index))
  
  switch (combo.kind) {
    case 'symbol-count':
      return { pips: deriveSymbolCountPips(combo, settledDice) }
    case 'straight':
      return deriveStraightPips(combo.length, settledDice)
    case 'n-of-a-kind':
      return deriveNOfAKindPips(combo.n, settledDice)
    case 'compound':
      return deriveCompoundPips(combo, settledDice)
  }
}

type PipDerivationMeta =
  | { kind: 'straight', numbers: number[] }          // The current best-display window's face numbers
  | { kind: 'n-of-a-kind', matchValue: number | null }   // The matched face value, or null if no match yet
  | { kind: 'compound', termOffsets: number[] }      // Index ranges per term in flattened pips array

function deriveSymbolCountPips(combo: Extract<AbilityCombo, { kind: 'symbol-count' }>, settledDice: Die[]): PipState[] {
  const keyOf = (d: Die) => d.faces[d.current].symbol
  const lockedPool = countOccurrences(settledDice.filter(d => d.locked).map(keyOf))
  const unlockedPool = countOccurrences(settledDice.filter(d => !d.locked).map(keyOf))
  
  return Array.from({ length: combo.count }, () => {
    if (lockedPool[combo.symbol] > 0) { lockedPool[combo.symbol]--; return 'pulse' }
    if (unlockedPool[combo.symbol] > 0) { unlockedPool[combo.symbol]--; return 'gold' }
    return 'outlined'
  })
}

function deriveStraightPips(N: number, settledDice: Die[]): { pips: PipState[], meta: PipDerivationMeta } {
  // For each candidate starting value s, compute the pip states for window [s, s+1, ..., s+N-1].
  // Score = (pulse_count, -outlined_count, -s) — prefer most-committed, then closest, then lowest start.
  // Pick the highest-scoring window; that's what the pip strip displays.
  
  let best = { score: [-1, 0, 0] as [number, number, number], numbers: [] as number[], pips: [] as PipState[] }
  
  for (let s = 1; s <= 7 - N; s++) {
    const window = Array.from({ length: N }, (_, i) => s + i)
    const lockedPool = countOccurrences(settledDice.filter(d => d.locked).map(d => d.faces[d.current].faceValue))
    const unlockedPool = countOccurrences(settledDice.filter(d => !d.locked).map(d => d.faces[d.current].faceValue))
    const pips: PipState[] = []
    for (const num of window) {
      if (lockedPool[num] > 0) { lockedPool[num]--; pips.push('pulse') }
      else if (unlockedPool[num] > 0) { unlockedPool[num]--; pips.push('gold') }
      else pips.push('outlined')
    }
    const pulseCount = pips.filter(p => p === 'pulse').length
    const outlinedCount = pips.filter(p => p === 'outlined').length
    const score: [number, number, number] = [pulseCount, -outlinedCount, -s]
    if (compareLex(score, best.score) > 0) {
      best = { score, numbers: window, pips }
    }
  }
  return { pips: best.pips, meta: { kind: 'straight', numbers: best.numbers } }
}

// deriveNOfAKindPips and deriveCompoundPips: implementations follow the visual
// treatments in the table above. n-of-a-kind picks the face value with the most
// matches (ties → lowest value); compound recurses through each term and
// concatenates pip arrays with separator offsets in meta.

// Lexicographic tuple comparison: returns +1 if a > b, -1 if a < b, 0 if equal.
function compareLex(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1
  }
  return 0
}
```

Row eligibility derives from pip counts identically across combo types:
- 0 outlined pips → row is **eligible** (combo fully met by current dice)
- 1 outlined pip → row is **near-eligible** (one die away from eligibility)
- 2+ outlined pips → row is **ineligible** (combo too far to chase this roll)

**Straight combo definitions — abilities specify only a length:**

| Combo name | Pip count | What satisfies the combo |
|-----------|-----------|--------------------------|
| Small straight 3 | 3 | Any 3 consecutive numbers: 1-2-3, 2-3-4, 3-4-5, OR 4-5-6 |
| Straight 4 | 4 | Any 4 consecutive numbers: 1-2-3-4, 2-3-4-5, OR 3-4-5-6 |
| Straight 5 | 5 | Any 5 consecutive numbers: 1-2-3-4-5 OR 2-3-4-5-6 |

> **The pip strip displays the closest achievable straight, not a fixed canonical sequence.** A player rolling 4-5-6 must see those numbers light up, not see a hardcoded "2-3-4" and mentally translate "well, 4-5-6 is also a small straight 3, so this still fires."
>
> The spec instead **dynamically computes the best window per render**. The engine searches all valid starting values (1, 2, 3, 4 for small straight 3) and picks the window with the most pulse pips (most committed), breaking ties by fewest outlined (closest to eligibility), then by lowest start value (deterministic). The displayed numbers update as dice change, but the update follows a stable rule the player can learn: *"the strip always shows the run you're closest to landing."*

**Tiebreaking and stability rules:**

- All straights of a given length are mechanically equivalent. Higher-numbered straights don't deal more damage; longer-running straights don't grant bonuses. The engine's window choice is purely a *display* decision, not a mechanical one.
- **Stability matters.** Between two consecutive renders (e.g., after a reroll), the displayed window should change only if the new score strictly improves. If multiple windows tie on (pulse, outlined), the lowest-start window wins — deterministic, no flicker.
- **No straight available at all:** if every candidate window has 0 pulse and N outlined (the player has zero dice in any qualifying value range), the engine still displays one window — pick the lowest-start (1, 2, ..., N) — with all outlined pips. The row reads as ineligible with explicit "you need any consecutive run starting from 1" guidance.
- **Future ability variants** that DO care about which straight fired (e.g., "+damage equal to highest die in the straight") would override the engine's display preference. Those abilities are out of scope for this spec; if they appear later, add a `comboPreference: 'best-display' | 'highest-values' | 'longest-run'` field to the ability definition.

**Example walk-through** (small straight 3, dice locked 1-2-4-4 + unlocked 6):

| Window | Pips | Score (pulse, -outlined, -start) |
|--------|------|----------------------------------|
| 1-2-3 | pulse(1), pulse(2), outlined(3) | (2, -1, -1) |
| 2-3-4 | pulse(2), outlined(3), pulse(4) | (2, -1, -2) |
| 3-4-5 | outlined(3), pulse(4), outlined(5) | (1, -2, -3) |
| 4-5-6 | pulse(4), outlined(5), gold(6) | (1, -1, -4) |

Best score is `(2, -1, -1)` → window 1-2-3 wins (most pulse, fewest outlined, lowest start). The strip displays `[pulse 1] [pulse 2] [outlined 3]` — row is **near-eligible**, and the player can read "I'm one 3 away from firing." Window 2-3-4 ties on pulse and outlined but loses on lowest-start tiebreak.

**Strip layout:**
- Flex row, center-aligned
- Gap: 3px (default), 4px (prominent), 5px (reference)
- Flex-shrink: 0 (never compresses)
- The strip is sized to be the **second-most-prominent element on the row** after the AbilityValueBadge — this is the primary planning information ("what dice do I need?"), and it earns the visual weight.

**Pip visual specifications:**

Base pip:
- Size: 14×14px (default), **18×18px (prominent and reference)**
- Border-radius: 2px (default), 3px (prominent/reference)
- Background: `rgba(20, 24, 40, 0.6)` (outlined state)
- Border: `1px solid var(--bone-deeper)` (default state) — bumped to `1.5px` for prominent size
- Flex center
- For sigil pips: font-family 'Cinzel', 'Times New Roman', serif (consistent Unicode rendering until SVG icons replace)
- For number pips: font-family 'JetBrains Mono', monospace (numeric clarity at small size)
- `font-variant-emoji: text` (forces text rendering over emoji on sigil pips)

Face glyph / number inside pip:
- Sigil pip: 9px (default) / 12px (prominent and reference)
- Number pip: 10px (default) / 13px (prominent and reference) — slightly larger since numbers are simpler shapes
- Line-height: 1
- Color: `var(--bone-deeper)` (outlined state)
- Font-weight: 700
- No text-shadow in outlined state

**State variations** (applied to the pip via class, identical for sigil and number variants):

| State | Background | Border | Inner color | Box-shadow | Animation |
|-------|-----------|--------|-----------|------------|-----------|
| outlined (default) | `rgba(20, 24, 40, 0.6)` | `1.5px solid var(--bone-deeper)` | `var(--bone-deeper)` | none | none |
| `gold` (unlocked die matches) | `linear-gradient(135deg, rgba(60, 44, 12, 0.7), rgba(40, 30, 10, 0.5))` | `1.5px solid var(--gold)` | `var(--gold-bright)` with `text-shadow: 0 0 4px rgba(240, 198, 104, 0.7)` | `0 0 5px rgba(212, 165, 72, 0.5), inset 0 1px 0 rgba(240, 198, 104, 0.3)` | none |
| `pulse` (locked die matches) | same as gold | `1.5px solid var(--gold-bright)` | `var(--gold-bright)` with `text-shadow: 0 0 3px rgba(240, 198, 104, 0.7)` | breathing pulse (5px → 12px halo) | `pip-pulse 1.6s ease-in-out infinite` |

```css
@keyframes pip-pulse {
  0%, 100% { box-shadow: 0 0 5px rgba(212, 165, 72, 0.5), inset 0 1px 0 rgba(240, 198, 104, 0.3); }
  50%      { box-shadow: 0 0 12px rgba(240, 198, 104, 0.9), inset 0 1px 0 rgba(253, 224, 136, 0.5); }
}
```

**The pip grammar — what each state communicates:**

The three states form a **commitment hierarchy** that lets the player read reroll security at a glance:

- **Outlined pip**: the required face/number is absent from the dice. Need to roll/reroll into it. With glyphs or numbers inside, the player can target the missing requirement on their next reroll without computing.
- **Gold pip**: the face/number is present, but on an unlocked die. Rerolling that die would lose the match — the row is currently eligible but **at risk** if the player rerolls without locking.
- **Pulsing pip**: the face/number is on a locked die. Committed and safe. The pulse animation rewards the player visually for locking commitment: *"this can't be rerolled away."*

The visual difference between gold and pulse is **subtle**: same color, same fill, but pulse breathes. The strategic difference is large: an all-pulse strip is a fully-locked combo that survives any reroll; an all-gold strip is eligibility that vaporizes if you reroll the wrong die. The player learns to lock-then-reroll specifically because the strip teaches them this.

**Defensive variant** (always outlined-state, frost-tinted — there is no "recommended row" state, since the defensive picker presents both options with equal visual weight; see Part 6.1 DefensiveOverlay):

```css
.defCombo .pip {
  width: 13px;
  height: 13px;
  background: rgba(20, 24, 40, 0.7);
  border-color: rgba(108, 176, 232, 0.5);
}
.defCombo .pip .face {
  color: var(--frost-pale);
  font-size: 8.5px;
  text-shadow: 0 0 2px rgba(108, 176, 232, 0.4);
}
```

**Render logic:**

```typescript
import { FACE_GLYPH, getFaceDisplayName } from 'ui/content/dice'
import type { DieFace } from 'ui/content/dice'

function renderPip(face: DieFace, index: number, comboState: ComboState) {
  // PipState per L3261:
  //   'pulse'    = face is on a LOCKED die (committed — safe from rerolls)
  //   'gold'     = face is on an UNLOCKED die (present, but could be lost on reroll)
  //   'outlined' = face is not present on any die (still need this)
  const pipState = comboState.pips[index]
  return (
    <div className={clsx(s.pip, s[pipState])}>
      <span className={s.face}>{FACE_GLYPH[face]}</span>
    </div>
  )
}
```

`FACE_GLYPH` is **not** redeclared here — it's the canonical map from Part 1.8 (`ui/content/dice.ts`). For production, replace the inline `<span>` with `<Icon name={face} />` once SVG icons are built (see Part 1.7).

**Acceptance criteria:**
1. Pip count matches `combo.length`. T1 abilities show 3 pips; T2/T3 show 4; T4 ultimate shows 5.
2. The `pulse` state animates continuously via the threshold-pulse keyframe to communicate "this face is locked and safe."
3. When the underlying combo state changes (more dice locked → more pips become `pulse`; rerolled die changes a pip from `gold` to `outlined`), the transition is animated: pip background and border color cross-fade over 200ms.
4. Defensive variant never shows pulse or gold states (always outlined). Selection state (when the player taps a row) is applied externally by the row container — see Part 3.6.

### 3.5 ScaleBadge component — DEPRECATED

> **Deprecated.** The ScaleBadge was originally specified to show "current scaling damage" on T1-eligible rows (e.g., `"2 → 4"` to indicate base 2 scaling up to 4). With the AbilityValueBadge (Part 3.3) now showing **the current achievable damage directly on the left of the row**, the ScaleBadge becomes redundant — the player already sees their current scaling damage as the badge's main number, updating in real-time as dice lock.
>
> T1-eligible rows render the combo glyph strip on the right side (same as ineligible rows), not a ScaleBadge. The AbilityRow component's render logic is now uniform across tiers: always render the combo strip, never the ScaleBadge.
>
> **Migration:** if any existing code references `<ScaleBadge>`, replace its rendering with the standard `<ComboGlyphStrip>`. The `scaling` field on `LadderAbility` is still useful — it's the source of truth for the badge's dynamic value (the AbilityRow reads `ability.scaling.currentDamage` to determine what number to display in the badge for T1 abilities) — but the standalone ScaleBadge component is not implemented.
>
> The **maximum scaling value** is shown only in the ExpandedAbilityView modal (Part 6.7) as a small reference annotation in the combo readiness panel (e.g., "Max damage at full scaling: 6"). It's not surfaced in the ladder row.

### 3.6 Defensive sub-ladder components

The defensive picker overlay uses its own ladder structure that mirrors the offensive ladder but with different content.

**Visual reference:** `design.html#p3-defensive` shows the full picker.

```typescript
// ui/components/ladder/DefensiveLadder/DefensiveLadder.tsx

export type DefensiveLadderProps = {
  defenses: DefensiveOption[]      // Exactly 2 rows (D1, D2) — see HeroCustomizationScreen (Part 8.X)
  onSelect: (defenseId: string) => void
  selectedId?: string              // For selection state (player's tap)
  // No `recommendedId` field. The component has no engine-recommendation slot —
  // see DefensiveOverlay's "Equal visual weight" callout in Part 6.1.
}

export type DefensiveOption = {
  id: string
  tier: 'D1' | 'D2'                // Slot identifier (data model only — NOT rendered as a visual badge in the picker; see note below)
  name: string
  effectText: string               // "Heal 4 HP", "Reduce 5 + 1 Radiance", etc.
  combo: AbilityCombo              // Required combo (any of 4 canonical kinds — see Part 3.4)
  diceCount: 2 | 3 | 4 | 5         // How many dice will roll for this defense (engine allows 2-5; 2 is rare)
  offensiveFallback?: OffensiveFallback   // Engine concept — when offense fizzles, this defense fires as consolation
  damageType?: DamageType          // For defenses that involve damage (counter-attacks)
}

// When the player's offensive turn fizzles (no ability committed, or none of the rolled
// abilities resolve), the engine checks each defense for an `offensiveFallback` and fires
// the first one that matches. The picker may surface this with a small indicator on the
// row so the player understands "if I don't commit anything offensive, this defense fires."
//
// Example: Berserker's "Bloodoath" defense has an offensiveFallback that heals 4 HP and
// grants Frenzy if the offensive turn whiffs.
export type OffensiveFallback = {
  description: string              // Short prose for the picker indicator
  effect: AbilityEffect            // Engine effect tree (UI doesn't render directly; uses description)
}
```

> **Note on `tier`.** The `tier: 'D1' | 'D2'` field is retained for slot identification (loadout persistence, save/load, activity-log entries), but the defensive picker **does not render a visual tier badge**. The two-row layout means row position uniquely identifies the slot (top = D1, bottom = D2), and the defense name plus combo/dice info uniquely identifies the option — a "D1" / "D2" label badge would be redundant. The picker shows: defense name, effect text, combo glyphs, dice count.

> **Why 2 tiers, not 3.** The defensive ladder during matches shows exactly two rows, corresponding to the two defenses the player picked in HeroCustomizationScreen (Part 8.X). A larger catalog of defensive options exists per hero (typically 5-7); the player picks any 2 to bring to matches. D1 is the player's first pick (typically a low-cost defense); D2 is the second pick (typically more situational or higher-cost). Engineers should NOT hardcode "3 defensive slots" anywhere — the count is `loadout.defenses.length`, which equals 2 in MVP.

**Layout:**
- Flex column, 5px gap
- Each row is a `<DefensiveRow>`

**DefensiveRow component:**

```typescript
// ui/components/ladder/DefensiveRow/DefensiveRow.tsx

export type DefensiveRowProps = {
  defense: DefensiveOption
  selected: boolean                // Player has tapped this row
  onTap: () => void
}
```

**Visual specifications:**

Base row (default, equal weight for both options):
- Background: `linear-gradient(90deg, rgba(20, 24, 40, 0.85), rgba(26, 30, 48, 0.65))`
- Border: `1px solid var(--frost)`
- Border-radius: 6px
- Padding: 6px 9px
- Flex row, 9px gap

Selected state (player has tapped this row but not yet confirmed):
- Border: `1px solid var(--dawn-bright)`
- Background brightens slightly: `linear-gradient(90deg, rgba(30, 36, 60, 0.9), rgba(36, 42, 68, 0.75))`
- Box-shadow: `0 0 0 1px var(--dawn-bright), 0 0 12px rgba(253, 224, 136, 0.3)`
- 3px dawn-bright left-edge marker

> **No recommended state.** Both defensive rows always render in the base style by default; selection state (dawn-bright) applies only when the player taps a row. There is no engine-driven "recommended" treatment — no gold halo, no expected-value highlight. The player's first scan of the picker shows two equal-weight options with no engine hint about which to pick; the player decides based on the incoming damage, their own dice, and their HP.

**Children:**
```jsx
<div className={s.defRow} data-selected={selected}>
  <div className={s.info}>
    <div className={s.name}>{defense.name}</div>
    <div className={s.text}>{defense.effectText}</div>
  </div>
  <ComboGlyphStrip
    combo={defense.combo}
    state={{ status: 'ineligible', pips: defense.combo.map(() => 'outlined') }}
    variant="defensive"
  />
  <DefDiceBadge count={defense.diceCount} />
</div>
```

**DefDiceBadge component:**

```typescript
// ui/components/ladder/DefDiceBadge/DefDiceBadge.tsx

export type DefDiceBadgeProps = {
  count: number                    // 3, 4, 5
}
```

Visual:
- Padding: 2px 5px
- Border-radius: 3px
- Font: JetBrains Mono 10px, 700 weight, 0.05em letter-spacing
- Background: `rgba(74, 140, 200, 0.2)` (frost-tinted)
- Border: `1px solid rgba(74, 140, 200, 0.4)`
- Color: `var(--frost-bright)`
- Content: `{count}D` (e.g., "3D", "4D")

**Acceptance criteria:**
1. The defensive ladder shows the combo glyph strip + dice count badge for each row, both visible simultaneously.
2. Combo pips are always in outlined state (no dawn pulse, no gold fill) since defenses are single-roll and no engine eligibility is computed.
3. Tapping a row sets it as `selected` (dawn-bright border + halo). Tapping the action-bar Confirm button commits the selected defense.
4. Both rows render with equal visual weight by default — no engine recommendation, no "optimal pick" halo.
5. The combo strip uses `variant="defensive"` to disable dawn-pulse animation.


---

## Part 4 — Token & Resource Components

This part specifies the visual components that represent hero-specific tokens and generic status effects. Tokens live on the opponent and self status tracks (the prior orbiting-the-portrait RadianceRing was deprecated; see Part 4.3).

**Visual reference:** `design.html#p2-frostbite` through `design.html#p2-burn` show every token type in actual gameplay contexts. `design.html#p2-reference` is the at-a-glance grid.

### 4.1 SignatureChip component

**Visual reference:** Cinder pulsing in `design.html#p2-cinder`; Verdict in `design.html#p2-verdict`; Frost-bite in `design.html#p2-frostbite`.

```typescript
// ui/components/tokens/SignatureChip/SignatureChip.tsx

export type SignatureChipProps = {
  kind: SignatureKind
  count: number                  // 1–5; 0 means the chip is dissolving (handled by parent)
  threshold?: boolean            // Only meaningful for cinder; computed at render time (kind === 'cinder' && count >= 4)
  className?: string             // For positioning by parent

  // Lifecycle hooks (for parent-driven animation)
  isApplying?: boolean           // Triggers slam-in animation
  isConsuming?: boolean          // Triggers fly-into-FOP animation
  isDetonating?: boolean         // Triggers burst (Cinder only)
}

// SignatureKind aliases the bare-name shorthand to the engine's hero-namespaced StatusId.
// The chip component accepts either form; internally normalizes to the bare-name for
// CSS-class derivation.
export type SignatureKind = 'frostbite' | 'cinder' | 'verdict'

// Engine's StatusId for these signatures is namespaced:
//   'berserker:frostbite' ↔ chip kind 'frostbite'
//   'pyromancer:cinder'   ↔ chip kind 'cinder'
//   'lightbearer:verdict' ↔ chip kind 'verdict'
//
// The OpponentStrip and SelfStrip read `statuses: StatusInstance[]` from the hero snapshot
// and render a SignatureChip when a status's ID matches one of the three signature StatusIds
// above (the StatusTrack — Part 4.6 — handles the namespacing → chip-kind translation).
//
// Engine's StatusInstance shape (mirrors Part 0.3):
//   { id: StatusId, stacks: number, appliedBy: PlayerId }
// The chip's `count` prop comes from `stacks`; `appliedBy` is used for tooltip attribution.
// There is no `appliedAt` timestamp on engine's StatusInstance — valence-group ordering
// uses application-order from the engine event stream instead.
```

**Visual specifications by kind:**

| Kind | Background | Border | Icon stroke | Box-shadow |
|------|-----------|--------|-------------|------------|
| frostbite | `linear-gradient(180deg, rgba(108, 176, 232, 0.35), rgba(74, 140, 200, 0.2))` | `1.5px solid var(--frost-bright)` | `var(--frost-bright)` (via currentColor) | `0 0 6px rgba(108, 176, 232, 0.5)` |
| cinder | `linear-gradient(180deg, rgba(240, 104, 72, 0.4), rgba(200, 74, 42, 0.25))` | `1.5px solid var(--ember-bright)` | `var(--ember-bright)` (via currentColor) | `0 0 6px rgba(240, 104, 72, 0.5)` |
| verdict | `linear-gradient(180deg, rgba(253, 224, 136, 0.35), rgba(212, 165, 72, 0.2))` | `1.5px solid var(--dawn)` | `var(--dawn-bright)` (via currentColor) | `0 0 6px rgba(251, 191, 36, 0.5)` |

All chips:
- **Size: 22×22px** (matches StatusChip size for visual rhythm across the status track)
- **Border-radius: 50%** — circular shape, matching StatusChip. The earlier rectangular treatment (border-radius 4px) was retained from before the StatusChip redesign and created an inconsistency: round chips for generic statuses, square chips for signatures. The new unified circular shape gives the entire token system one visual grammar.
- **Icon centered**: 14px, full chip area, in `currentColor` (inherits from chip border)
- **Count rendered as a corner badge** at top-right, NOT stacked below the icon. Mirrors the StatusChip pattern for consistent count vocabulary across the token system.
- `position: relative` so the `::before` decorative outer border, Cinder's fuse-ring, and the count badge can be positioned

> **About the count badge.** The earlier design stacked icon-above-count inside the chip, which forced the icon to ~11px and the count to ~9px just to fit vertically. The new corner-badge approach lets the icon use the full chip area at 14px (readable, recognizable) and renders the count as a small floating badge at the top-right corner — same visual grammar as StatusChip's count badge. Class names are unified: `.badge` is the preferred selector (matches `.s-chip .badge`); the legacy `.count` selector is retained as an alias for back-compat in older markup.

**Count badge specification** (identical to StatusChip's badge):
- Position: `top: -4px; right: -4px` (extends slightly past the chip edge)
- Size: 12×12 min, padded for two-digit numbers
- Background: `rgba(10, 10, 20, 0.95)` — dark so it stands out against any chip color
- Border: `1px solid currentColor` (matches chip color)
- Font: JetBrains Mono 8px, weight 700, color `currentColor`
- `z-index: 2` so the badge renders above Cinder's fuse-ring

**The decorative outer border** (matches the design's "ornamented edge"):

```css
.signatureChip::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 5px;
  border: 1px solid currentColor;
  opacity: 0.4;
  pointer-events: none;
}
```

`currentColor` resolves to the chip's primary color (frost-bright, ember-bright, or dawn).

**The Cinder fuse ring** (specific to Cinder chips, visible at all stack counts but more prominent near threshold):

```css
.cinderChip .fuseRing {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: conic-gradient(
    from -90deg,
    var(--ember-bright) calc(var(--fuse) * 1%),
    rgba(110, 32, 16, 0.4) 0%
  );
  -webkit-mask: radial-gradient(circle, transparent 60%, black 62%, black 100%);
  mask: radial-gradient(circle, transparent 60%, black 62%, black 100%);
  opacity: 0.7;
  pointer-events: none;
}
```

The `--fuse` custom property is set inline from JavaScript: `fuse = (count / 5) * 100`. So at 1 stack, the conic gradient fills 20%; at 4 stacks (threshold-pulse), it fills 80%; at 5 stacks (detonation), it fills 100%.

**Threshold state** (Cinder at `count >= 4` — one stack from detonation):

> **Resolved (revision 1.1).** Engine truth from `pyromancer.ts`: Cinder's `stackLimit` and detonation `threshold` are both **5**, with `triggerTiming: 'on-application-overflow'` — the detonation fires when an application pushes stacks to 5, dealing **8 undefendable damage** and resetting stacks to 0. The chip pulses its warning state at 4 stacks ("one more and it blows"). Pyromancer gains +2 CP on detonation. See Part 5.7 (DetonationContent).

```css
.cinderChip.threshold {
  animation: cinder-pulse 600ms ease-in-out infinite;
}
.cinderChip.threshold .fuseRing {
  opacity: 1;
  filter: drop-shadow(0 0 4px var(--ember-glow));
}
```

Under `prefers-reduced-motion`, the animation is replaced with the held peak state (scale 1.04, brighter glow, no oscillation).

**Lifecycle animations:**

| Phase | Visual |
|-------|--------|
| `isApplying` (slam-in) | Enter from offscreen-right or above (parent determines direction). Initial: `transform: translateX(20px) scale(1.4); opacity: 0`. Animate to `translateX(0) scale(1); opacity: 1` over 250ms with overshoot easing. Brief 100ms color flash at 1.2× peak. |
| `isConsuming` (fly to FOP) | Animate `transform: translate(...) scale(1.3); opacity: 0` over 400ms. The "..." translates to the FOP's center, computed by the parent that knows both positions. After animation, the chip is removed from the DOM. |
| `isDetonating` (Cinder only, at threshold 5) | Scale to 1.6×, flash white-gold at peak, then explode into particle burst (handled by ParticleField sibling). 600ms total. |

**Acceptance criteria:**
1. The count number displays the current stack count. When count changes from N to N+1, the chip flashes brighter for 200ms (chip's box-shadow brightens 50%) — but does not re-trigger the entrance animation.
2. When count changes from N to N-1 (decrement, e.g., from a partial consumption), the count tick down with a brief `0.9 → 1.0` scale pulse over 200ms.
3. When count drops to 0, the chip animates out (fade + scale to 0 over 200ms) before being removed from the DOM. The status track repositions remaining chips smoothly.
4. The Cinder fuse-ring's `--fuse` CSS variable is set inline via `style={{ '--fuse': fuseValue } as React.CSSProperties}` where `fuseValue = (count / 5) * 100`.
5. Long-press (≥400ms) opens a tooltip showing: name, hero source, current stacks, full mechanic description. See Part 8 for tooltip rendering specs.
6. Touch target is 44×44 minimum (the visible chip is 24×24 but the tap zone is expanded via padding on the parent or `::before` pseudo-element).

### 4.2 SignatureCounter component (Frenzy) — REWRITTEN

> **Bible v0 was fundamentally wrong about Frenzy.** Earlier drafts specified Frenzy as a *binary lit/dormant glyph* that "lit when 3+ sword faces are locked at end of roll phase, adding +2 to damage this turn." Engine reality is completely different on four counts:
>
> 1. **Trigger condition.** Frenzy is gained when Berserker *takes damage from the opponent's offensive ability*, not when locking sword faces. (Berserker has no sword symbol; he has axe/fur/howl per Part 1.8.)
> 2. **Representation.** Frenzy is a 0-6 *bankable counter* stored in `heroSnapshot.signatureState.frenzy` with `bankCap: 6`. Not binary.
> 3. **Bonus amount.** Each stack adds **+1 damage** to all offensive abilities (not +2 per turn).
> 4. **Duration.** Stacks persist *across turns* until spent or capped — not single-turn.
>
> The `<SignatureGlyph>` component originally specified for this is **deleted** — the only "binary glyph" mechanic in the bible doesn't exist in the engine. The new component is `<SignatureCounter>`, a chip-style counter that renders 0-6 stacks. Conceptually, Frenzy is structurally identical to Radiance (Lightbearer's bankable counter) — both are signature counters living on `signatureState`, both render as count-bearing chips, both feed mechanical effects via engine logic. The visual treatment differs by hero element (frost vs. dawn) but the data path is the same.

**Visual reference:** `design.html#p2-frenzy` (will need rework — current mockup shows binary lit/dormant; new design needs to show 0-6 counter chip).

```typescript
// ui/components/tokens/SignatureCounter/SignatureCounter.tsx

export type SignatureCounterProps = {
  kind: SignatureCounterKind     // Which hero signature counter
  count: number                  // 0–6 (or per-hero bankCap)
  bankCap?: number               // Visual fill ceiling; 6 for both Frenzy and Radiance (engine truth).
                                 // Note: Radiance STARTS at 2 at match-start; Frenzy starts at 0.
  className?: string

  isGaining?: boolean            // Slam-in animation when a stack is added
  isSpending?: boolean           // Fly-into-FOP when consumed (Radiance only — Frenzy is auto-applied)
  isCapped?: boolean             // At bankCap: subtle pulse to signal "next gain is wasted"
}

// Berserker signature counter (and structurally similar to Lightbearer's radiance,
// though Radiance has its own chip per Part 4.3). Frenzy lives on signatureState.frenzy
// in the hero snapshot (see Part 0.3 HeroSnapshot). Each stack adds +1 damage to all
// offensive abilities. Gained when the holder takes damage from the opponent's offensive
// ability — gain is capped at +1 per turn (engine enforces). Stacks persist until spent
// (via offensive ability resolution; engine deducts the consumed amount) or until match end.
export type SignatureCounterKind = 'frenzy' | 'radiance'

// Engine-side state lives on signatureState; not in statuses[]:
//   heroSnapshot.signatureState.frenzy: number    // 0-6 (starts 0; +1 per turn max, gained on damage taken)
//   heroSnapshot.signatureState.radiance: number  // 0-6 (starts 2; +1 on damage taken; spend ±2 per token)
// The StatusTrack (Part 4.6) reads signatureState and synthesizes one <SignatureCounter>
// per hero. Frenzy renders only on Berserker's strip; Radiance only on Lightbearer's.
```

**Visual specifications by kind:**

| Kind | Background | Border | Icon (Lucide) | Color | Box-shadow |
|------|-----------|--------|---------------|-------|------------|
| frenzy | `linear-gradient(180deg, rgba(108, 176, 232, 0.25), rgba(74, 140, 200, 0.15))` | `1.5px solid var(--frost)` | `swords` (crossed weapons) | `var(--frost-bright)` | `0 0 6px rgba(108, 176, 232, 0.45)` |
| radiance | `linear-gradient(180deg, rgba(253, 224, 136, 0.25), rgba(212, 165, 72, 0.15))` | `1.5px solid var(--gold)` | `sparkles` | `var(--gold-bright)` | `0 0 6px rgba(253, 224, 136, 0.45)` |

Both:
- **Size: 24×22px** (slightly wider than StatusChip to fit the count badge cleanly)
- **Border-radius: 4px** (rectangular, distinguishes counters from circular statuses)
- **Icon centered**: 12px Lucide line icon, full `currentColor`
- **Count badge at top-right**: same shape as StatusChip's count badge (12×12 min, dark background, currentColor border, JetBrains Mono 8px). Renders the current `count` value. **Hidden when count is 0.**
- **Capped indicator**: when `count === bankCap`, a subtle 1.6s pulse cycles the box-shadow at higher intensity to signal "next gain wasted."

**Zero-count rendering.** Unlike StatusChip (which is removed entirely when stacks reach 0), the SignatureCounter renders at `count === 0` with the chip visible but the count badge hidden. The chip itself dims to `opacity: 0.55` so it reads as "available but inactive." This communicates "you're a Berserker; Frenzy exists as a mechanic" without misleading the player that they currently have any.

**Why render at 0 instead of hiding?** Frenzy is a defining piece of Berserker's identity and the player should always know it exists, even when stacks are zero. Hiding the chip would force the player to remember that Frenzy is in play and check the rules. The dimmed-but-present chip is a quiet signal: "here is your signature mechanic, currently dormant."

**Stack-gain animation (`isGaining`):**

```css
.signatureCounter.gaining {
  animation: counter-gain 350ms cubic-bezier(0.2, 0.7, 0.2, 1);
}
@keyframes counter-gain {
  0%   { transform: scale(1); box-shadow: 0 0 6px rgba(108, 176, 232, 0.45); }
  40%  { transform: scale(1.18); box-shadow: 0 0 18px rgba(108, 176, 232, 0.9); }
  100% { transform: scale(1); box-shadow: 0 0 6px rgba(108, 176, 232, 0.45); }
}
```

The badge value updates mid-animation (at the 40% peak) so the player sees the new count emerge from the brightest moment of the gain pulse.

**Spend animation (`isSpending`, Radiance only):**

Identical to SignatureChip's `isConsuming` — the chip animates `transform: translate(...) scale(1.3); opacity: 0` over 400ms toward the FOP center, then is replaced with the new lower count. For Frenzy specifically, there is no "spend" because Frenzy is automatically applied to offensive ability damage on resolution; the spend animation is reserved for player-triggered Radiance spends.

**Acceptance criteria:**

1. SignatureCounter renders at `count === 0` with the chip visible (dimmed to 0.55 opacity) and the count badge hidden. As count goes 0→1, the chip ramps to opacity 1 simultaneously with the gain animation.
2. The `isCapped` state activates when `count === bankCap` and pulses subtly at 1.6s cycle. When the player spends or the cap mechanic changes, `isCapped` clears.
3. Frenzy ticks are gained only when the holder takes damage from the opponent's offensive ability — NOT when they lock sword faces (Berserker has no sword symbol). Engine handles this trigger; UI only renders the result.
4. The component is **non-interactable** — passive states aren't tappable. Long-press still opens the tooltip explaining the mechanic and current stack count.
5. The chip is rendered only on the appropriate hero's strip: Frenzy on Berserker, Radiance on Lightbearer. Pyromancer's signature (Ashfall/Cinder) uses a different rendering (Cinder = SignatureChip from Part 4.1, Ashfall = TBD if surfaced separately).

> **What happened to `<SignatureGlyph>`?** Deleted. The binary-glyph mechanic the bible originally specified doesn't exist in any hero's engine content. Any old references to `<SignatureGlyph kind="frenzy">` should be replaced with `<SignatureCounter kind="frenzy" count={frenzy} bankCap={6} />`.



### 4.3 RadianceRing component — DEPRECATED

> **Deprecated.** The RadianceRing was originally specified as a 6-pip ring orbiting Lightbearer's portrait orb. This design **does not work with real character art**: a ring of pips around the portrait circumference visually competes with the character's face, constrains all hero art to circular framing, and overlaps the artwork at every cardinal position.
>
> **For MVP, Radiance renders as a `<SignatureCounter kind="radiance">`** (Part 4.2) in the StatusTrack — structurally identical to Frenzy: a count-bearing rectangular chip reading from `signatureState.radiance`, visible at all counts (it starts at 2), with `isCapped` pulse at the 6-stack bank cap. *(Revision 1.1 note: an earlier draft of this deprecation said "render as StatusChip" — that contradicted the Part 4.2 rewrite, which is canonical. Both signature counters use `<SignatureCounter>`.)*
>
> **A proper hero-specific treatment is deferred to v2**, when character art is finalized and the team can design Lightbearer's signature visual identity without constraints from placeholder art. The v2 treatment will likely return to a pip-bar pattern (horizontal track of 6 pips that fill as Radiance accumulates), but its placement and styling will be determined by how the character art reads on screen.
>
> **Migration:** any existing reference to `<RadianceRing>` should render `<SignatureCounter kind="radiance" count={...} bankCap={6} />` instead. The animation triggers (`isGaining` / `isSpending`) map directly. Valence (positive on Lightbearer's self-strip — it's their resource accumulator) is derived inside StatusTrack, not passed as a prop.

### 4.4 GenericChip component → StatusChip component

> **Renamed and redesigned.** The component previously known as `GenericChip` has been renamed to `StatusChip` and substantially redesigned. The new design uses **Lucide-style line icons** instead of letter glyphs, with a circular chip shape and a number badge overlay. The result is a status system that reads as game effects (burning, stunned, shielded) rather than as generic UI tags.

**Visual reference:** `design.html#p2-reference` shows the universal statuses with their Lucide icons in the system reference grid.

```typescript
// ui/components/tokens/StatusChip/StatusChip.tsx

export type StatusChipProps = {
  effect: StatusId               // Hero-namespaced (e.g., 'berserker:frostbite') or universal ('burn')
  count?: number                 // Stack count (from StatusInstance.stacks)
  appliedBy?: PlayerId           // For tooltip attribution (from StatusInstance.appliedBy)
  className?: string

  isApplying?: boolean           // Entry animation: slam-in
  isExpiring?: boolean           // Exit animation: fade + desaturate
  isTicking?: boolean            // Decrement animation: brief scale pulse (upkeep tick fired)
}

// StatusId mirrors engine's universe of status identifiers. Universal statuses are bare
// names; hero-specific statuses are namespaced. The StatusTrack (Part 4.6) routes
// hero-namespaced signatures (berserker:frostbite, pyromancer:cinder, lightbearer:verdict)
// to <SignatureChip> instead of <StatusChip>, but the underlying StatusId vocabulary is
// shared.
export type StatusId =
  // ── Universal statuses (apply to any hero) ──────────────────────────────
  | 'burn'        // harmful   — at upkeep, deal stacks damage; decrement 1/tick; max 5
  | 'stun'        // control   — blocks the offensive roll, then expires; neverTicks; max 1
  | 'protect'     // defensive — reduces incoming damage 2 per stack in the pipeline; neverTicks; max 5
  | 'shield'      // defensive — reduces incoming damage 1 per stack; neverTicks; max 3
  | 'regen'       // beneficial — at upkeep, heal stacks HP; decrement 1/tick; max 5
  // ── Hero-namespaced signatures (routed to SignatureChip per Part 4.6) ──
  | 'berserker:frostbite'         // see Part 4.1 — max 4; ticks 1 dmg + thaws 1/turn; −1 dmg/stack on holder's offense
  | 'pyromancer:cinder'           // see Part 4.1 (detonates at 5 stacks: 8 ub damage, resets to 0)
  | 'pyromancer:defense-handicap-1' // "Smouldering Stone" — −1 defensive die on next defensive roll; consumed by that roll
  | 'lightbearer:verdict'         // see Part 4.1 (max 4; −2 dmg/stack; 3+ blocks cards; Atone = 2 CP, strips all)
```

> **Bible v0 corrections.** Earlier drafts listed `poison`, `frozen`, `momentum`, and `bleed` as universal statuses. Engine reality:
> - `poison` — fabrication; doesn't exist in engine
> - `frozen` — fabrication; doesn't exist (intentionally similar concept rolled into Stun)
> - `momentum` — fabrication; no momentum bank or status anywhere in engine
> - `bleed` / `bleeding` — not registered in engine v1 at all (revision 1.1 confirmed); removed from the union
> - `empower` — engine reality: NOT a status. Engine uses `nextAbilityBonusDamage: number` on HeroSnapshot (a one-shot scalar consumed by the next offensive ability) or a `persistent-buff` effect. The "Empower" surface name from the keyword registry (Part 1.9) describes the mechanic; it does not have a StatusChip.
> - `radiance` — engine reality: NOT a status. Lives on `signatureState.radiance` as a bankable counter. Renders as a `<SignatureCounter>` (Part 4.2), not StatusChip.
>
> Universal statuses **added** to match engine: `protect` (2-for-1 damage reduction, max 5 — missing entirely from v0). Hero-namespaced statuses added: `berserker:frostbite`, `pyromancer:cinder`, `pyromancer:defense-handicap-1`, `lightbearer:verdict`.

**Status registry — icon, color, mechanic:**

| StatusId | Lucide icon | Color token | Mechanic |
|----------|-------------|-------------|----------|
| burn | `flame` | `--ember-bright` | At upkeep, deal `stacks` damage. Decrement by 1. Max 5. |
| stun | `zap` | `--electric-purple-bright` | Blocks the holder's offensive roll, then expires (clears roll attempts). Never ticks. Max 1. |
| protect | `shield-half` | `--frost` | Absorbs 2 damage per stack in the damage pipeline. Never ticks. Max 5. |
| shield | `shield` | `--frost-bright` | Absorbs 1 damage per stack. Never ticks. Max 3. |
| regen | `heart-pulse` | `--green-bright` | At upkeep, heal `stacks` HP. Decrement by 1. Max 5. |
| berserker:frostbite | (custom frost icon) | `--frost-bright` | Berserker signature, max 4. Ticks 1 damage + thaws 1 stack at holder's upkeep; −1 damage/stack on holder's offense. Rendered as `<SignatureChip>`. |
| pyromancer:cinder | (custom flame icon) | `--ember-bright` | Pyromancer signature. Detonates at 5 stacks: 8 undefendable damage, resets to 0. Rendered as `<SignatureChip>`. |
| pyromancer:defense-handicap-1 | `shield-off` | `--crimson` | "Smouldering Stone" — holder rolls 1 fewer die on their next defensive roll; consumed by that roll. Rendered as `<StatusChip>`. |
| lightbearer:verdict | `scale` | `--dawn-bright` | Lightbearer signature, max 4. −2 damage/stack on holder's offense; 3+ stacks blocks main-phase + instant cards; Atone (2 CP) strips all. Rendered as `<SignatureChip>`. |

**Color tokens.** The `--electric-purple-bright` and `--toxic-green-bright` tokens specified in v0 for poison/frozen are no longer used (those statuses are gone). The `--electric-purple-bright` token can stay for Stun. The toxic-green tokens can be retired.

**Chip CSS structure:**

```css
.statusChip {
  width: 22px;
  height: 22px;
  background: rgba(0, 0, 0, 0.35);
  border: 1.5px solid currentColor;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--ember-bright); /* default; overridden per status */
}
.statusChip.burn      { color: var(--ember-bright); background: rgba(200, 74, 42, 0.15); }
.statusChip.stun      { color: var(--electric-purple-bright); background: rgba(167, 120, 255, 0.15); }
.statusChip.regen     { color: var(--green-bright); background: rgba(74, 140, 90, 0.15); }
.statusChip.protect   { color: var(--frost); background: rgba(74, 140, 200, 0.12); }
.statusChip.shield    { color: var(--frost-bright); background: rgba(74, 140, 200, 0.15); }
.statusChip.defenseHandicap { color: var(--crimson); background: rgba(138, 24, 40, 0.15); }
.statusChip .icon {
  width: 14px;
  height: 14px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.statusChip .count-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(10, 10, 20, 0.95);
  border: 1px solid currentColor;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  font-weight: 700;
  color: currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
```

**Icon SVG paths (Lucide reference):**

These are the Lucide path data values that engineers should use. Lucide is MIT-licensed and the paths can be embedded directly or imported via `lucide-react`:

```typescript
// ui/content/status-icons.ts
// Keyed by the universal StatusIds that render as <StatusChip>. Signature chips
// (frostbite/cinder/verdict) and signature counters (frenzy/radiance) have their
// own icon treatments in their components.
export const STATUS_ICON_PATHS: Record<string, string> = {
  burn:    'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',  // flame
  stun:    'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',  // zap
  regen:   'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27',  // heart-pulse
  protect: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z M12 22V2',  // shield-half
  shield:  'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',  // shield
  'pyromancer:defense-handicap-1': 'M19.7 14a6.9 6.9 0 0 0 .3-2V5l-8-3-3.2 1.2 M4.7 4.7 4 5v7c0 6 8 10 8 10a20.3 20.3 0 0 0 5.6-4.4 M2 2l20 20',  // shield-off
}
```

**Rendering pattern:**

```jsx
<div className={clsx(s.statusChip, s[effect])}>
  <svg className={s.icon} viewBox="0 0 24 24">
    <path d={STATUS_ICON_PATHS[effect]} />
  </svg>
  {count != null && count > 0 && (
    <span className={s.countBadge}>{count}</span>
  )}
</div>
```

**Animation lifecycle:**

| Phase | Visual |
|-------|--------|
| `isApplying` (newly applied) | Chip slams in from 0.5 scale to 1.0 over 250ms with brief brighter glow on the icon |
| `isTicking` (count decremented but not expired) | Count badge does a brief 0.9 → 1.0 scale (200ms) with a flash to a lighter color shade |
| `isExpiring` (count just dropped to 0 from natural decay) | Chip desaturates over 350ms while fading to opacity 0, then removes from DOM |

**Acceptance criteria:**

1. Chip displays the correct Lucide icon for the status type, color-tinted per the status's accent color.
2. The count badge appears only when `count != null && count > 0`. Statuses without counts (Stun, Frozen — both one-turn effects) render without a badge.
3. Color-tinting is applied via the `currentColor` mechanism so the icon stroke and the border share the same color.
4. Animations play once per state transition, never loop except as specified.
5. Chips are 22×22 visually, but their stacked layout in the StatusTrack must account for the count-badge protruding into the top-right (-4px offset). Track gap should be ≥6px to prevent badge overlap.

### 4.5 BuffChip component

> **Bible v0 had this conceptually wrong.** Earlier drafts specified a `CardBuffKind = 'sanctuary' | 'vow' | 'sunburst'` registry with three named buffs. Engine reality: there is no unified "card buff" registry. Instead, persistent effects from cards live in **five different arrays** on HeroSnapshot (per Part 0.3), each with distinct lifecycle and mechanics:
>
> | Engine array | What it holds | Example |
> |--------------|---------------|---------|
> | `pipelineBuffs: ActivePipelineBuff[]` | Damage-pipeline modifiers (reduce incoming, etc.) | Sanctuary's "reduce next 4 damage" |
> | `triggerBuffs: ActiveTriggerBuff[]` | CP-gain trigger modifiers | "Vow-style" gain bonuses (whichever cards do this) |
> | `abilityModifiers: ActiveAbilityModifier[]` | Mastery + persistent ability modifiers | Mastery cards, "Cleave deals +3" |
> | `comboOverrides: ActiveComboOverride[]` | Combo relaxation | Sunburst-style "remove one pip requirement" |
> | `symbolBends: ActiveSymbolBend[]` | Face-symbol re-mappings | "Count ash as ember for this turn" |
>
> The bible's BuffChip needs to **flatten these five arrays into a single rendering vocabulary** — the player doesn't need to know which engine array a buff lives in; they need to know *what the buff does* and *how long it lasts*. The component takes a flat `BuffDescriptor` projection that the StatusTrack assembles from the five arrays.

**Visual reference:** `design.html#p2-radiance` shows the "VOW" buff chip; `design.html#p2-reference` shows buff examples. (Mockups will be refined as content firms up.)

```typescript
// ui/components/tokens/BuffChip/BuffChip.tsx

export type BuffChipProps = {
  descriptor: BuffDescriptor
  className?: string

  isApplying?: boolean
  isExpiring?: boolean
}

// Flat UI projection — derived from any of the engine's 5 buff arrays.
// The StatusTrack (Part 4.6) builds this from the snapshot's pipelineBuffs,
// triggerBuffs, abilityModifiers, comboOverrides, and symbolBends arrays.
export type BuffDescriptor = {
  id: string                              // Stable instance ID (e.g., 'pipeline-0', 'mastery-T2')
  source: BuffSource                      // Which engine array this buff originated from (for tooltip categorization)
  label: string                           // Short display label (max 8 chars), e.g., "SAN", "MAST", "BEND"
  longLabel: string                       // Full label for tooltip and ExpandedBuffView, e.g., "Sanctuary"
  variant: BuffVariant                    // Visual treatment — see below
  description: string                     // Tooltip prose: "Reduce next incoming damage by 4"
  remaining: BuffRemaining                // Visual countdown — see below
  sourceCardName?: string                 // For tooltip: which card created this buff
}

export type BuffSource =
  | 'pipeline'         // From pipelineBuffs[] — damage-flow modifiers
  | 'trigger'          // From triggerBuffs[] — CP-gain modifiers
  | 'ability-modifier' // From abilityModifiers[] — Mastery + ability buffs
  | 'combo-override'   // From comboOverrides[] — combo relaxation
  | 'symbol-bend'      // From symbolBends[] — face re-mapping

export type BuffVariant =
  | 'defensive'        // Frost-themed; protective effects (most pipelineBuffs)
  | 'beneficial'       // Green-themed; positive self-effects (triggerBuffs, beneficial pipelineBuffs)
  | 'signature'        // Gold-themed; hero-signature buffs (often ability-modifier or signature-card-derived)
  | 'utility'          // Bone-themed; mechanical effects (combo-override, symbol-bend)

// Engine uses DiscardTrigger to drop buffs — not turn counters. UI translates this
// into a remaining indicator the player can read:
//   - 'on-event' → shows a small icon hinting at when it'll drop (without showing a number)
//   - 'turns'    → shows remaining turn count
//   - 'persistent' → shows "∞"
export type BuffRemaining =
  | { kind: 'turns', remaining: number }                      // Counts down each turn boundary
  | { kind: 'persistent' }                                    // Lasts until match ends or a non-turn event triggers discard
  | { kind: 'on-event', trigger: BuffDiscardEvent, hint: string }   // Drops on a specific game event
                                                              // hint: short label for the corner indicator, e.g., "on hit", "next dmg"

export type BuffDiscardEvent =
  | 'damage-taken-from-tier'   // Drops when a specific-tier hit lands
  | 'status-removed'           // Drops when a specific status is removed from the holder
  | 'end-of-self-turn'         // Drops at the end of the holder's own turn
  | 'next-turn-of-self'        // Drops at start of holder's next turn
  | 'end-of-any-turn'          // Drops at end of any turn
  | 'match-ends'               // Persistent until match end (also accept as a duration)
```

**Visual specifications by variant:**

| Variant | Background | Border | Color |
|---------|-----------|--------|-------|
| defensive | `rgba(74, 140, 200, 0.25)` | `1px solid var(--frost)` | `var(--frost-bright)` |
| beneficial | `rgba(74, 140, 90, 0.25)` | `1px solid var(--green)` | `var(--green-bright)` |
| signature | `rgba(212, 165, 72, 0.25)` | `1px solid var(--gold)` | `var(--gold-bright)` |
| utility | `rgba(160, 160, 180, 0.18)` | `1px solid var(--bone-dim)` | `var(--bone-bright)` |

All buff chips:
- Size: 28×22px (wider than generic chips to accommodate longer labels)
- Border-radius: 3px
- Box-shadow: `0 0 5px [matching color, 0.4 alpha]`
- Label: Cinzel 6.5px, 700 weight, 0.04em letter-spacing, centered, line-height 1
- For multi-word labels ("SUN BRST"), use `<br>` to break the line

**Remaining indicator** (always present, top-right corner overhang):
- Position: `top: -3px; right: -3px`
- For `turns`: same as v0 — gold tag with `{N}T` (e.g., "2T", "1T")
- For `persistent`: gold tag with `∞`
- For `on-event`: a small **event-icon** badge instead of text — a Lucide icon indicating the trigger (`shield` for `damage-taken`, `x-circle` for `status-removed`, `arrow-right-circle` for turn-end events). Tooltip elaborates ("Drops next time damage lands", "Drops when Burn is removed").

**Acceptance criteria:**

1. Each engine buff array maps to BuffDescriptor entries by the StatusTrack — no rendering happens directly off engine state.
2. Buffs from `abilityModifiers[]` that target an ability slot **may not render in the StatusTrack** — Mastery indicators are rendered on the ability row itself (Part 3.3) via the `masteryApplied` mechanism. The StatusTrack BuffChip surface is for buffs that don't have a row affordance.
3. The `on-event` remaining indicator updates immediately when the engine's discard rule fires; the chip animates out via the standard 350ms fade+desaturate sequence.
4. Long-press shows a tooltip with: longLabel, source-card name (if set), full description, and the remaining indicator's expansion ("Drops at start of your next turn").
5. The four variants are derived per buff at descriptor-build time (in the StatusTrack), not picked by the chip component itself. Engineers extending the registry add new sources by extending `BuffSource` and updating the variant-mapping table in Part 4.7.

### 4.6 StatusTrack component

The container that holds all status-related items on a hero strip. It manages layout, valence grouping, and overflow.

```typescript
// ui/components/tokens/StatusTrack/StatusTrack.tsx

export type StatusTrackProps = {
  playerId: PlayerId
  signatures?: SignatureToken[]
  statuses?: StatusToken[]               // Renamed from `generics`; uses the new StatusChip component (Part 4.4)
  buffs?: BuffDescriptor[]               // Flat UI projection assembled from the snapshot's 5 buff arrays (Part 4.5)
  counters?: SignatureCounterData[]      // Frenzy / Radiance from signatureState — rendered as <SignatureCounter> (Part 4.2)
  maxVisible?: number                    // Default 5
}

export type StatusToken = {
  effect: StatusId                        // See Part 4.4 StatusId union
  count?: number                          // Stack count or duration
  source?: string                         // For tooltips: "Pyromancer · Pyro Lance"
}
```

**Valence grouping:**

Chips inside the track are partitioned into two sub-groups: `positive` (left) and `negative` (right). **Valence is computed from the strip-owner's perspective**: positive = helps the hero on this strip; negative = hurts the hero on this strip.

| Chip variant | Valence | Why |
|---|---|---|
| `statusChip.shield`, `statusChip.protect`, `statusChip.regen` | positive | Beneficial status effects on the strip owner — buffs the strip's hero |
| `signatureCounter.frenzy`, `signatureCounter.radiance` (any count, incl. 0) | positive | The strip owner's signature resource accumulators; kept in the positive group even at 0 — they're the player's signature slot |
| `buffChip.*` (all BuffDescriptors) | positive | Card-applied buffs are always beneficial to the strip owner in v1 (the player chose to play these on themselves) |
| `statusChip.burn` | negative | Damage-over-time on the strip owner |
| `statusChip.stun`, `statusChip.defense-handicap-1` | negative | Control / handicap effects on the strip owner |
| `sigChip.frostbite` | negative | Berserker applies Frost-bite to opponents. The chip lives on the **receiving** strip, where it harms the strip owner (ticks 1 damage at their upkeep and weakens their offense by −1/stack). Valence = negative from the strip-owner's perspective. |
| `sigChip.cinder` | negative | Pyromancer applies Cinder to opponents. Lives on the receiving strip; detonates at 5 stacks for 8 undefendable damage. Negative from the strip-owner's perspective. |
| `sigChip.verdict` | negative | Lightbearer applies Verdict to opponents. Verdict harms the strip owner (−2 damage/stack on their offense; 3+ stacks blocks their cards); the holder may Atone (2 CP) to clear it. Always negative on the receiving strip. |

> **About valence consistency across signature chips.** Frost-bite, Cinder, and Verdict are all *opponent-applied* signature accumulators. They all read as negative on the receiving strip — same visual valence convention regardless of which hero applied them. This means a Pyromancer player looking at the opponent's Berserker strip sees ember-on-crimson Cinder chips in the negative group (they're hurting the Berserker — good for the Pyromancer), while a Berserker looking at their own strip sees the same chips in the same negative group (hurting them). The valence is always strip-owner-relative, never viewer-relative.

**Layout:**

- Flex row, **6px gap** (increased from 3px to accommodate StatusChip count-badge overlap), items align center
- Track contains up to two sub-group containers:
  - `<div className={s.statusGroup} data-valence="positive">...</div>`
  - `<div className={s.statusGroup} data-valence="negative">...</div>`
- A subtle 1px gold vertical divider sits between the two groups (10px margin-left on the second group + a `::before` pseudo-element drawing the divider)
- If only one group has chips, the divider doesn't render (the `+ .status-group` selector ensures it only appears when both are present)
- Within each group, chips render in application order (most-recent rightmost within group)
- Right-aligned: `margin-left: auto` on the track itself so it packs to the right of the strip

**Order within positive group (left to right):**
1. SignatureCounter (Frenzy / Radiance — the hero's signature slot leads the group)
2. Beneficial status chips (Shield, Protect, Regen) in application order
3. Buff chips (BuffDescriptors) in application order

**Order within negative group (left to right):**
1. Damage-over-time chips (Burn) — applied first
2. Control / handicap chips (Stun, Smouldering Stone) — applied after DoT
3. Opponent-applied sig-chips (Frost-bite, Cinder, Verdict) — most recent rightmost

**Valence background tint (CSS):**

Each chip in a positive group gets a faint green background overlay; each chip in a negative group gets a faint crimson background overlay. **The chip's element identity is preserved via icon color and border color** — only the background tint changes:

```css
.status-group.positive .sigChip,
.status-group.positive .statusChip,
.status-group.positive .signatureCounter {
  background: rgba(74, 140, 90, 0.22);
  box-shadow: 0 0 6px rgba(74, 140, 90, 0.4),
              inset 0 0 0 1px rgba(74, 140, 90, 0.25);
}

.status-group.negative .sigChip,
.status-group.negative .statusChip,
.status-group.negative .signatureCounter {
  background: rgba(196, 56, 72, 0.22);
  box-shadow: 0 0 6px rgba(196, 56, 72, 0.4),
              inset 0 0 0 1px rgba(196, 56, 72, 0.25);
}

/* Exception: a zero-count SignatureCounter stays muted even in the positive
   group — the chip is still YOUR signature slot, but visibly inactive */
.status-group.positive .signatureCounter.zero {
  background: rgba(20, 20, 40, 0.5);
  box-shadow: none;
  opacity: 0.55;
}
```

> **Why "valence from strip-owner's perspective" and not "valence from viewer's perspective".** Considered both. The strip-owner perspective produces a consistent visual grammar: red on any strip means "this is hurting whoever's strip it's on." When you (Berserker) apply Frostbite to your Pyromancer opponent, the chip lands on the Pyromancer's strip with a red/negative tint — which reads as "Pyromancer is being hurt by this" = good for you. Symmetric on your own strip: red chips on you = bad for you. The viewer-perspective alternative would flip the color on opponent chips to green ("these are MY damage tokens, good for me"), but that breaks the universal "red = bad for strip owner" reading. Strip-owner valence is the more readable convention.

**Overflow handling:**

If total items > `maxVisible` (default 5):
- Render the first (maxVisible - 1) items across both groups, preserving relative balance
- Append an overflow indicator: a small gold-bordered pill showing "+N" where N is the number of hidden items
- Overflow indicator dimensions: ~20×18px, same height as chips, gold border
- Overflow placement: rightmost in the negative group (typical case: lots of debuffs stacking up means many negatives), or rightmost in positive group if negatives don't overflow
- Tap overflow indicator: opens an expanded view modal (deferred — see Part 8)

**Animation when items enter/leave:**

- New chip slams in from offscreen-right (FLIP-style or Framer Motion `layoutId` works well) — animates into the appropriate valence group based on the new chip's valence classification
- Removed chip fades out in place
- Remaining chips smoothly reposition (250ms ease-out for shifts), including any chips that need to move across the group divider (rare — happens only if a chip's valence changes mid-match, e.g., a Buff with a "becomes negative when expired" mechanic — none in v1)
- Group divider fades in/out when transitioning between "single group" and "both groups" states

> **Migration note:** the prior `generics: GenericStatus[]` prop has been renamed to `statuses: StatusToken[]`. The `GenericStatus` type referenced the deprecated `GenericChip` component (Part 4.4 before its redesign). New code should use `StatusToken` with the new `StatusEffect` union. Additionally, the **StatusTrack now wraps chips in valence sub-groups internally** — the parent component just passes the flat lists (signatures, statuses, buffs, counters); the StatusTrack derives valence from each item's effect type and groups them at render time. The valence classification table above is the source of truth for this derivation.

### 4.7 Effect → component mapping reference

Quick lookup table for engineers: given an engine state's status type, which component to render?

| Engine state | Component | Props |
|-------------------|-----------|-------|
| `statuses[]: 'berserker:frostbite'` | `<SignatureChip kind="frostbite" />` | count from `stacks` |
| `statuses[]: 'pyromancer:cinder'` | `<SignatureChip kind="cinder" threshold={count >= 4} />` | count from `stacks`; detonates at 5 |
| `statuses[]: 'lightbearer:verdict'` | `<SignatureChip kind="verdict" />` | count from `stacks` |
| `signatureState.frenzy` | `<SignatureCounter kind="frenzy" count={...} bankCap={6} />` | rendered on Berserker's strip, even at 0 |
| `signatureState.radiance` | `<SignatureCounter kind="radiance" count={...} bankCap={6} />` | rendered on Lightbearer's strip; starts at 2 |
| `statuses[]: 'burn'` | `<StatusChip effect="burn" count={...} />` | |
| `statuses[]: 'stun'` | `<StatusChip effect="stun" />` | one-roll block, no count badge |
| `statuses[]: 'protect'` | `<StatusChip effect="protect" count={...} />` | |
| `statuses[]: 'shield'` | `<StatusChip effect="shield" count={...} />` | |
| `statuses[]: 'regen'` | `<StatusChip effect="regen" count={...} />` | |
| `statuses[]: 'pyromancer:defense-handicap-1'` | `<StatusChip effect="pyromancer:defense-handicap-1" />` | "Smouldering Stone"; max 1 |
| `pipelineBuffs[]` (e.g., Sanctuary) | `<BuffChip descriptor={...} />` | variant `defensive`; remaining from `discardOn` |
| `triggerBuffs[]` | `<BuffChip descriptor={...} />` | variant `beneficial` |
| `comboOverrides[]` / `symbolBends[]` | `<BuffChip descriptor={...} />` | variant `utility` |
| `abilityModifiers[]` (Masteries) | *(no track chip)* | rendered as ✦ on the ability row — Part 3.3 |

> **No `category` prop on StatusChip.** Valence (positive/negative) is derived inside the StatusTrack from each item's `effect` kind (or `kind` for signature chips, or `variant` for buff chips) — see Part 4.6 valence table for the canonical mapping. The chip itself doesn't carry category information; its appearance is driven by `effect` (which applies the right `.statusChip.<effect>` CSS rule), and its placement is computed by the track.

If the engine produces a status type not in this table, render a placeholder `<StatusChip effect="unknown" />` with a warning logged to console. New status types should be added to this table when the engine is extended.


---

## Part 5 — Field of Play & Resolution Components

The Field of Play (FOP) is the cinematic overlay that renders **inside the MiddleBand** during ability resolution. It is the single most important piece of UI motion in the game — it communicates what just happened. This part specifies the FOP container and its child components.

**Visual reference:** `design.html#p1-resolution` for the standard resolution; `design.html#p2-frostbite` for token-consuming resolution; `design.html#p2-cinder` for the detonation cinematic; `design.html#p3-multi` for multi-effect resolution.

### 5.1 FieldOfPlay container

```typescript
// ui/components/fop/FieldOfPlay/FieldOfPlay.tsx

export type FieldOfPlayProps = {
  active: boolean                          // Renders nothing when false
  scene: FOPScene
  phase: ResolutionPhase                   // From the resolution state machine
}

export type FOPScene =
  | { kind: 'ability', data: AbilityResolutionData }
  | { kind: 'detonation', data: DetonationData }
  | { kind: 'sub-event', data: SubEventData }
  | { kind: 'card-play', data: CardPlayData }
  | { kind: 'consume', data: ConsumeData }    // Frost-bite consumed, Verdict atoned, etc.

export type ResolutionPhase =
  | 'idle' | 'preconfirm' | 'fade-in' | 'name-in' | 'damage-in' | 'effects-in' | 'holding' | 'fade-out'

export type AbilityResolutionData = {
  abilityName: string
  damage: number | null              // null for non-damage abilities
  damageVariant: 'damage' | 'heal' | 'resource'   // For color coding
  effects: ResolutionEffect[]        // Multi-effect breakdown rows
  elementalTone: 'gold' | 'frost' | 'ember' | 'dawn'   // Overlay tint
}

export type ResolutionEffect = {
  kind: 'damage' | 'heal' | 'resource' | 'token'
  description: string                // "−5 HP · undefendable", "+1 Radiance", "+1 Verdict"
}

// Payload for the 'sub-event' FOPScene variant. Drives the UpkeepFOP (Part 5.3.5)
// for status ticks, card draws, CP gains, and deck shuffles — the lightweight
// turn-start beats. UpkeepFOPProps in Part 5.3.5 is the rendering-time shape;
// this SubEventData is what the engine writes into ResolvedEvent.scene.
export type SubEventData = {
  eventKind: 'status-tick' | 'draw' | 'cp-gain' | 'deck-shuffle'
  label: string                      // "Burn Ticks", "Draw", "+1 CP", "Deck Shuffled"
  value: number | string | null      // −2 for burn, +1 for cp; null for shuffle; string allowed for draw ("+")
  subtext?: string                   // Drawn card name for draws ("Brutal Strike")
  tone: 'ember' | 'green' | 'toxic-green' | 'gold' | 'frost' | 'crimson'
  affectedPlayer: PlayerId           // Whose strip the event lands on (for HP/CP/chip animation targeting)
  statusEntryId?: StatusEntryId      // For status-tick events: which StatusEntry ticked
}

// Payload for the 'card-play' FOPScene variant. Drives the CardPlayOverlay
// (Part 6.6.5) — the cinematic moment between a card being played and its
// effect resolving. The played card is rendered at large readable size with
// tone-matched overlay tinting.
export type CardPlayData = {
  card: Card                         // The full card data — see Part 1.9
  playedBy: PlayerId                 // Who played it (the viewer in MVP)
  tone: 'frost' | 'ember' | 'dawn' | 'gold'   // Overlay tint per card.category × hero element
}
```

**Container layout:**
- Position: absolute, anchored to `.screen` (the match container) with `inset: 16.5% 0 42.5% 0`
- **Coverage area:** spans from the top of the dice tray (16.5% from screen top) down through the entire middle band, ending at the top of the self strip (57.5% from screen top). **Both strips remain visible** above and below.
- z-index: 5 (above the ladder which is at default z-index)
- Display: flex, center-aligned
- Background overlay: radial gradient tinted by elemental tone (see table below)
- Overflow: hidden (for particle clipping)

**Elemental tone backgrounds:**

| Tone | Background |
|------|-----------|
| gold (default) | `radial-gradient(ellipse at center, rgba(240, 198, 104, 0.30) 0%, rgba(212, 165, 72, 0.10) 40%, transparent 80%)` |
| ember | `radial-gradient(ellipse at center, rgba(240, 104, 72, 0.35) 0%, rgba(200, 74, 42, 0.12) 40%, transparent 80%)` |
| frost | `radial-gradient(ellipse at center, rgba(108, 176, 232, 0.32) 0%, rgba(74, 140, 200, 0.10) 40%, transparent 80%)` |
| dawn | `radial-gradient(ellipse at center, rgba(253, 224, 136, 0.35) 0%, rgba(251, 191, 36, 0.12) 40%, transparent 80%)` |
| crimson (lethal) | `radial-gradient(ellipse at center, rgba(196, 56, 72, 0.40) 0%, rgba(138, 24, 40, 0.15) 40%, transparent 80%)` |
| detonation (Cinder) | `radial-gradient(ellipse at center, rgba(255, 200, 100, 0.5) 0%, rgba(240, 104, 72, 0.3) 30%, rgba(110, 32, 16, 0.15) 60%, transparent 90%)` |

A diagonal stripe overlay adds visual texture:

```css
.fopOverlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 28px,
    rgba(212, 165, 72, 0.04) 28px,
    rgba(212, 165, 72, 0.04) 30px
  );
  mix-blend-mode: overlay;
  pointer-events: none;
}
```

**Child composition:**

```jsx
<motion.div
  className={clsx(s.fopOverlay, s[`tone-${scene.data.elementalTone}`])}
  initial={{ opacity: 0 }}
  animate={{ opacity: active ? 1 : 0 }}
  transition={{ duration: 0.25, ease: EASING.default }}
>
  <ParticleField scene={scene} phase={phase} />
  <div className={s.fopContent}>
    {scene.kind === 'ability' && (
      <>
        <AbilityNameDisplay name={scene.data.abilityName} tone={scene.data.elementalTone} phase={phase} />
        {scene.data.damage !== null && (
          <DamageNumber
            value={scene.data.damage}
            variant={scene.data.damageVariant}
            phase={phase}
          />
        )}
        <EffectRows effects={scene.data.effects} phase={phase} />
      </>
    )}
    {scene.kind === 'detonation' && <DetonationContent data={scene.data} phase={phase} />}
    {scene.kind === 'sub-event' && <SubEventContent data={scene.data} phase={phase} />}
    {scene.kind === 'card-play' && <CardPlayContent data={scene.data} phase={phase} />}
    {scene.kind === 'consume' && <ConsumeContent data={scene.data} phase={phase} />}
  </div>
</motion.div>
```

**Acceptance criteria:**
1. When `active` is false, the component returns `null` (no DOM, no animation costs).
2. When `active` becomes true, the overlay fades in over 250ms. When `active` becomes false, fades out over 300ms.
3. The overlay does not block interactions during planning (when `active` is false). When active, it blocks all interaction with the ladder underneath via `pointer-events: auto` (children may override for specific tap targets).
4. The overlay is sized to exactly the MiddleBand's bounds, not the full screen. This is achieved via parent positioning (`position: absolute; inset: 0`) within the MiddleBand.

### 5.2 AbilityNameDisplay component

```typescript
// ui/components/fop/AbilityNameDisplay/AbilityNameDisplay.tsx

export type AbilityNameDisplayProps = {
  name: string
  tone: 'gold' | 'frost' | 'ember' | 'dawn' | 'crimson'
  phase: ResolutionPhase
}
```

**Visual:**
- Font: Cinzel 13px, 700 weight, 0.25em letter-spacing
- Color: based on tone (gold-bright for gold, ember-bright for ember, etc.)
- Text-shadow: `0 0 8px [matching color]`
- Text-transform: uppercase
- Margin-bottom: 8px (separates from damage number below)

**Phase-driven animation:**

| Phase | Visual state |
|-------|--------------|
| idle, preconfirm, fade-in | opacity 0 |
| name-in | opacity transitions 0 → 1 over 200ms |
| damage-in, effects-in, holding | opacity 1 |
| fade-out | opacity transitions 1 → 0 over 200ms |

Implement via Framer Motion:
```jsx
<motion.div
  className={s.name}
  animate={{
    opacity: ['idle', 'preconfirm', 'fade-in'].includes(phase) ? 0 :
             phase === 'fade-out' ? 0 : 1,
  }}
  transition={{ duration: 0.2, ease: EASING.default }}
>
  {name}
</motion.div>
```

### 5.3 DamageNumber component

The biggest visual element on the screen during resolution. Demands attention with size and motion.

```typescript
// ui/components/fop/DamageNumber/DamageNumber.tsx

export type DamageNumberProps = {
  value: number
  variant: DamageNumberVariant
  phase: ResolutionPhase
  size?: 'standard' | 'small' | 'ultimate'    // Defaults to 'standard'
}

export type DamageNumberVariant =
  | 'damage'        // Standard normal-type damage
  | 'undefendable'  // Damage type 'undefendable' — bypasses defenses (was "unblockable" in older drafts)
  | 'pure'          // Damage type 'pure' — bypasses ALL reduction (Shield, Protect, Sanctuary)
  | 'collateral'    // Damage type 'collateral' — splash damage from another ability
  | 'heal'          // Heal floater
  | 'resource'      // CP/Radiance/banked-counter floater
  | 'ultimate'      // Ultimate cinematic damage (large, dramatic)
  | 'crimson'       // Lethal/death-blow damage (UI-computed kill preview, see Part 3.1)
```

**Visual specifications by variant:**

| Variant | Color | Text-shadow |
|---------|-------|-------------|
| damage | `var(--ember-bright)` | `0 0 24px rgba(240, 104, 72, 0.7), 0 4px 8px rgba(0,0,0,0.7)` |
| undefendable | `var(--bone-bright)` (white) | `0 0 24px rgba(240, 232, 200, 0.85), 0 0 8px rgba(240, 104, 72, 0.5), 0 4px 8px rgba(0,0,0,0.7)` |
| pure | `#B89FE0` (violet-pure) | `0 0 28px rgba(184, 159, 224, 0.9), 0 4px 8px rgba(0,0,0,0.7)` |
| collateral | `var(--ember-dim)` | `0 0 16px rgba(192, 80, 56, 0.5), 0 4px 8px rgba(0,0,0,0.7)` |
| heal | `var(--frost-bright)` | `0 0 24px rgba(108, 176, 232, 0.7), 0 4px 8px rgba(0,0,0,0.7)` |
| resource | `var(--dawn-bright)` | `0 0 24px rgba(253, 224, 136, 0.8), 0 4px 8px rgba(0,0,0,0.7)` |
| ultimate | `var(--ember-bright)` (or hero-tinted) | `0 0 30px rgba(240, 104, 72, 0.9), 0 4px 12px rgba(0,0,0,0.7)` |
| crimson | `var(--crimson-bright)` | `0 0 28px rgba(196, 56, 72, 0.9), 0 4px 8px rgba(0,0,0,0.7)` |

> **Engine damage-type mapping.** Engine's `DamageType` union is `'normal' | 'undefendable' | 'pure' | 'collateral' | 'ultimate'`. The UI maps these 1:1 to variants above (with `normal` → `'damage'`). The `crimson` variant is UI-only — it overrides the underlying damage-type styling when the UI computes that the hit is lethal (`incoming >= opp.hp`, per Part 3.1 / Decision 4). See Part 5.6 for the "lethal pulse" visual treatment that pairs with crimson DamageNumbers.

**Size by `size` prop:**

| Size | Font-size | Use case |
|------|-----------|----------|
| standard | 56px | Standard ability resolution |
| small | 18px | Status tick damage (e.g., Burn at upkeep) |
| ultimate | 84px | Ultimate cinematic damage |

Also:
- Font-family: Cinzel
- Font-weight: 800 (or 900 for ultimate)
- Letter-spacing: 0.05em
- Line-height: 0.9
- Margin-bottom: 6px

**Entry animation:**

For `phase === 'damage-in'`, the number scales in with overshoot easing:

```jsx
<motion.div
  className={s.damage}
  initial={{ scale: 0, opacity: 0 }}
  animate={{
    scale: ['idle', 'preconfirm', 'fade-in', 'name-in'].includes(phase) ? 0 :
           phase === 'fade-out' ? 0 : 1,
    opacity: ['idle', 'preconfirm', 'fade-in', 'name-in'].includes(phase) ? 0 :
             phase === 'fade-out' ? 0 : 1,
  }}
  transition={{
    duration: 0.2,
    ease: phase === 'damage-in' ? EASING.overshoot : EASING.default,
  }}
>
  {value}
</motion.div>
```

The overshoot ease (`cubic-bezier(0.34, 1.56, 0.64, 1)`) makes the number scale to 1.1× then settle at 1.0×, creating a punch effect.

**Exit animation:**

During `fade-out`, the number scales down to 0.5 and drifts upward by 12px while fading:

```jsx
animate={{
  scale: phase === 'fade-out' ? 0.5 : 1,
  y: phase === 'fade-out' ? -12 : 0,
  opacity: phase === 'fade-out' ? 0 : 1,
}}
transition={{ duration: 0.3, ease: EASING.accelerate }}
```

**Reduced motion:**

Under `prefers-reduced-motion`, replace scale entry with simple opacity fade and disable the upward drift on exit:

```css
@media (prefers-reduced-motion: reduce) {
  .damage {
    animation: none;
    transform: scale(1) !important;
  }
}
```

**Acceptance criteria:**
1. Number renders at the specified size variant with no flicker on initial render.
2. Overshoot animation is visually noticeable (scale exceeds 1.0 at peak) but not extreme (peak shouldn't exceed 1.15).
3. When value is 0, the component renders "0" but typically the parent should not render the DamageNumber at all in zero-damage cases (use the `damage` field's `null` value to skip rendering).

### 5.3.5 UpkeepFOP variant

A lightweight FOP variant used for turn-start sequence events (status ticks, card draws, CP gains). Rendered in the same middle-band region as full ability resolutions, but tuned for events that fire many times per match.

**Visual reference:** `design.html#p2-burn` shows a Burn tick using upkeep FOP. `design.html#p2-upkeep-sequence` shows all three event types (status tick / draw / CP gain) as a 5-frame timeline.

```typescript
// ui/components/fop/UpkeepFOP/UpkeepFOP.tsx

export type UpkeepFOPProps = {
  active: boolean
  eventKind: 'status-tick' | 'draw' | 'cp-gain' | 'deck-shuffle'
  label: string                // "Burn Ticks", "Draw", "+1 CP", "Deck Shuffled"
  value: number | string | null  // −2 for burn, +1 for cp; null for shuffle
  subtext?: string             // Optional — card name for draws ("Brutal Strike")
  tone: 'ember' | 'green' | 'toxic-green' | 'gold' | 'frost' | 'crimson'
  onComplete?: () => void
}
```

**Distinction from full FOP:**

| Property | Full FOP cinematic | UpkeepFOP variant |
|----------|--------------------|--------------------|
| Backdrop intensity | Strong radial gradient + particles | Soft radial gradient, no particles |
| Damage/value font size | 56–84px Cinzel | 38px Cinzel |
| Label font size | 13px Cinzel (ability name) | 11px Cinzel (event label) |
| Beat duration | 1500–2000ms | ~700ms |
| Ability ladder behind | Dimmed to opacity 0.10 | Dimmed to opacity 0.10 (same) |
| Used for | Ability resolutions, ultimates, lethal hits, signature detonations | Status ticks, draws, CP gains |

**Visual structure:**

```jsx
<div className={`${s.fopOverlay} ${s.upkeep} ${s[tone]}`}>
  <div className={s.fopContent}>
    <div className={`${s.fopUpkeepLabel} ${s[tone]}`}>{label}</div>
    <div className={`${s.fopValue} ${s.upkeep} ${s[tone]}`}>{value}</div>
    {subtext && <div className={s.fopUpkeepSubtext}>{subtext}</div>}
  </div>
</div>
```

**Tone variants:**

| Tone | Use case | Color tokens |
|------|----------|--------------|
| `ember` | Burn ticks, fire damage | `--ember-bright` text, `rgba(240, 104, 72, 0.22)` backdrop |
| `green` | Regen healing | `--green-bright` text, `rgba(74, 140, 90, 0.22)` backdrop |
| `toxic-green` | Poison ticks | `--toxic-green-bright` text, `rgba(110, 200, 84, 0.22)` backdrop |
| `gold` | Card draws, CP gains | `--gold-bright` text, `rgba(212, 165, 72, 0.22)` backdrop |
| `frost` | Frost-bite related ticks (if applicable) | `--frost-bright` text, `rgba(108, 176, 232, 0.22)` backdrop |
| `crimson` | Wound/Bleed ticks | `--crimson-bright` text, `rgba(196, 56, 72, 0.22)` backdrop |

**Subtext for card draws:**

When `eventKind === 'draw'`, the `subtext` field carries the drawn card's name, rendered below the value in Cormorant Garamond italic 13px:

```
   DRAW            ← 11px Cinzel uppercase, gold-bright
    +              ← 38px Cinzel, gold-bright (no value, just symbol)
Brutal Strike      ← 13px Cormorant Garamond italic, bone
```

Note: for draws, the "value" field is typically just `"+"` or empty — the card name in subtext is the real payload.

**Animation:**

Total ~700ms beat:
1. **0–150ms** — overlay fades in (`opacity 0 → 1`, `ease-out`), label fades in first
2. **150–250ms** — value pops in with scale animation (`scale: 0.7 → 1.05 → 1.0`)
3. **250–600ms** — held visible
4. **600–700ms** — overlay fades out (`opacity 1 → 0`, `ease-in`), value scales down (`scale: 1.0 → 0.95`)

```jsx
<motion.div
  className={s.fopValue}
  initial={{ opacity: 0, scale: 0.7 }}
  animate={{
    opacity: [0, 1, 1, 0],
    scale: [0.7, 1.05, 1.0, 0.95],
  }}
  transition={{
    duration: 0.7,
    times: [0, 0.21, 0.86, 1],
    ease: 'easeOut',
  }}
  onAnimationComplete={onComplete}
>
  {value}
</motion.div>
```

**Acceptance criteria:**

1. UpkeepFOP renders in the same middle-band region as the full FieldOfPlay component, with `inset: 0` relative to the band.
2. Label, value, and subtext (when present) are vertically stacked, center-aligned.
3. Value scales from 0.7 to 1.05 (slight overshoot) on appearance to feel snappy without being aggressive.
4. The component completes its 700ms cycle and calls `onComplete` so the parent (turn-start sequence orchestrator) can advance to the next beat.
5. Reduced-motion mode replaces the scale animation with a simple opacity fade (0 → 1 → 0 over 700ms, no scale changes).
6. If multiple UpkeepFOP events fire in sequence (e.g., 3 status ticks), each instance is a fresh mount — no animation overlap. The parent sequencer waits for `onComplete` before mounting the next.
7. Ability ladder behind the UpkeepFOP is dimmed to opacity 0.10 (same as full FOP grammar) for the duration of the beat.

### 5.4 EffectRows component

For multi-effect abilities (damage + status + resource), this component renders breakdown rows below the damage number.

**Visual reference:** `design.html#p3-multi` shows the three-row breakdown for Sun Strike.

```typescript
// ui/components/fop/EffectRows/EffectRows.tsx

export type EffectRowsProps = {
  effects: ResolutionEffect[]
  phase: ResolutionPhase
}
```

**Layout:**
- Flex column, 4px gap, center-aligned
- Margin-top: 10px (separates from damage number)

**Each row** (`<EffectRow>`):

```typescript
type EffectRowProps = {
  effect: ResolutionEffect
  staggerIndex: number
  phase: ResolutionPhase
}
```

Row layout:
- Flex row, 6px gap, center-aligned
- Font: JetBrains Mono 10px, 600 weight, 0.1em letter-spacing
- Text-transform: uppercase
- Marker (12×12 square, rounded 2px) on the left
- Description text on the right

**Marker color by effect kind:**

| Kind | Marker color | Text color |
|------|--------------|------------|
| damage | `var(--ember-bright)` | `var(--ember-bright)` |
| heal | `var(--green-bright)` | `var(--green-bright)` |
| resource | `var(--dawn-bright)` | `var(--dawn-bright)` |
| token | `var(--gold-bright)` | `var(--gold-bright)` |

Marker box-shadow: `0 0 4px [matching color]`

**Stagger animation:**

Rows fade in with a stagger of 100ms each, starting at the beginning of the `effects-in` phase:

```jsx
<motion.div
  className={s.effectRow}
  initial={{ opacity: 0, x: -8 }}
  animate={{
    opacity: phase === 'idle' || phase === 'fade-out' ? 0 : 1,
    x: phase === 'idle' ? -8 : 0,
  }}
  transition={{
    duration: 0.2,
    ease: EASING.decelerate,
    delay: staggerIndex * 0.1,
  }}
>
  <div className={s.marker} />
  <span>{effect.description}</span>
</motion.div>
```

**Marker pulse on entry:** When a row first appears, its marker briefly pulses (scale 1.0 → 1.3 → 1.0 over 200ms) to draw attention. Implement via separate Framer Motion on the marker:

```jsx
<motion.div
  className={s.marker}
  initial={{ scale: 0 }}
  animate={{ scale: phase === 'idle' ? 0 : [0, 1.3, 1] }}
  transition={{ duration: 0.3, delay: staggerIndex * 0.1, times: [0, 0.6, 1] }}
/>
```

**Acceptance criteria:**
1. Rows render in the order given by the `effects` array.
2. Stagger is consistent: row 0 appears at delay 0ms, row 1 at 100ms, row 2 at 200ms, etc.
3. Under reduced motion, all rows appear simultaneously without stagger (delays set to 0).
4. Maximum sensible row count: 5. If more effects exist, log a warning; visual breaks down beyond 5 due to vertical space.

### 5.5 ParticleField component

Ambient particles that drift across the FOP during resolution. Visual flavor, not functional.

```typescript
// ui/components/fop/ParticleField/ParticleField.tsx

export type ParticleFieldProps = {
  scene: FOPScene
  phase: ResolutionPhase
  density?: 'low' | 'standard' | 'high' | 'burst'
}
```

**Particle generation:**

The component generates a fixed set of particles when `active` (phase !== 'idle' && phase !== 'fade-out'). Particles do NOT animate per-frame — they're CSS animations on randomly-positioned elements that drift up and fade.

Number of particles by density:
- low: 4
- standard: 8 (default for most resolutions)
- high: 12 (boss-tier moments)
- burst: 16 (Cinder detonation, ultimate cinematic)

**Particle visual:**
- Size: 3-7px (random within range)
- Background: matches scene's elemental tone (gold, ember, frost, dawn, crimson)
- Border-radius: 50% (round)
- Box-shadow: `0 0 4px currentColor`
- Position: absolute, randomly placed within the FOP bounds
- Opacity: 0.5–1.0 (random within range)
- Animation: `particle-drift` 1500ms ease-out infinite, with `animation-delay` randomly distributed

**Hard cap:** maximum 16 particles simultaneously rendered, regardless of density. Performance constraint.

**Reduced motion:** ParticleField returns `null` entirely. Particles are pure decoration.

**Acceptance criteria:**
1. Particles use `transform` and `opacity` only — never `top`/`left` keyframes.
2. Each particle has a fixed random seed for its position and animation delay, so it doesn't re-randomize on re-render.
3. Component cleans up animation when `phase` enters 'fade-out' — particles fade in coordination with the parent overlay.
4. Particle field is `pointer-events: none`.

### 5.6 ConsumeContent component

For scenes where signature tokens are consumed (Frost-bite into bonus damage, Verdict via atone). Replaces a prior math-text breakdown with a **consumption-row visualization**: the consumed tokens are displayed prominently at full identity above the damage number, with a clean equation caption below explaining the conversion.

**Visual reference:** `design.html#p2-frostbite` shows three Frost-bite chips consumed; `design.html#p2-cinder` shows the same layout pattern applied to Cinder detonation (Part 5.7).

```typescript
// ui/components/fop/ConsumeContent/ConsumeContent.tsx

export type ConsumeContentProps = {
  data: ConsumeData
  phase: ResolutionPhase
}

export type ConsumeData = {
  abilityName: string
  baseValue: number                  // The ability's base damage before bonuses
  consumed: ConsumedToken[]          // The tokens being consumed (one entry per stack)
  bonusPerToken: number              // e.g., +1 damage per Frost-bite
  finalValue: number                 // Total after bonus
  resultLabel: string                // "damage", "AoE damage", "Verdict cleared", etc.
  variant: 'damage-add' | 'token-clear'  // damage-add: Frost-bite style. token-clear: Verdict atone style.
}

export type ConsumedToken = {
  kind: 'frostbite' | 'cinder' | 'verdict'
  // No count — each entry represents one consumed stack
}
```

**Layout — three vertical bands:**

```
            ABILITY NAME          ← small Cinzel caps, gold
            
       [token] [token] [token]    ← consumption row (consumed tokens, full identity)
                ↓                  ← arrow pointing down to result
              ┌───┐
              │ 7 │                ← damage number, primary focal point
              └───┘
       
       Frost-bite ×3 → +3 damage  ← equation caption (JetBrains Mono)
```

```jsx
<div className={s.consumeContent}>
  <AbilityNameDisplay name={data.abilityName} tone="frost" phase={phase} />
  <div className={s.consumptionRow}>
    {data.consumed.map((token, i) => (
      <ConsumedToken kind={token.kind} key={i} />
    ))}
  </div>
  <div className={s.arrow}>↓</div>
  <DamageNumber value={data.finalValue} variant="damage" tone="frost" phase={phase} />
  <div className={s.caption}>
    <span className={s.tokenName}>{tokenLabel(data.consumed[0].kind)} ×{data.consumed.length}</span>
    <span className={s.arrowGlyph}>→</span>
    <span className={s.gain}>+{data.consumed.length * data.bonusPerToken} {data.resultLabel}</span>
  </div>
</div>
```

**ConsumedToken visual (the chip rendered in the consumption row):**

- Size: 24×24px (slightly larger than the 22×22 StatusChip — these are the dramatic focal points of the resolution scene)
- Border-radius: 4px
- Each kind retains its full visual identity (color, glyph) — these are NOT generic grey boxes
- **Variant-specific treatment:**
  - `frostbite` — frost-blue background, 1.5px frost-bright border, opacity 0.7 with a horizontal strikethrough line through the middle (indicating "absorbed/consumed")
  - `verdict` — dawn-gold background, 1.5px dawn border, opacity 0.7 with a strikethrough (same visual language as frostbite, different color). Used by the Atone flow (Verdict cleared via −1 CP).
  - `cinder` — see DetonationContent (Part 5.7); cinder gets a radial-burst treatment instead of strikethrough

**Strikethrough implementation:**

```css
.consumedToken::after {
  content: '';
  position: absolute;
  left: -3px; right: -3px;
  top: 50%;
  height: 1.5px;
  background: currentColor;  /* Inherits from the token's color (frost-bright, dawn-bright, etc.) */
  box-shadow: 0 0 4px currentColor;
  transform: translateY(-50%);
}
```

The strikethrough extends slightly beyond the token's edges (`left: -3px; right: -3px`) so it's clearly a "cancellation mark" rather than a decorative line. The glow reinforces it as intentional.

**Equation caption styling:**

```css
.caption {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.12em;
  display: flex;
  gap: 6px;
  justify-content: center;
}
.caption .tokenName { color: var(--frost-bright); font-weight: 700; }
.caption .arrowGlyph { color: var(--gold); font-weight: 700; }
.caption .gain { color: var(--bone-bright); font-weight: 700; }
```

The caption is **the equation, not a math sentence.** "Frost-bite ×3 → +3 damage" reads as a state transformation: "this many of this thing became this much of that thing." Avoids the prior "4 base + 1 + 1 + 1 = 7" format which forced the player to do arithmetic.

**Acceptance criteria:**

1. Consumption row renders one ConsumedToken per entry in `data.consumed`. Each token shows the kind's glyph at full identity (❄ for frost-bite, 🔥 for cinder, ✦ for verdict — to be replaced with SVG icons in production).
2. Each consumed token has its kind-specific visual treatment (frostbite/verdict strikethrough; cinder radial burst — see 5.7).
3. The damage number renders below the consumption row with a small arrow (↓) connecting them.
4. The equation caption below the damage number reads as "TokenName ×N → +M label". No arithmetic breakdown.
5. **No ambient particles in the consumption scene.** The consumed tokens are the visual; particles would compete for attention. (Particles remain valid for ordinary damage scenes that don't involve consumption.)
6. The entry animation: consumption row fades in from below over 250ms, then arrow fades, then damage number renders, then caption appears — staggered by ~150ms each.

### 5.7 DetonationContent component

For Cinder detonation specifically. **Uses the same layout pattern as ConsumeContent (Part 5.6)** — the consumption row is the primary visual, with the equation caption below. The visual differences from frostbite/verdict consumption are stylistic, not structural: instead of the strikethrough indicating "absorbed," Cinder tokens get a **radial-burst treatment** indicating "exploded outward."

**Visual reference:** `design.html#p2-cinder` shows the detonation moment.

```typescript
// ui/components/fop/DetonationContent/DetonationContent.tsx

export type DetonationContentProps = {
  data: DetonationData
  phase: ResolutionPhase
}

export type DetonationData = {
  triggerKind: 'cinder'              // Extensible for future detonating tokens
  damage: number                     // 8 for Cinder (undefendable)
  stacksConsumed: number             // Always 5 for Cinder (detonation threshold)
  aoe: boolean                       // Almost always true for detonations
}
```

**Layout — identical structure to ConsumeContent:**

```
            — DETONATION —          ← em-dash-bracketed label (ceremonial)
       
       [token] [token] [token] [token] [token]   ← 5 Cinder chips, bursting
                       ↓
                    ┌─────┐
                    │  8  │
                    └─────┘
       
            Cinder ×5 → 8 AoE damage     ← equation caption (detonation variant)
```

```jsx
<div className={s.detonationContent}>
  <AbilityNameDisplay name="— Detonation —" tone="ember" phase={phase} />
  <div className={s.consumptionRow}>
    {Array.from({ length: data.stacksConsumed }, (_, i) => (
      <ConsumedToken kind="cinder" key={i} />
    ))}
  </div>
  <div className={s.arrow}>↓</div>
  <DamageNumber value={data.damage} variant="damage" tone="ember" phase={phase} />
  <div className={clsx(s.caption, s.detonation)}>
    <span className={s.tokenName}>Cinder ×{data.stacksConsumed}</span>
    <span className={s.arrowGlyph}>→</span>
    <span className={s.gain}>{data.damage} {data.aoe ? 'AoE' : ''} damage</span>
  </div>
</div>
```

**Cinder token detonation visual:**

Unlike frostbite/verdict (strikethrough), Cinder tokens render with **radial burst lines** emanating from each chip's perimeter, communicating the explosive outward motion:

```css
.consumedToken.cinder {
  background: linear-gradient(180deg, rgba(240, 104, 72, 0.55), rgba(200, 74, 42, 0.3));
  border: 1.5px solid var(--dawn-bright);
  color: var(--dawn-bright);
  box-shadow: 0 0 8px rgba(240, 104, 72, 0.7), 0 0 16px rgba(240, 104, 72, 0.35);
}
/* Vertical burst lines above and below the chip */
.consumedToken.cinder::before {
  content: '';
  position: absolute;
  top: -10px; left: 50%;
  width: 2px; height: 8px;
  background: linear-gradient(180deg, var(--dawn-bright), transparent);
  transform: translateX(-50%);
}
.consumedToken.cinder::after {
  /* Same but pointing down */
}
```

For the static documentation mockup, the burst lines are constant. **In production this is the "peak frame" of a multi-frame animation:** the cinder chips begin at rest (matching their normal opponent-strip state), accumulate fuse-fill over the prior turns, flash bright at detonation, and burst outward with full radial lines for one frame before fading. Engineers should implement this as a CSS keyframe sequence; see `@keyframes cinder-burst` (to be authored).

**Caption variant for detonation:**

```css
.caption.detonation .tokenName { color: var(--dawn-bright); font-weight: 700; }
.caption.detonation .gain { color: var(--ember-bright); font-weight: 700; }
```

Note the color shift: in detonation, the token name uses dawn-gold (the trigger color) and the gain uses ember (the damage color). This communicates "the dawn-gold thing turned into ember-orange damage."

**Acceptance criteria:**

1. Renders exactly `data.stacksConsumed` consumed-token chips in the consumption row (5 for Cinder, matching the detonation threshold).
2. Each chip uses the cinder variant of `ConsumedToken` with radial burst lines.
3. The ability label is em-dash-bracketed ("— Detonation —") for ceremonial emphasis. This treatment is reserved for detonation events — no other ability label uses em-dashes.
4. Caption reads "Cinder ×N → M AoE damage" in detonation-variant coloring (token name in dawn, gain in ember).
5. **No ambient particles.** Same rationale as ConsumeContent: the burst-rendered tokens are the visual story; particles would compete for attention and dilute the "this is the explosion" read.
6. The detonation choreography (stack → fuse → flash → burst) is a multi-frame animation sequence; the static mockup represents the peak burst frame.

### 5.8 UltimateTakeover component

When a T4 ultimate fires, the entire screen takes over with a hero portrait, bark line, and oversized damage number. **This is NOT a FOP overlay** — it's a full-screen modal.

**Visual reference:** `design.html#p1-ultimate` shows the takeover.

```typescript
// ui/components/fop/UltimateTakeover/UltimateTakeover.tsx

export type UltimateTakeoverProps = {
  active: boolean
  data: UltimateTakeoverData
}

export type UltimateTakeoverData = {
  heroId: HeroId
  ultimateName: string                // "Judgment of the Sun", "Wolf's Howl", "Pyric Sentence"
  tierLabel: string                   // "T4 · Ultimate"
  bark: string                        // "By the light.", "For the pack.", etc.
  damage: number
  heroPortraitAsset: string           // Image asset path for hero
}
```

**Layout (full-screen, occupies entire ScreenBands container):**

- Position: absolute, inset: 0
- Background: `radial-gradient(ellipse at 50% 40%, rgba(251, 191, 36, 0.5) 0%, rgba(212, 165, 72, 0.15) 25%, rgba(0,0,0,0.96) 70%), linear-gradient(180deg, #1a1408 0%, #050510 100%)`
- z-index: 100 (above everything)
- Flex column, center-aligned

**Decorative ray overlay:**

```css
.ultTakeover::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(45deg, transparent, transparent 32px, rgba(251, 191, 36, 0.05) 32px, rgba(251, 191, 36, 0.05) 33px),
    radial-gradient(circle at 50% 30%, rgba(251, 191, 36, 0.2), transparent 60%);
  pointer-events: none;
}
```

**Children, top to bottom:**

1. **Hero portrait** — 160×200px image with gold border (3px), inner glow, and large outer glow rings. The portrait uses the hero's signature pose/art asset. Border-radius: 12px.
2. **Ultimate name** — Cinzel 26px, 800 weight, 0.18em letter-spacing, color `var(--dawn-bright)`, with heavy glow. Uppercase.
3. **Tier label** — Cinzel 11px, 0.5em letter-spacing, `var(--bone)`. Uppercase. "T4 · Ultimate"
4. **Bark line** — Cormorant Garamond italic 18px, color `var(--bone-bright)`, max-width 80%, centered. Wrapped in gold-bright quotation marks (`"` / `"`).
5. **Damage number** — Cinzel 84px, 900 weight, color `var(--ember-bright)` (or hero-tinted), massive glow.

**Animation sequence** (total duration ~3500ms):

| Time | Event |
|------|-------|
| 0ms | Component mounts (`active` becomes true). Background fades in over 400ms. |
| 100ms | Hero portrait scales in from 0.5 to 1.0 with overshoot ease (200ms). |
| 300ms | Ultimate name fades in (200ms). |
| 500ms | Tier label fades in (150ms). |
| 800ms | Bark line fades in + slides up 8px (200ms). |
| 1200ms | Damage number scales in with overshoot ease (250ms). Impact sound triggers. |
| 1500ms | Hold begins. Everything visible. |
| 2900ms | Hold ends (1400ms hold). |
| 2900ms | All elements fade out (400ms). |
| 3300ms | Component unmounts (`active` becomes false). |

**Hero bark per hero:**

| Hero | Ultimate name | Bark options (rotates) |
|------|---------------|------------------------|
| Berserker | Wolf's Howl | "For the pack." / "Cold ground." / "End of all things." |
| Pyromancer | Conflagration | "Burn all of it." / "Ash to ash." / "Light the world." |
| Lightbearer | Judgment | "By the light." / "The dawn keeps." / "Verdict given." |

These bark strings live in `ui/content/heroBarks.ts` and rotate per match to avoid repetition.

**Acceptance criteria:**
1. The takeover blocks all input during its duration (~3500ms). The action bar and ladder beneath are not interactable.
2. Audio cue (hero-specific ultimate sound) triggers at the 1200ms mark, synchronized to damage number entry.
3. After 3300ms total, the takeover fades and the underlying MatchScreen resumes — typically the engine will have already advanced to either the next turn or the match summary (if the ultimate was a finisher).
4. If `active` becomes false before the animation completes (rare — e.g., a network disconnect), the takeover instantly hides without animation.

### 5.9 FloatingDamageNumber component

A small floating number that rises from a portrait orb. **Use is rare in v1** — the upkeep events that previously used this component (Burn ticks, Poison ticks, Regen heals, CP gains during upkeep) now use the lightweight **upkeep FOP variant** (see Part 5.3.5 and Part 7.5 turn-start sequence). FloatingDamageNumber is reserved for ambient state changes that don't deserve middle-band attention.

**Where it's still appropriate:**

- Ambient buffs that don't fire on a dedicated phase (e.g., an aura effect tickling HP between turns — not in v1, but possible future content)
- Reactive damage from a card's `OnTrigger` clause that fires mid-resolution (when the FOP is already occupied with the primary effect)
- Damage shared across multiple targets where each target gets a small number over its own portrait simultaneously

**Where NOT to use it:**

- Status ticks during upkeep (Burn/Poison/Regen) — use upkeep FOP instead
- Card draw indicators — use upkeep FOP instead
- CP gain during upkeep — use upkeep FOP instead
- Ability resolution damage — use full FOP cinematic instead

**Visual reference:** No current scenes use this — the legacy `design.html#p2-burn` reference is now an example of the upkeep FOP, NOT the FloatingDamageNumber.

```typescript
// ui/components/fop/FloatingDamageNumber/FloatingDamageNumber.tsx

export type FloatingDamageNumberProps = {
  value: number
  playerId: PlayerId           // Which player's portrait it floats above
  variant: 'damage' | 'heal' | 'resource'
  onComplete?: () => void
}
```

**Visual:**
- Position: absolute, anchored above the portrait orb (top: -22px, horizontally centered)
- Font: Cinzel 18px, 800 weight, 0.02em letter-spacing
- Color: variant-based (ember for damage, frost for heal, dawn for resource)
- Text-shadow: glow + drop shadow for readability

**Animation:**

The number animates from `y: 0; opacity: 1; scale: 1` to `y: -16; opacity: 0; scale: 0.8` over 700ms total, with a brief held-visible window:

```jsx
<motion.div
  className={s.floating}
  initial={{ y: 0, opacity: 0, scale: 0.5 }}
  animate={{
    y: [0, -8, -16],
    opacity: [0, 1, 0],
    scale: [0.5, 1, 0.8],
  }}
  transition={{
    duration: 0.7,
    times: [0, 0.3, 1],
    ease: EASING.default,
  }}
  onAnimationComplete={onComplete}
>
  {variant === 'heal' || variant === 'resource' ? '+' : '−'}{Math.abs(value)}
</motion.div>
```

**Acceptance criteria:**
1. The number is positioned relative to the parent (PortraitOrb), not the screen.
2. When animation completes, the `onComplete` callback fires, allowing the parent to remove the component from the DOM.
3. Multiple floating numbers can stack — if two damage events happen close in time, they should not overlap visually. Parent component manages a queue or staggers them horizontally.

### 5.10 Resolution choreography integration

The FieldOfPlay is driven by the **resolution state machine** in `uiStore`. The state machine emits phase transitions; the FOP and its children react to them.

Pseudo-flow:

```typescript
// Inside uiStore.ts (sketch)

function startResolution(scene: FOPScene) {
  const startTime = performance.now()
  set({
    activeOverlay: scene.kind === 'ultimate' ? 'ultimate' : 'fop',
    resolutionPhase: 'preconfirm',
    fopScene: scene,
    resolutionStartedAt: startTime,
  })

  // Phase advancement scheduled
  setTimeout(() => set({ resolutionPhase: 'fade-in' }), 100)
  setTimeout(() => set({ resolutionPhase: 'name-in' }), 250)
  setTimeout(() => set({ resolutionPhase: 'damage-in' }), 450)
  setTimeout(() => set({ resolutionPhase: 'effects-in' }), 700)
  setTimeout(() => set({ resolutionPhase: 'holding' }), 1000)
  setTimeout(() => set({ resolutionPhase: 'fade-out' }), 1400)
  setTimeout(() => {
    set({
      resolutionPhase: 'idle',
      activeOverlay: 'none',
      fopScene: null,
    })
  }, 2000)
}
```

For ultimates, the same pattern but with different timings (sum to ~3500ms). For consume scenes, slightly compressed (~1800ms total since there's no damage number scaling — the bonus row is the focal element).

**Engineering note:** `setTimeout` chains are acceptable for the state machine but each timeout's `clear` callback must be tracked so an interrupted resolution (rare — e.g., player closes app) doesn't leave dangling timeouts. Implement with `AbortController` or a single timer manager.


---

## Part 6 — Modal Overlay Components

This part specifies the overlay surfaces that interrupt the band layout — full-screen modals that block input, transient overlays that animate over the field of play, and ambient non-blocking surfaces. They fall into four categories:

1. **Blocking decision modals** — pause the match flow and require input before continuing:
   - **DefensiveOverlay** (Part 6.1) — picker for choosing how to defend against incoming damage
   - **SpendOverlay** (Part 6.2) — prompt for spending Radiance (or future resource pools)
   - **ExpandedAbilityView** (Part 6.7) — modal opened by tapping an ability row; gates the Activate commit
   - **ExpandedCardView** (Part 6.6) — modal opened by tapping a card; gates the Play commit
2. **Transient overlays** — animate over the match without blocking input long enough to require dismissal:
   - **CardPlayOverlay** (Part 6.6.5) — cinematic card-play moment between Play tap and resolution
3. **Ambient surfaces** — non-blocking informational layers:
   - **TooltipRenderer** (Part 6.3) — long-press informational tooltips
   - **ToastQueue** (Part 6.5) — transient bottom-anchored notifications
   - **ActivityLog** (Part 6.5.5) — scrollable history view, accessed from the in-match menu
4. **Stacking discipline** — rules governing what can open over what (Part 6.4)

The **UltimateTakeover** (Part 5.8) is also modal-like but is sufficiently different that it lives with the FOP components — it is the ultimate's cinematic, not a player-prompt surface.

### 6.1 DefensiveOverlay component

**Visual reference:** `design.html#p3-defensive` and `design.html#p1-defensive`.

```typescript
// ui/components/overlays/DefensiveOverlay/DefensiveOverlay.tsx

export type DefensiveOverlayProps = {
  active: boolean
  data: DefensiveOverlayData
  onSelect: (defenseId: string) => void
  onConfirm: () => void
}

export type DefensiveOverlayData = {
  incoming: {
    damage: number
    sourceLabel: string              // "Firestorm · ub · +2 Cinder"
  }
  options: DefensiveOption[]         // From Part 3
  selectedId?: string
  // No `recommendedId` field — defense rows render with equal visual weight;
  // the player evaluates the trade-offs and chooses without engine highlighting.
}
```

**Container layout:**

The overlay is a **direct child of `<ScreenBands>`** (not nested inside MiddleBand), so it can span multiple bands. It covers the dice tray, middle band (ability ladder), and self strip — but **explicitly leaves the hand and action bar visible** so the player can play an Instant card during the defense prompt or confirm their pick without the overlay obscuring those interactions.

```css
.defensiveOverlay {
  position: absolute;
  inset: 16.5% 0 30.5% 0;     /* Spans dice tray + middle band + self strip; leaves hand + action bar accessible */
  background: linear-gradient(180deg, rgba(20, 14, 14, 0.97), rgba(14, 10, 14, 0.96));
  backdrop-filter: blur(8px);
  border-top: 1px solid var(--ember);
  border-bottom: 1px solid var(--ember);
  box-shadow:
    inset 0 0 60px rgba(200, 74, 42, 0.15),
    0 0 30px rgba(200, 74, 42, 0.4);
  padding: 14px 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 50;
}
```

> **Inset math.** The `16.5%` top edge starts immediately below the phase banner (opp-strip 13% + phase-banner 3.5% = 16.5%). The `30.5%` bottom edge stops immediately above the hand (hand 20% + action-bar 7.5% + ~3% gap = 30.5% from bottom). The overlay covers exactly the offensive-planning bands (dice tray + middle band + self strip = 53% of screen height) and nothing else.
>
> **Why the hand stays uncovered.** Defense is a reactive moment; the player can play Instant cards from the hand during the defense prompt (e.g., Sanctuary to reduce incoming damage, Faith to reroll, Steady to lock dice). The hand must remain interactive — `inset: 16.5% 0 30.5% 0` aligns the bottom edge with the top of the hand band exactly.

**Heraldic corner ornaments:**

```css
.defensiveOverlay::before,
.defensiveOverlay::after {
  content: '◆';
  position: absolute;
  color: var(--ember);
  font-size: 10px;
  top: 4px;
}
.defensiveOverlay::before { left: 8px; }
.defensiveOverlay::after { right: 8px; }
```

**Children:**

```jsx
<motion.div
  className={s.defensiveOverlay}
  initial={{ opacity: 0 }}
  animate={{ opacity: active ? 1 : 0 }}
  transition={{ duration: 0.3 }}
>
  <IncomingDamageBlock
    damage={data.incoming.damage}
    source={data.incoming.sourceLabel}
  />
  <DefensiveLadder
    defenses={data.options}
    selectedId={data.selectedId}
    onSelect={onSelect}
  />
</motion.div>
```

> **Equal visual weight, real player choice.** The two defense rows render with equal visual weight — no engine pre-recommendation, no gold-highlighted "optimal" pick. Defense is a strategic moment the player owns; the player reads the incoming damage block (top of overlay), considers their dice and HP, and makes the call. If a new player picks a low-probability defense and it fails, that's a learning beat — losing because the engine over-rode their choice would feel worse. The DefensiveLadder component should still render whatever eligibility/affordability state derives from the player's own dice (e.g., disabled state if the player somehow has no dice to roll), but the "which one is best" judgment is the player's.

**IncomingDamageBlock component:**

```typescript
// ui/components/overlays/IncomingDamageBlock/IncomingDamageBlock.tsx

export type IncomingDamageBlockProps = {
  damage: number
  source: string                     // e.g., "Firestorm · ub · +2 Cinder"
}
```

Visual:
- Text-align: center
- Padding: 8px 6px
- Background: `radial-gradient(ellipse at center, rgba(200, 74, 42, 0.35), transparent 80%)`
- Border-radius: 8px

Children:
- Label "— Incoming —" in Cinzel 9px, 0.35em letter-spacing, `var(--ember-bright)`, 600 weight, uppercase
- Damage value in Cinzel 32px, 800 weight, `var(--ember-bright)`, line-height 1, with `text-shadow: 0 0 14px rgba(240, 104, 72, 0.7)`
- Source text in Cormorant Garamond italic 12px, `var(--bone)`, margin-top 4px

**Acceptance criteria for DefensiveOverlay:**

1. Entry animation: opacity 0 → 1 over 300ms with ease-out.
2. The underlying ladder (in MiddleBand) is set to opacity 0.05 by the parent MatchScreen during defensive picker. This is achieved via state coordination, not by the overlay itself.
3. Tap on a defensive row sets `selectedId`. Tap on the Confirm button in the ActionBar (which becomes "Confirm Pick" during defensive phase) dispatches the chosen defense.
4. Tap outside the overlay is a no-op (modal cannot be dismissed by clicking elsewhere — only by confirming a defense).
5. Hand remains accessible underneath. The user can play Instant cards during defensive phase. The card's tap zone is preserved even though it's visually below the overlay.

### 6.2 SpendOverlay component

**Visual reference:** `design.html#p2-radiance` shows the Radiance spend prompt.

```typescript
// ui/components/overlays/SpendOverlay/SpendOverlay.tsx

export type SpendOverlayProps = {
  active: boolean
  data: SpendOverlayData
  onSelect: (optionId: string) => void
  onConfirm: () => void
  onSkip: () => void
}

export type SpendOverlayData = {
  resourceName: string               // "Radiance"
  available: number
  max: number
  options: SpendOption[]
  recommendedId?: string
  selectedId?: string
}

export type SpendOption = {
  id: string
  cost: number
  name: string                       // "Empower Sun Strike", "Save · Future Judgment"
  effect: string                     // "+2 damage · 5 → 7 ub"
  affordable: boolean                // True if available >= cost
}
```

**Container layout:**

Similar position to DefensiveOverlay (spans dice tray + middle + self strip), but with dawn-gold theming instead of ember:

```css
.spendOverlay {
  position: absolute;
  inset: 16.5% 0 30.5% 0;     /* Same coverage as DefensiveOverlay — leaves hand + action bar visible */
  background: linear-gradient(180deg, rgba(30, 26, 14, 0.97), rgba(20, 16, 8, 0.96));
  backdrop-filter: blur(6px);
  border-top: 1px solid var(--dawn);
  border-bottom: 1px solid var(--dawn);
  box-shadow:
    inset 0 0 60px rgba(251, 191, 36, 0.15),
    0 0 30px rgba(251, 191, 36, 0.3);
  padding: 14px 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 50;
}
```

**Children:**

```jsx
<motion.div className={s.spendOverlay} ...>
  <div className={s.spendTitle}>— {data.resourceName} Available —</div>
  <AvailableResourceDisplay
    current={data.available}
    max={data.max}
  />
  <SpendOptionsList
    options={data.options}
    recommendedId={data.recommendedId}
    selectedId={data.selectedId}
    onSelect={onSelect}
  />
</motion.div>
```

**AvailableResourceDisplay:**

```typescript
export type AvailableResourceDisplayProps = {
  current: number
  max: number
}
```

Visual:
- Text-align: center
- Padding: 6px

Children:
- Label (top): not rendered separately; the title is in the overlay container
- Amount: Cinzel 30px, 800 weight, `var(--dawn-bright)`, with `text-shadow: 0 0 14px rgba(253, 224, 136, 0.7)`
- Of-max suffix: same line as amount, smaller (Cinzel 14px, color `var(--gold-dim)`)
- Sub-label "Radiance Available": Cinzel 9px, 0.3em letter-spacing, `var(--bone-dim)`, uppercase

Format: `4 / 6` with the "4" in the bright dawn and "/ 6" muted gold.

**SpendOption row:**

```typescript
export type SpendOptionRowProps = {
  option: SpendOption
  recommended: boolean
  selected: boolean
  onTap: () => void
}
```

Visual:
- Layout: flex row, 9px gap, center-aligned
- Padding: 8px 11px
- Border-radius: 6px
- Background: `linear-gradient(90deg, rgba(20, 24, 40, 0.85), rgba(26, 30, 48, 0.65))`
- Border: `1px solid var(--gold-dim)`

State variants:

| State | Border | Box-shadow | Background |
|-------|--------|------------|------------|
| affordable (default) | `1px solid var(--gold)` | `0 0 8px rgba(212, 165, 72, 0.3)` | default |
| recommended | `1px solid var(--dawn)` | `0 0 0 1px var(--dawn), 0 0 14px rgba(251, 191, 36, 0.4)` | `linear-gradient(90deg, rgba(60, 44, 12, 0.5), rgba(40, 30, 10, 0.35))` |
| unavailable (not affordable) | default | none | default, opacity 0.45 |

Children:
- Cost circle (left, 26×26): dawn-bright disc with cost number inside (Cinzel 12px, 800, `var(--night-deep)`)
- Info column (flex 1):
  - Name: Cinzel 10.5px, 700, 0.06em letter-spacing, `var(--bone)` (or `var(--dawn-bright)` if recommended)
  - Effect text: Cormorant italic 11px, `var(--bone-dim)` (or `var(--bone)` if recommended)

**Acceptance criteria:**

1. Tapping an affordable row sets `selectedId`. Tapping an unavailable row is a no-op (with denial click sound).
2. The Confirm button in the action bar reads "Confirm Spend" during spend phase. Tap fires `onConfirm`.
3. The Skip button reads "Skip Spend" and fires `onSkip` (proceeds without spending).
4. If no option is selected and Confirm is tapped, fire `onConfirm` with the recommended option (engine should validate).
5. Cost circle visually conveys "you'll pay N pips" — color matches Radiance pip styling for consistency.

### 6.3 TooltipRenderer component

Long-press tooltips for surfacing mechanical details of any visible UI element (tokens, abilities, defenses, etc.). Non-blocking — the match continues underneath.

**Visual reference:** `design.html#p2-reference` shows a sample tooltip in the "Ephemeral Overlays" panel at the bottom of the System Reference grid (rendering over a Frost-bite chip).

```typescript
// ui/components/overlays/TooltipRenderer/TooltipRenderer.tsx

export type TooltipRendererProps = {
  // Renders the currently active tooltip from uiStore, no props needed
}
```

This component subscribes to `uiStore.tooltipTarget` and renders accordingly. The `tooltipTarget` is set by `useLongPress` hooks attached to interactive elements.

**uiStore tooltip state:**

```typescript
type TooltipState = {
  visible: boolean
  anchor: { x: number, y: number }   // Screen coords of the long-pressed element
  content: TooltipContent
}

type TooltipContent =
  | { kind: 'signature-token', name: string, hero: string, count: number, mechanic: string }
  | { kind: 'generic-status', name: string, mechanic: string, decay: string }
  | { kind: 'card-buff', name: string, source: string, mechanic: string, remaining: string }
  | { kind: 'resource', name: string, value: number, max: number, spendOptions: string[] }
  | { kind: 'ability', name: string, tier: number, combo: string, effect: string, lethal?: string }
  | { kind: 'die', face: string, meaning: string }
  | { kind: 'card', card: Card, affordable: boolean, playable: boolean }
  | { kind: 'free-text', title: string, body: string }
```

**Visual:**

The tooltip renders as a small floating card positioned **above** the anchor (with arrow pointing down to it). If the anchor is in the top third of the screen, position below instead.

- Max-width: 280px
- Background: `linear-gradient(180deg, rgba(30, 30, 48, 0.98), rgba(20, 20, 34, 0.98))`
- Border: `1px solid var(--gold)`
- Border-radius: 6px
- Padding: 12px 14px
- Box-shadow: `0 8px 24px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(212, 165, 72, 0.3)`
- z-index: 200 (above modals)

**Layout:**
- Title: Cinzel 11px, 700 weight, 0.08em letter-spacing, `var(--gold-bright)`, uppercase
- Body: Cormorant Garamond 13px, line-height 1.5, `var(--bone)`
- Numeric callouts (current/max values): JetBrains Mono 12px, `var(--bone-bright)`

**Arrow:** SVG triangle pointing toward the anchor, positioned outside the card border, same gold border color.

**Animation:**
- Entry: opacity 0 → 1, translateY +4 → 0, over 150ms
- Exit: opacity 1 → 0 over 100ms

**Content per kind:**

| Kind | Layout |
|------|--------|
| signature-token | Title: name. Body: "{hero} signature. {count} stacks. {mechanic}." |
| generic-status | Title: name. Body: "{mechanic} {decay}." |
| card-buff | Title: name. Body: "{mechanic} Source: {source} card. Remaining: {remaining}." |
| resource | Title: name. Body: "{value}/{max}. Spend options: {list}." |
| ability | Title: name + tier. Body: "Combo: {combo}. Effect: {effect}. {lethal? '⚠ LETHAL: ' + lethal : ''}" |
| die | Title: face name. Body: "{meaning} symbol. Used by abilities requiring {face}." |
| card | Title: card name. Body: cost line + brief effect summary (first 80 chars of rendered effect text). Suffix line: affordable/playable status if not both. |
| free-text | Title: title. Body: body (HTML allowed for emphasis). |

The `card` kind is intentionally a **brief preview**, not the full card. The user tapped-and-held on a hand card for a quick reminder; if they want full detail, they single-tap to open the ExpandedCardView (Part 6.6).

**Long-press detection:**

```typescript
// ui/hooks/useLongPress.ts
export function useLongPress(callback: (event: PointerEvent) => void, delay = 400) {
  // Standard implementation: pointerdown starts a timer, pointerup/pointercancel/pointerleave cancels.
  // On timer fire, callback is invoked with the event.
}
```

Usage example:

```jsx
const tooltipHandlers = useLongPress((e) => {
  uiStore.setTooltipTarget({
    anchor: { x: e.clientX, y: e.clientY },
    content: {
      kind: 'signature-token',
      name: 'Frost-bite',
      hero: 'Berserker',
      count: 3,
      mechanic: 'Consumed by Berserker damage abilities for +1 bonus damage per stack.',
    },
  })
})

<div {...tooltipHandlers} className={s.frostbiteChip}>
  {/* chip contents */}
</div>
```

**Dismiss:**

- Tap anywhere outside the tooltip dismisses it.
- A second long-press on the same target also dismisses (toggle behavior).
- Long-press on a different target replaces the tooltip content.
- Tooltip auto-dismisses after 5 seconds if not interacted with.

**Acceptance criteria:**

1. Tooltips never block gameplay input — they're informational only.
2. Positioning: tooltip stays within viewport bounds. If anchor is near the top edge, tooltip flips below the anchor. If anchor is near the left/right edge, tooltip shifts to stay visible.
3. Touch and mouse both supported. On desktop (mouse), `hover` after 800ms also opens the tooltip (in addition to long-press).
4. Tooltip content is read by screen readers via `role="tooltip"` and `aria-live="polite"` on the anchor element.

### 6.4 Modal stacking and z-index discipline

Multiple overlays cannot be active simultaneously (with one exception: a tooltip can render over a modal). z-index layering:

| Layer | z-index | Purpose |
|-------|---------|---------|
| Base UI (bands, ladder, hand, etc.) | auto / 0 | Standard layout flow |
| FieldOfPlay overlay | 5 | Inside MiddleBand |
| Modal overlays (Defensive, Spend, ExpandedCardView, ExpandedAbilityView) | 50 | Inside ScreenBands |
| UltimateTakeover | 100 | Full screen above ScreenBands children |
| MatchSummaryScreen | 100 | Replaces match content on game end |
| ToastQueue | 150 | Non-blocking notifications |
| TooltipRenderer | 200 | Always on top |

Rules:
1. Only one of `DefensiveOverlay`, `SpendOverlay`, `ExpandedCardView`, `ExpandedAbilityView`, `UltimateTakeover` is active at a time. The store's `activeOverlay` field is a string enum, not a stack.
2. If two modal triggers fire simultaneously, the engine resolves order (typically: ultimate > defensive > spend > expanded-card / expanded-ability). The two player-initiated inspection modals (ExpandedCardView and ExpandedAbilityView) are the lowest priority because they're dismissible.
3. The tooltip can render over any modal; it's the only overlay that supports stacking.
4. Opening ExpandedCardView or ExpandedAbilityView while a higher-priority modal is active is suppressed (no-op).
5. ExpandedCardView and ExpandedAbilityView cannot stack with each other. If the player taps an ability while the card view is open, the card view dismisses first, then the ability view opens.

### 6.5 ToastQueue component (auxiliary)

For non-modal feedback (errors, info, transient state changes). Not used during normal play but valuable for system events.

**Visual reference:** `design.html#p2-reference` shows two toast samples in the "Ephemeral Overlays" panel — an info toast ("Match saved.") and a warning toast ("Connection lost. Retrying…").

```typescript
// ui/components/overlays/ToastQueue/ToastQueue.tsx

export type Toast = {
  id: string
  kind: 'info' | 'warn' | 'error' | 'success'
  message: string
  durationMs?: number               // Default 3000
}
```

Visual:
- Stacks vertically at top of screen (below safe area)
- Each toast: small pill, 240px max-width, color-coded border (info=gold, warn=ember, error=crimson, success=green)
- Slides in from above, holds for `durationMs`, slides out to above
- Tap to dismiss immediately

Used for:
- "Connection lost" / "Reconnected"
- "Match saved"
- "Achievement unlocked: First Detonation"

The toast system is decoupled from match flow — it's a global overlay that any code can dispatch into. Not specified further here; standard implementation.

### 6.5.5 ActivityLog component

A scrollable log of game events that players can open at any time to review what happened. Players forget, look away, mis-read a damage number, or just want to verify "did Frost-bite consume on that Glacier Strike?" — the activity log is the answer to those moments without forcing the player to re-watch a resolution scene.

**Visual reference:** `design.html#p5-activity-log` shows the open drawer state with a populated log including ability resolutions, card plays, status ticks, and turn boundaries.

**Trigger:** A small icon button at the right edge of the PhaseBanner (replaces the decorative `::after` diamond). Tapping the button opens the log drawer.

```typescript
// ui/components/overlays/ActivityLog/ActivityLog.tsx

export type ActivityLogProps = {
  // Reads entries and isOpen from uiStore.
  // No props — the component is self-contained against the store.
}

// In uiStore.ts:
export type UIStore = {
  // ... existing fields ...
  activityLog: {
    isOpen: boolean
    entries: LogEntry[]
    lastReadEntryId: string | null    // For tracking "new since last open"
    pulseState: 'idle' | 'pulsing'    // Trigger-button pulse signal
  }
}
```

**LogEntry data model:**

```typescript
export type LogEntry = {
  id: string                          // Unique entry ID (engine-generated)
  turn: number                        // Game turn this happened on
  timestamp: number                   // Wall-clock ms; for ordering, not display
  actor: PlayerId | 'system'          // Who triggered the event
  payload: LogPayload                 // Discriminated union by kind
}

export type LogPayload =
  | { kind: 'turn-start'; turnNumber: number; activePlayer: PlayerId }
  | { kind: 'ability-fired'; abilityName: string; tier: 1 | 2 | 3 | 4; targetId: PlayerId }
  | { kind: 'card-played'; cardName: string; cost: number }
  | { kind: 'defense-picked'; defenseName: string; tier: 1 | 2 | 3 }
  | { kind: 'damage-dealt'; amount: number; sourceId: PlayerId; targetId: PlayerId; abilityName?: string; cardName?: string }
  | { kind: 'damage-prevented'; amount: number; targetId: PlayerId; viaDefense: string }
  | { kind: 'heal'; amount: number; targetId: PlayerId; source: string }
  | { kind: 'status-applied'; statusKind: string; amount: number; targetId: PlayerId; source: string }
  | { kind: 'status-ticked'; statusKind: string; effect: 'damage' | 'heal'; amount: number; targetId: PlayerId }
  | { kind: 'status-expired'; statusKind: string; targetId: PlayerId }
  | { kind: 'token-consumed'; tokenKind: 'frostbite' | 'cinder' | 'verdict'; count: number; targetId: PlayerId; outcome: string }
  | { kind: 'resource-gained'; resource: 'cp' | 'radiance'; amount: number; playerId: PlayerId }
  | { kind: 'resource-spent'; resource: 'cp' | 'radiance'; amount: number; playerId: PlayerId; purpose: string }
  | { kind: 'match-start'; opponentName: string }
  | { kind: 'match-end'; winner: PlayerId; reason: 'hp-zero' | 'concede' | 'timeout' }
```

The engine emits log entries as side-effects of state changes. Engineers wire up emission in the reducer — wherever HP changes, a `damage-dealt` or `heal` entry is appended; wherever a status is added, a `status-applied` entry is appended; etc. The append-to-log step is deterministic, so logs are reproducible from action history (important for multiplayer reconciliation).

**Rendering — drawer layout:**

The drawer slides in from the right edge of the screen, taking 75% of viewport width. The remaining 25% on the left shows the match state behind a 60%-opacity dark scrim — players can correlate log entries with the visible match state (e.g., "Frost-bite consumed" entry while the strip's Frost-bite chip is gone).

```jsx
<div className={clsx(s.drawerWrap, isOpen && s.open)}>
  <div className={s.scrim} onClick={() => closeLog()} />
  <aside className={s.drawer}>
    <header className={s.header}>
      <h2 className={s.title}>Match Log</h2>
      <button className={s.closeBtn} onClick={closeLog}>×</button>
    </header>
    <div className={s.entryList} ref={scrollRef}>
      {groupedEntries.map(group => (
        <TurnGroup key={group.turn} group={group} />
      ))}
    </div>
  </aside>
</div>
```

**Drawer specifications:**

- Position: fixed, top 0, right 0, bottom 0
- Width: 75vw (on phones); max-width 480px (caps on larger screens)
- Background: `linear-gradient(180deg, var(--night-stone) 0%, var(--night-deep) 100%)` with `border-left: 1px solid var(--gold-dim)`
- Shadow: `-8px 0 24px rgba(0, 0, 0, 0.6)` to lift it off the match behind
- Slide-in animation: `transform: translateX(100%)` → `translateX(0)` over 300ms with `cubic-bezier(0.4, 0, 0.2, 1)` easing
- Scrim (left 25%): `rgba(10, 10, 20, 0.6)`, fades in over 250ms; tappable to dismiss

**Entry list structure — turn-grouped:**

Entries are grouped by `turn` number with a sticky header for each turn. Each turn group renders as a collapsible section:

```
─────────────── ROUND 4 ───────────────
[18:42] Berserker fired Glacier Strike (T2)
        → Pyromancer took 7 damage
        → Frost-bite ×3 consumed for +3 dmg
[18:43] Pyromancer defended with Flame Ward (D1)
        → 3 damage prevented
[18:44] Pyromancer played Spark
        → Lock 1 🔥 die · apply 1 Cinder

─────────────── ROUND 3 ───────────────
[17:55] Berserker fired Frost Maul (T2)
        → Pyromancer took 4 damage + 1 Frost-bite
...
```

Most recent turn appears at the top of the list (chat-app style, reverse-chronological). Within a turn, entries are chronological (oldest first within the turn). The current turn's group is always expanded; older turns can be collapsed (tap header to toggle).

**Entry visual treatment:**

Each entry is a compact row with:
- **Actor portrait** (16×16 mini orb, hero-element-tinted)
- **Action verb phrase** (Cormorant Garamond italic 12px, `var(--bone)`)
- **Outcome line** (indented, 11px, color-coded by event type):
  - Damage dealt: `var(--ember-bright)`
  - Damage prevented: `var(--frost-bright)`
  - Healing: `var(--green-bright)`
  - Status applied: status-kind color
  - Token consumed: token-kind color
  - Resource gained: `var(--gold-bright)`

The `system` actor renders without a portrait, with a small ◆ marker instead — used for turn boundaries and match-end events.

**Trigger button on phase banner:**

```jsx
// Inside PhaseBanner component
<div className={s.banner}>
  <span className={s.diamond}>◆</span>
  <span className={s.text}>{phaseText}</span>
  <button
    className={clsx(s.logTrigger, pulseState === 'pulsing' && s.pulsing)}
    onClick={openLog}
    aria-label="Open match log"
  >
    <ScrollIcon />
  </button>
</div>
```

Button specs:
- Size: 20×20
- Position: right edge of banner, 8px from the right
- Background: `transparent`, hover: `rgba(212, 165, 72, 0.15)`
- Icon: A small scroll/parchment SVG glyph (Lucide `scroll-text` or similar) in `var(--gold-dim)` default, `var(--gold-bright)` on hover
- Pulse state: applied when a major event lands (HP loss, status apply, ultimate fired). Pulse animation = 600ms scale + glow cycle, plays 2x, then idle. Class is cleared by either (a) the player opens the log, or (b) 4 seconds elapse without further major events.

**Pulse trigger logic:**

```typescript
// In uiStore.ts
function onLogEntryAppended(entry: LogEntry) {
  const isMajorEvent = (() => {
    switch (entry.payload.kind) {
      case 'damage-dealt':
        return entry.payload.amount >= 3
      case 'status-applied':
        return true
      case 'ability-fired':
        return entry.payload.tier >= 3
      case 'token-consumed':
        return true
      case 'match-end':
        return true
      default:
        return false
    }
  })()
  if (isMajorEvent && !get().activityLog.isOpen) {
    set({ pulseState: 'pulsing' })
    setTimeout(() => set({ pulseState: 'idle' }), 1200)  // 2 cycles of 600ms
  }
}
```

**Acceptance criteria:**

1. Tapping the trigger button slides the drawer in from the right over 300ms. Match state stays visible at 60% opacity on the left 25% of the screen.
2. The drawer scroll position defaults to the top of the most recent turn group (newest entries visible on open).
3. Tapping the scrim, swiping right on the drawer, or tapping the × button dismisses the drawer over 300ms slide-out.
4. Entries within a turn group render in chronological order; turn groups render in reverse-chronological order (newest turn at top).
5. The pulse animation plays for 1.2s when a major event is appended while the log is closed. Major events: damage ≥ 3, any status applied, T3+ ability fired, token consumed, match end.
6. The current turn group is always expanded; older turn groups collapse by default after the turn ends (tap header to expand).
7. The log persists for the duration of the match. On `MATCH_END`, the log remains accessible until the player leaves the match summary screen. After that, it's discarded (no cross-match log history in MVP).
8. The drawer is keyboard-navigable: Tab cycles through entries, Esc dismisses.
9. On viewport widths > 768px, the drawer caps at 480px width and the scrim covers more of the visible area.

**Engine integration:**

The engine emits `LOG_APPEND` events as side effects of state mutations. The UI's `uiStore` subscribes to these events and appends to `activityLog.entries`. This means the log is a derived view of game state — if the match is replayed from action history, the log reproduces identically.

For multiplayer (v2), the log entries are part of the broadcast state, so both players see the same log. No client-side reconstruction; the server is authoritative.

### 6.6 ExpandedCardView component

**Visual reference:** `design.html#p4-expanded` shows the modal in detail.

When the player taps a hand card, the ExpandedCardView opens — a constrained modal showing the card at readable size with full effect text, keyword highlighting, and Cancel/Play actions. The match state behind remains visible (per the constrained-inset pattern shared with Defensive and Spend overlays).

```typescript
// ui/components/overlays/ExpandedCardView/ExpandedCardView.tsx

export type ExpandedCardViewProps = {
  active: boolean
  card: Card | null                // The card being viewed, null if not active
  affordable: boolean              // Computed: player has enough CP
  playable: boolean                // Computed: timing allows + affordable
  unplayableReason?: string        // Human-readable reason if !playable, e.g., "Need 2 CP (have 1)"
  onCancel: () => void
  onPlay: () => void
}
```

**Container layout:**

The ExpandedCardView covers more screen real estate than DefensiveOverlay or SpendOverlay — it spans dice tray + middle band + self strip + **hand band**, leaving only the action bar visible:

```css
.expandedCardView {
  position: absolute;
  inset: 16.5% 0 7.5% 0;     /* Spans dice tray + middle band + self strip + hand; only action bar visible */
  background: linear-gradient(180deg, rgba(14, 14, 28, 0.97), rgba(10, 10, 20, 0.96));
  backdrop-filter: blur(8px);
  border-top: 1px solid var(--gold);
  border-bottom: 1px solid var(--gold);
  box-shadow:
    inset 0 0 60px rgba(212, 165, 72, 0.10),
    0 0 30px rgba(212, 165, 72, 0.3);
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  z-index: 50;
}
```

> **Why the hand IS covered (unlike DefensiveOverlay).** ExpandedCardView is a card-inspection-and-commit modal opened by tapping a hand card. While it's open, the player isn't browsing the hand — they're focused on the one card they tapped. Letting the hand show through is visually noisy (other cards compete for attention) and steals modal real estate that the 44px Activate/Cancel buttons need. DefensiveOverlay keeps the hand visible because Instant cards may be played during defense; ExpandedCardView doesn't need that affordance — if the player wants a different card, they tap Cancel and the modal closes, then they can tap a different hand card. Same applies to ExpandedAbilityView (Part 6.7).

Heraldic corner ornaments use the same `◆` pattern as other modals, in `var(--gold)` color.

**Children, top to bottom:**

1. **Header strip** — "— Card —" label in Cinzel 9px, 0.35em letter-spacing, `var(--gold)`, uppercase. Plus a close X button at the top-right (44×44 tap target, 12px X glyph centered).

2. **Card display** — The card itself, scaled up. Approximately 200×280px, centered. Same structure as the hand card (cost pip, illustration, name) but larger and with effect text added below the illustration. Detailed visual specs below.

3. **Conditions section** (only if `card.conditions` is non-empty) — A small block below the card listing each condition with its current status. See "Conditional effects rendering" below.

4. **Action buttons** — A row of two buttons at the bottom: Cancel (default variant) and Play (primary variant). Play disabled with reason text if `!playable`.

**Expanded card visual specifications:**

```
┌────────────────────────────────┐
│ ◉                              │ ← Cost pip, 24×24, top-left overhang
│ ┌────────────────────────────┐ │
│ │                            │ │
│ │      [illustration]        │ │ ← Illustration, ~180×100
│ │                            │ │
│ ├────────────────────────────┤ │
│ │   Sun's Blessing           │ │ ← Card name, Cinzel 16px, gold-bright
│ │   ATTACK · 2 CP            │ │ ← Category + cost line, JetBrains Mono 9px
│ ├────────────────────────────┤ │
│ │                            │ │
│ │   Deal 4 Unblockable       │ │ ← Effect text, Cormorant Garamond 13px
│ │   damage and apply         │ │   Keywords in gold-bright Cinzel
│ │   Sanctuary.               │ │
│ │                            │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

- Container: 200×280px, border-radius 8px
- Background: `linear-gradient(180deg, #2a2440 0%, #14142a 100%)`
- Border: `1.5px solid var(--gold)` (always; the playability state shows in the Play button, not the card border, in expanded view)
- Box-shadow: `0 4px 16px rgba(0,0,0,0.8), 0 0 20px rgba(212, 165, 72, 0.4)`

**Cost pip in expanded view** (24×24, scales up the hand-card version):
- Position: `top: -8px; left: -8px`
- Background: same as hand card, scaled up
- Font: Cinzel 14px, 800 weight
- Same affordability color shift (gold/red-tinted)

**Illustration area:**
- Approximately 180×100px (taller than the hand card's slot, with more breathing room)
- Same default rendering (gradient + category glyph) if art not supplied; category glyph at 32px
- Border-radius: 5px

**Name + category line:**
- Card name: Cinzel 16px, 700 weight, 0.04em letter-spacing, `var(--gold-bright)`, `text-shadow: 0 0 6px rgba(240, 198, 104, 0.3)`
- Category + cost line below name: JetBrains Mono 9px, 0.2em letter-spacing, color `var(--bone-dim)`, uppercase: `{CATEGORY} · {COST} CP`
- Both centered

**Effect text area:**
- Padding: 12px
- Background: `rgba(0, 0, 0, 0.25)` with `1px solid var(--frame-stroke)` top divider
- Effect text font: Cormorant Garamond 13px, 400 weight, line-height 1.5, color `var(--bone)`

**Rendering segments:**

The effect text is composed of segments (per Part 1.9 schema). Each kind renders differently:

```jsx
{card.effect.map((segment, i) => {
  if (segment.kind === 'text') {
    return <span key={i}>{segment.content}</span>
  }
  if (segment.kind === 'value') {
    return (
      <span key={i} className={s.value}>
        {segment.content}
      </span>
    )
  }
  if (segment.kind === 'keyword') {
    const keyword = KEYWORD_REGISTRY[segment.id]
    return (
      <span key={i} className={s.keyword} data-keyword-id={segment.id}>
        {keyword.displayLabel}
      </span>
    )
  }
})}
```

CSS for segment types:

```css
.effectText .value {
  font-weight: 700;
  color: var(--ember-bright);    /* Default; can be overridden via context */
}

.effectText .keyword {
  font-family: 'Cinzel', serif;
  font-weight: 600;
  font-size: 0.92em;             /* Slightly smaller because Cinzel runs larger than Cormorant */
  color: var(--gold-bright);
  text-shadow: 0 0 4px rgba(240, 198, 104, 0.3);
  border-bottom: 1px solid var(--gold-dim);
  padding-bottom: 1px;
  /* MVP: decorative only. v1.1: add pointer/touch handlers for glossary tooltip. */
}
```

**Conditional effects rendering:**

If the card has conditions, each renders below the effect text as a small italic line:

```
┌────────────────────────────────┐
│ ⚠ If your HP < 15:             │ ← Condition line, Cormorant italic 11px
│   (currently met)              │   color depends on isMet
└────────────────────────────────┘
```

- Container: full width of card, padding 8px 12px, background `rgba(0,0,0,0.35)` with top border `1px solid var(--frame-stroke)`
- Condition text: Cormorant Garamond italic 11px, color `var(--bone-dim)` (unmet) or `var(--gold-bright)` (met)
- Marker glyph (12px): `⚠` for unmet, `✓` for met, in matching color
- Gated segments (referenced by `appliesToSegments` indices) render with reduced opacity (0.5) and a `text-decoration: line-through` style when condition is unmet

This way the player sees the full card text always, with visual indication of which parts apply.

**Action buttons (below the card):**

Two buttons in a flex row, gap 10px, full width row. Modal buttons are **substantially larger** than action-bar buttons — modals are the primary commit surface and the buttons need to be inviting to tap:

| Button | Variant | Width | Height | Font | Behavior |
|--------|---------|-------|--------|------|----------|
| Cancel | default | flex 1 | 44px | Cinzel 12px, 0.18em letter-spacing | Closes the modal, no action dispatched |
| Play | primary (if playable) or disabled | flex 1.5 | 44px | Cinzel 13px, 800 weight, 0.2em letter-spacing | Dispatches play-card via onPlay |

The Play button gets a stronger box-shadow than the action-bar primary: `0 0 20px rgba(212, 165, 72, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4)` — this makes it visually dominant within the modal. Border-radius is 6px (vs 4px for action-bar buttons) to match the modal's overall larger geometry. The chevron arrow next to Play is rendered at 16px (vs 11px in action-bar buttons).

> **Why bigger modal buttons.** Action-bar buttons live in the 7.5%-tall bottom strip with 9.5px Cinzel labels — they fit the bar's vertical budget but feel small. Modal buttons live in much taller surfaces (the modal opens over ~50% of screen height) and bigger buttons match that real estate. They also serve as the modal's commit moment — tapping Play is the player's decision to spend resources and trigger an effect. The button needs to feel deliberate, not like an afterthought tucked under the card art.

When `!playable`, the Play button shows in disabled variant with hint text immediately below it:
- Hint text: JetBrains Mono 8px, 0.1em letter-spacing, color `var(--ember-bright)`, uppercase
- Content: `unplayableReason` prop, e.g., "NEED 2 CP (HAVE 1)" or "WRONG TIMING"

**Entry/exit animation:**

```jsx
<motion.div
  className={s.expandedCardView}
  initial={{ opacity: 0, scale: 0.92 }}
  animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.92 }}
  transition={{ duration: 0.25, ease: EASING.default }}
>
  {/* ... */}
</motion.div>
```

The card itself scales slightly during entry (from 0.92 to 1.0) over the same 250ms — gives the impression of "the card you tapped grew into this view." Under `prefers-reduced-motion`, scale animation is omitted; only opacity fades.

**Dismiss behavior:**

1. Tap Cancel button → `onCancel()` fires, modal closes.
2. Tap the X close button → `onCancel()` fires.
3. Tap outside the card (in the modal background but not on a button) → `onCancel()` fires.
4. Hardware back button (Android) → `onCancel()` fires.
5. Tap Play (when playable) → `onPlay()` fires; modal closes immediately and the engine begins resolution.

**Acceptance criteria:**

1. Renders the card at the specified visual scale (200×280px), with all effect segments correctly typed (text/value/keyword).
2. Keywords render with the keyword style (gold-bright Cinzel, slight underline) but are NOT tappable in MVP. Pointer events on keyword spans are `none`.
3. Conditional effects render with the correct met/unmet visual state based on current game state passed via the `card.conditions[].isMet` field.
4. Play button is disabled when `!playable`, with `unplayableReason` shown below. Tap on disabled Play is a no-op (no animation, no dispatch).
5. Tap on Cancel, X, background, or back button all dismiss the modal with the standard 200ms fade-out.
6. While ExpandedCardView is active, the underlying hand is non-interactive (no card taps register). The defensive and spend overlays cannot open while ExpandedCardView is active — if a defense prompt fires while a card view is open, the engine queues it and the UI auto-dismisses the card view first, then opens defense.
7. Long-press tooltip cannot open over the expanded view (already showing full detail).

**Mastery card preview block (additional spec).** When the card is a Mastery card (`card.kind === 'mastery'`, see Part 1.9.5), the ExpandedCardView renders an extra **before/after preview** below the standard effect prose. The preview shows the target ability row in its current state (left/top) and its post-mastery state (right/bottom) so the player can verify exactly what the upgrade will do before tapping Play. This is critical for transformation-kind Masteries since they can completely change the combo requirement and the player's locked dice may suddenly become irrelevant.

```typescript
// Rendered as a sub-block inside ExpandedCardView when card.kind === 'mastery'

type MasteryPreviewProps = {
  currentAbility: LadderAbility   // The ability row in its current state (with any existing mastery)
  upgradedAbility: LadderAbility  // What the row will look like after this Mastery applies
  upgradeKind: 'modifier' | 'transformation'
}
```

**Visual layout:** two stacked ability-row miniatures (~280px wide, scaled-down at 0.85x of the ladder size), labeled "NOW" and "AFTER" in Cinzel 9px uppercase letter-spacing 0.2em. The arrow between them is a dawn-bright `↓` (vertical layout) at 16px. Both miniatures are inert (no tap, no hover affordance) — they are visual previews only.

For `kind: 'modifier'`: the AFTER row differs from NOW only in the value badge number and the ✦ indicator. The player sees clearly "the damage will go from 4 to 7" and nothing else changes.

For `kind: 'transformation'`: the AFTER row may differ in name, combo glyphs, value, AND effect text. The player can read both rows side by side and decide whether the transformation is worth it given their current dice state. A small inline note appears below the preview in italic Cormorant Garamond: *"The transformed ability has a different combo — your currently-locked dice may need to change."* (Only rendered when the combo actually differs between `currentAbility.combo` and `upgradedAbility.combo`.)

### 6.6.5 CardPlayOverlay component

**Visual reference:** `design.html#p1-card-play` shows the played-card cinematic in full match context.

When a player plays a card (taps Play from ExpandedCardView, or activates a one-tap card via shortcut), the card lifts out of the hand and the **CardPlayOverlay** takes center stage — a large frosted-glass overlay covering the dice tray AND middle band AND self strip, with the played card rendered at readable size (~168×230px) so the player can read its full name and effect text. The card hangs in this overlay for ~700ms before sliding to the discard pile, while the effect resolves on the underlying bands.

```typescript
// ui/components/overlays/CardPlayOverlay/CardPlayOverlay.tsx

export type CardPlayOverlayProps = {
  active: boolean
  card: CardData | null
  tone: 'frost' | 'ember' | 'dawn' | 'gold'
  // Engine drives the entire flow:
  // 1. CARD_PLAY emit → overlay appears with card at center
  // 2. Effect resolves on bands underneath (~700ms beat)
  // 3. CARD_DISCARD emit → overlay slides card toward discard area, then fades
  // No interactivity within the overlay — purely cinematic.
}
```

**Why this is a distinct overlay (not part of FieldOfPlay):**

The CardPlayOverlay covers the **same area** as the FieldOfPlay (FOP) — both use `inset: 16.5% 0 42.5% 0`, spanning dice tray + middle band, leaving strips visible. The visual coverage is identical. What distinguishes them is **the content type and beat duration**:

- **FOP** renders ability resolution content (damage numbers, effect rows, particles, ability name). Beats are ~1500-2000ms for full cinematics, ~700ms for upkeep variants.
- **CardPlayOverlay** renders a single large card with readable name + effect text. Beat is ~1700ms (card lifts, holds, slides to discard).

They could in principle be unified into a single overlay component with content variants, but they're kept separate because the card-play scene has unique animation choreography (card scale-in, slide-to-discard) that doesn't fit cleanly into the FOP scene types. Treating them as parallel siblings rather than nested variants keeps the resolution choreography logic readable.

The card itself is rendered at **168×230px** with full readable name + effect text — the cinematic moment is "see the card you just played." At this size, 12px italic Cormorant Garamond text reads at comfortable distance.

**Container layout:**

```css
.cardPlayOverlay {
  position: absolute;
  inset: 16.5% 0 42.5% 0;     /* covers dice tray + middle band only; both strips remain visible */
  background: radial-gradient(ellipse at center, rgba(108, 176, 232, 0.32) 0%, rgba(74, 140, 200, 0.12) 40%, transparent 80%);
  /* tone-tinted gradient — frost example shown; ember and dawn variants similar */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
  backdrop-filter: blur(2px);
}
.cardPlayOverlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(45deg, transparent, transparent 28px, rgba(212, 165, 72, 0.04) 28px, rgba(212, 165, 72, 0.04) 30px);
  mix-blend-mode: overlay;
}
.cardPlayOverlay.frost { background: radial-gradient(ellipse at center, rgba(108, 176, 232, 0.35) 0%, rgba(74, 140, 200, 0.12) 40%, transparent 80%); }
.cardPlayOverlay.ember { background: radial-gradient(ellipse at center, rgba(240, 104, 72, 0.35) 0%, rgba(200, 74, 42, 0.12) 40%, transparent 80%); }
.cardPlayOverlay.dawn  { background: radial-gradient(ellipse at center, rgba(253, 224, 136, 0.35) 0%, rgba(251, 191, 36, 0.12) 40%, transparent 80%); }
```

**Played-card visual specifications:**

The card sitting in the overlay is the `<PlayedCard>` sub-component — visually similar to HandCard but **enlarged** and with **prominent effect text**:

```css
.playedCard {
  width: 168px;
  height: 230px;
  background: linear-gradient(180deg, #2a2440 0%, #14142a 100%);
  border: 2px solid var(--frost);            /* tone-matched border */
  border-radius: 9px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 12px 36px rgba(0,0,0,0.7), 0 0 48px rgba(108, 176, 232, 0.55), inset 0 1px 0 rgba(108, 176, 232, 0.3);
  z-index: 5;
}
```

Sub-elements:

| Sub-element | Visual treatment |
|-------------|------------------|
| `.played-card-cost` | 32×32 gold circle, top-left, Cinzel 17px weight 800, prominent shadow |
| `.played-card-art` | Flex-1 area, large 56px sigil glyph, radial-tinted background matching tone |
| `.played-card-name` | Cinzel 13px weight 700 uppercase, tone-bright color, 0.08em letter-spacing, 8px margin-bottom |
| `.played-card-effect` | Cormorant Garamond italic 12px, bone-bright color, 1.35 line-height — **the readable effect text** |

The `.played-card-effect` text uses inline spans for emphasis:
- `<span class="value">N</span>` — numeric values in gold-bright JetBrains Mono 11px non-italic weight 700
- `<span class="kw">KEYWORD</span>` — game keywords (Vow, Sanctuary, Empower, etc.) in tone-bright JetBrains Mono 10px non-italic uppercase weight 700

**Tone variants:**

The overlay and played card share tone-matched coloring:
- `.frost` — defensive cards (Sanctuary, Guard, Faith) — frost-blue tinting
- `.ember` — aggressive cards (Rage, Pyre Lance variants) — ember-orange tinting
- `.dawn` — utility/buff cards (Empower, Vow-tagged) — dawn-gold tinting
- `.gold` — generic fallback for cards without strong elemental identity

The tone is set per-card-play by the engine based on the card's hero element + category.

**Beat timing:**

- **0ms** — overlay fades in (200ms ease-out), played card scales from 0.7 to 1.0 (300ms with overshoot)
- **300–1000ms** — held state, effect resolves on underlying bands (HP/CP/token changes animate behind the overlay's translucent gradient)
- **1000ms** — card scales to 0.6 and slides toward discard-pile position (off-screen bottom-right corner, 500ms ease-in)
- **1500ms** — overlay fades out (200ms ease-out)

**Total: ~1700ms** for a typical card play. Engine may extend this if the resolution itself takes longer (e.g., Sanctuary buff application takes ~400ms to settle the chip on the strip).

**Acceptance criteria:**

1. CardPlayOverlay appears as soon as `CARD_PLAY` event fires; underlying bands remain visible at reduced opacity (the overlay is translucent, not opaque)
2. Played card is positioned absolutely-centered within the overlay; no flex flow issues if overlay's dimensions change
3. The card's name and effect text are readable at standard reading distance — minimum 12px italic text body
4. While the overlay is active, hand cards are non-interactive (the played card is the only focus)
5. Defense prompts arriving mid-play are queued; the overlay completes its 1700ms beat before the defense overlay opens
6. Reduced motion mode replaces the scale-in animation with a simple fade-in (200ms opacity 0→1); slide-to-discard becomes a fade-out
7. Multiple card plays in rapid succession (e.g., two one-tap cards played back-to-back) queue with no overlap — the second card's overlay opens only after the first's beat completes

> **Distinct from FieldOfPlay overlay (Part 5).** As of the latest design pass, FOP and CardPlayOverlay use the **same screen coverage** (`inset: 16.5% 0 42.5% 0` — dice tray + middle band, leaving both strips visible). What distinguishes them is content type: FOP renders ability-resolution scenes (damage numbers, effect rows, particles); CardPlayOverlay renders a single large readable card. Engineers should keep them as separate components rather than collapsing into one — the animation choreography (card lift, slide-to-discard) is unique to card plays and doesn't fit cleanly into FOP scene types.

#### 6.6.5.1 Mastery card play variant

When the played card is a Mastery card (`card.kind === 'mastery'`, see Part 1.9.5), the CardPlayOverlay plays an extended choreography that visually connects the card to the target ability row on the ladder before the upgrade applies. This is a deliberate beat: Mastery is a *significant, durable* change to the player's loadout, and the cinematic should communicate "this card is reshaping that ability."

**Tone selection.** Mastery card plays always use `tone: 'dawn'` regardless of the card's base color or hero element. The dawn-bright palette is the canonical signal for "an ability is being upgraded" and matches the dawn-bright mastery indicator that will subsequently render on the row.

**Choreography (~2400ms total — longer than a standard ~1700ms card play):**

| Phase | Duration | What happens |
|-------|----------|--------------|
| Card lift + scale-in | 300ms | Standard CardPlayOverlay open: card slides up from hand, scales to 168×230px at centre. Dawn-tinted backdrop fades in. |
| Card hold | 400ms | Player reads the Mastery card's name + effect. Same as standard card-play hold. |
| **Targeting beam** | 400ms | A dawn-bright beam (~3px wide with 6px outer glow) animates from the card's bottom edge to the **target ability row** on the ladder underneath. The beam grows from card → row (not row → card) so the visual reads "the card is reaching toward the slot it will upgrade." Beam easing: `cubic-bezier(0.2, 0.7, 0.2, 1)` (fast start, settle into the row). |
| **Target row pre-pulse** | 200ms | Once the beam connects, the target ability row pulses dawn-bright (border + value badge glow lift to peak intensity for 200ms). This is "the row recognizes the upgrade." |
| **Morph** | 600ms | The card dissolves (fade-out + slight scale-down). Simultaneously the target ability row re-renders against the upgraded `LadderAbility` data: for `kind: 'modifier'`, the value badge increments to the new number with the standard `scaling-pulse` animation; for `kind: 'transformation'`, the name + combo glyphs + value + effect text all crossfade to the replacement ability's data (300ms crossfade, then 300ms settle with `mastery-pulse` on the new ✦ indicator beginning). |
| Card slide-to-discard | 300ms | Standard end: the (now-faded) card slides toward the discard pile and is removed. Overlay backdrop fades out. |
| Settle | 200ms | Ladder is fully updated with the mastery indicator (✦) now permanently active on the upgraded row. Player can resume planning. |

**Targeting beam visual:**

```css
.masteryBeam {
  position: absolute;
  width: 3px;
  background: linear-gradient(180deg, var(--dawn-bright) 0%, rgba(253, 224, 136, 0.4) 100%);
  box-shadow: 0 0 6px var(--dawn-bright), 0 0 12px rgba(253, 224, 136, 0.5);
  border-radius: 1.5px;
  transform-origin: top center;
  animation: mastery-beam-extend 400ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
  z-index: 41;  /* above overlay backdrop, below the played card */
}
@keyframes mastery-beam-extend {
  0%   { transform: scaleY(0); opacity: 0; }
  20%  { opacity: 1; }
  100% { transform: scaleY(1); opacity: 0.9; }
}
```

The beam's `top` and `height` are computed dynamically: `top` = card's bottom-edge Y; `height` = distance from card bottom to target row center (computed from the row's `getBoundingClientRect()`). The component uses a single React ref on each ladder row, exposed via `LadderAbility.rowRef`, so the overlay can compute the geometry without DOM queries.

**Why beam → row, not row → card.** The beam animates *from* the card *toward* the row. This reads as "the card is reaching out to upgrade the slot." The reverse direction (row pulses, then beam shoots back to card) would feel like the row is consuming the card — wrong directional metaphor. The slot is the *target*, the card is the *agent*.

**Reduced motion mode.** Per the standard reduced-motion convention (Part 1.6), the targeting beam is replaced with a static 200ms opacity fade-in/out on a thin dawn-bright divider between card and row. The morph crossfade timing is preserved (visual identity matters more than animation duration in this mode).

**Engine flow during the cinematic:**

1. Player taps Play in ExpandedCardView → UI dispatches `play-card` with `cardId`
2. Engine writes `heroSnapshot.masterySlots[card.occupiesSlot] = { cardId, upgrade }` and recomputes the affected ladder row(s) immediately
3. The UI's `useResolutionTimer` hook picks up the `'mastery'` resolution variant and orchestrates the 2400ms timeline above
4. After settle, engine has finished emitting its `card-played` + `ability-upgrade` event stream; the ladder is in its new steady-state. The UI's cinematic timer (see Part 7.4 on snapshot-and-interpolate) animates over the already-applied engine state
5. Activity Log entry written: `"Mastery applied to {tier} — {summary}"` (see Part 6.5.5)

**Acceptance criteria for Mastery variant:**

1. CardPlayOverlay opens with dawn-tinted backdrop for all Mastery card plays regardless of hero element.
2. The targeting beam visibly connects the card's bottom edge to the center of the target ability row, with geometry recalculated per render (not hardcoded coordinates).
3. The target row's pre-pulse fires only after the beam has connected (not before).
4. For `kind: 'modifier'`, the value badge updates with the scaling-pulse animation; the ability name and combo glyphs do NOT change.
5. For `kind: 'transformation'`, the ability name, combo glyphs, value badge, and effect text ALL crossfade to the replacement ability's data within the 300ms morph crossfade window.
6. The mastery indicator (✦) appears on the row exactly once at the end of the morph and pulses indefinitely with `mastery-pulse` until the slot is replaced by another Mastery or the match ends.
7. If a second Mastery card is played targeting the same tier, the cinematic runs again — the previous Mastery's visuals are replaced (no stacking indicators, no double-✦).
8. The full 2400ms beat completes before the next user action is accepted. No taps register during the cinematic.

### 6.7 ExpandedAbilityView component

**Visual reference:** `design.html#p3-ability-modal` shows the modal in detail.

When the player taps an ability row in the AbilityLadder, the ExpandedAbilityView opens — a constrained modal showing the ability at large size with full effect text, the combo readiness panel comparing required vs. current dice, lethal condition callout (T4 only when applicable), and Cancel/Activate buttons. **This replaces the prior "tap row + action-bar Confirm" two-step flow for offensive abilities.** With this modal-based commit pattern, the action bar's right slot during planning is now used for the **Skip Turn** button (see Part 2.8) rather than a planning hint.

```typescript
// ui/components/overlays/ExpandedAbilityView/ExpandedAbilityView.tsx

export type ExpandedAbilityViewProps = {
  active: boolean
  ability: LadderAbility | null    // The ability being viewed, null if not active
  currentDice: DieFace[]           // The player's currently locked dice for the readiness panel
  activatable: boolean             // Computed: combo met AND timing allows
  unactivatableReason?: string     // Human-readable reason if !activatable, e.g., "Need 1 more ☼"
  onCancel: () => void
  onActivate: () => void
}
```

**Container layout:**

The ExpandedAbilityView covers the same area as ExpandedCardView — dice tray + middle band + self strip + hand band, leaving only the action bar visible. See Part 6.6 for the rationale of why the hand is covered (unlike DefensiveOverlay).

```css
.expandedAbilityView {
  position: absolute;
  inset: 16.5% 0 7.5% 0;     /* Spans dice tray + middle band + self strip + hand; only action bar visible */
  background: linear-gradient(180deg, rgba(14, 14, 28, 0.97), rgba(10, 10, 20, 0.96));
  backdrop-filter: blur(8px);
  border-top: 1px solid var(--gold);
  border-bottom: 1px solid var(--gold);
  box-shadow:
    inset 0 0 60px rgba(212, 165, 72, 0.10),
    0 0 30px rgba(212, 165, 72, 0.3);
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 50;
}
```

For T4 lethal abilities, the border and glow shift to crimson:

```css
.expandedAbilityView[data-lethal="true"] {
  border-top-color: var(--crimson-bright);
  border-bottom-color: var(--crimson-bright);
  box-shadow:
    inset 0 0 60px rgba(196, 56, 72, 0.12),
    0 0 30px rgba(196, 56, 72, 0.35);
}
```

Heraldic corner ornaments (◆ pattern) match the rest of the modal system.

**Children, top to bottom:**

1. **Header strip** — "— Ability —" eyebrow label (or "— Lethal Strike —" for lethal T4); close X button at the top-right (44×44 tap target)

2. **Ability hero block** — large AbilityValueBadge (56×56 with `size="large"`) on the left, ability name + tier label on the right
   - Name: Cinzel 18px, 700 weight, gold-bright (or crimson-bright for lethal)
   - Tier label below name: JetBrains Mono 9px, bone-dim, e.g. `TIER 4 · ULTIMATE`

3. **Effect prose** — Full structured effect text from `ability.fullEffect`, rendered using the same segment grammar as ExpandedCardView. This is **the primary reading surface of the modal** — players need room to absorb lengthy effect descriptions (conditional clauses, multi-part effects, keyword definitions). Sizing reflects that role:
   - Cormorant Garamond **14.5px** (larger than the ladder row's 11px effect text), line-height **1.55**, bone color
   - **Padding 14px** on all sides for breathing room around the text
   - **`min-height: 64px`** so even short descriptions (e.g. "Heal 4 HP") get visual presence in the modal — they don't collapse to a thin sliver that looks like an afterthought
   - **`flex-shrink: 0`** so the section keeps its minimum size when the modal has other sections (combo readiness, lethal callout) competing for vertical space — combo readiness can scroll within itself if needed, but the description never gets squeezed
   - `value` segments in ember-bright (damage) or green-bright (heal)
   - `keyword` segments in gold-bright Cinzel with subtle underline (1px gold-dim border-bottom)

   > **Why the description gets generous space.** Ability text in the ladder rows is necessarily terse — `Deal 5 ub · +Sanctuary · spend Radiance` — because each row has ~50px of effect-text width to work with. The modal is the only surface where the full rules text lives: conditionals ("if the target has Burn"), interactions ("consumes Frost-bite, +2 dmg per stack consumed"), keyword glossary references, scaling formulas. Compressing this to 13px tight text was readable but felt cramped; lengthy descriptions extended beyond what the box visually invited. The larger sizing makes the modal's description block feel like the **primary reading surface** it actually is.

4. **Combo readiness panel** — see detailed spec below. Side-by-side comparison of required combo and current dice.

5. **Lethal condition callout** (T4 lethal only) — bordered crimson block showing the lethal threshold with current state indicator:
   ```
   ┌────────────────────────────────────┐
   │ ⚠ LETHAL · TARGET HP ≤ 10          │
   │ Current target HP: 8 (lethal ready) │
   └────────────────────────────────────┘
   ```

6. **Action buttons** — Cancel (default, flex 1) and Activate (primary, flex 1.5). **Both buttons are 44px tall** with 12-13px Cinzel labels and stronger shadows than action-bar buttons. Same sizing as ExpandedCardView's Play/Cancel buttons (see Part 6.6 for the rationale and exact spec). The Activate button's chevron arrow renders at 16px.

   **Lethal variant:** when the row being inspected is a T4 ultimate AND the lethal condition is met, the Activate button switches to the **crimson** variant with the label "Lethal Strike" instead of "Activate". This is the **only** commit path for lethal — the lethal state is already triple-signaled across the interface (opponent strip crimson tint, phase banner "Lethal · {ability}", T4 ladder row crimson pulse), and the unified modal commit avoids creating two parallel commit paths for the same action. The canonical flow: tap the lit T4 row → modal opens in crimson variant → tap "Lethal Strike" to fire.

**Combo readiness panel — detailed spec:**

This is the modal's distinctive element. It shows the player **exactly what they need vs. what they have**, broken down by die face.

```
┌──────────────────────────────────────────┐
│  COMBO READINESS                          │
│  ─────────────────────────────────────    │
│  ☼  Sun       2 needed  ·  ✓ 2 locked     │
│  ⚔  Sword     2 needed  ·  ✗ 1 locked     │
│  ◈  Dawn      1 needed  ·  ✗ 0 locked     │
└──────────────────────────────────────────┘
```

**Why per-face tallies, not 1:1 alignment.** Combos in this game match by **face count, not by position**. If the combo needs 2 ☼ + 2 ⚔, the player satisfies it with any dice showing those faces (in any order). A position-by-position UI would mislead newer players into thinking "die 1 must be ☼." The tally view is honest: each required face shows need-count vs. have-count.

Layout structure:

```jsx
<div className={s.comboReadiness}>
  <div className={s.eyebrow}>— Combo Readiness —</div>
  {comboBreakdown.map(({ face, needed, locked }) => (
    <div className={s.readinessRow} data-met={locked >= needed} key={face}>
      <span className={s.facePip}>
        <span className={s.faceGlyph}>{FACE_GLYPH[face]}</span>
      </span>
      <span className={s.faceName}>{FACE_NAME[face]}</span>
      <span className={s.tally}>
        <span className={s.needed}>{needed} needed</span>
        <span className={s.sep}>·</span>
        <span className={s.lockedIndicator}>{locked >= needed ? '✓' : '✗'}</span>
        <span className={s.locked}>{locked} locked</span>
      </span>
    </div>
  ))}
</div>
```

CSS styling:

```css
.comboReadiness {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--frame-stroke);
  border-radius: 4px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.readinessRow {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Cormorant Garamond', serif;
  font-size: 13px;
  color: var(--bone);
}
.readinessRow[data-met="true"] {
  color: var(--bone-bright);
}
.readinessRow[data-met="false"] {
  color: var(--bone-dim);
}
.facePip {
  width: 22px;
  height: 22px;
  background: rgba(20, 24, 40, 0.6);
  border: 1.5px solid var(--bone-deeper);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.readinessRow[data-met="true"] .facePip {
  background: linear-gradient(135deg, rgba(60, 44, 12, 0.8), rgba(40, 30, 10, 0.6));
  border-color: var(--gold);
  box-shadow: 0 0 6px rgba(212, 165, 72, 0.5);
}
.faceGlyph {
  font-family: 'Cinzel', serif;
  font-size: 12px;
  font-weight: 700;
  color: var(--bone-deeper);
}
.readinessRow[data-met="true"] .faceGlyph {
  color: var(--gold-bright);
  text-shadow: 0 0 4px rgba(240, 198, 104, 0.6);
}
.faceName {
  font-family: 'Cinzel', serif;
  font-size: 11px;
  letter-spacing: 0.05em;
  flex-shrink: 0;
  min-width: 50px;
}
.tally {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
}
.lockedIndicator {
  font-size: 13px;
}
.readinessRow[data-met="true"] .lockedIndicator { color: var(--gold-bright); }
.readinessRow[data-met="false"] .lockedIndicator { color: var(--ember); }
```

**Computing the breakdown** *(symbol-count combos only):*

The function below builds a face-by-face tally that works for `symbol-count` combos. For other combo kinds, the readiness panel renders different content per the table at the start of this section (n-of-a-kind: one neutral row; straight: one consecutive-numbers row; compound: multi-row with and/or operator). Engineers extending the readiness panel to non-symbol-count combos must add per-kind builders following the same pattern.

```typescript
// Symbol-count breakdown: tally required vs. locked per symbol.
// For n-of-a-kind, straight, and compound combos, use kind-specific builders.

function buildSymbolCountBreakdown(
  combo: Extract<AbilityCombo, { kind: 'symbol-count' }>,
  currentDice: Die[]
): ComboBreakdown[] {
  // For symbol-count, the combo is { kind, symbol, count } — N pips of one symbol.
  const lockedMatches = currentDice
    .filter(d => d.locked && d.faces[d.current].symbol === combo.symbol)
    .length
  return [{
    symbol: combo.symbol,
    needed: combo.count,
    locked: lockedMatches,
  }]
}
```

For `n-of-a-kind`, the readiness panel renders one row like *"Any 3 dice matching — currently 2 locked (showing 4)"*. For `straight`, one row like *"Any 4 consecutive numbers — currently 2-3 locked (window 2-3-4-5)"*. For `compound`, one row per term with the operator between them (rendered as a small `+` or `/` glyph between adjacent row groups).

**Activate button states:**

| State | Activate button | Hint text |
|-------|----------------|-----------|
| All combo requirements met, eligible | Primary variant, gold gradient | none |
| Combo not met | Disabled variant | "NEED " + unmet-face summary, e.g., "NEED 1 MORE ⚔ AND 1 MORE ◈" |
| Wrong timing (e.g., turn not active) | Disabled variant | "NOT YOUR TURN" |
| Ability is T4 lethal and combo met | Primary variant, crimson gradient ("LETHAL STRIKE") | "WILL DEAL LETHAL DAMAGE" |

The hint text for an unmet combo lists each unmet face with the count needed:
```typescript
function unmetReason(breakdown: ComboBreakdown[]): string {
  const unmet = breakdown.filter(b => b.locked < b.needed)
  if (unmet.length === 0) return ''
  const phrases = unmet.map(b => `${b.needed - b.locked} more ${FACE_GLYPH[b.face]}`)
  return `NEED ${phrases.join(' AND ')}`
}
```

**Entry/exit animation:**

```jsx
<motion.div
  className={s.expandedAbilityView}
  initial={{ opacity: 0, scale: 0.92 }}
  animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.92 }}
  transition={{ duration: 0.25, ease: EASING.default }}
>
  {/* ... */}
</motion.div>
```

Standard 250ms entry/exit with subtle scale. Under `prefers-reduced-motion`, only opacity fades.

**Dismiss behavior:**

1. Tap Cancel → `onCancel()` fires, modal closes.
2. Tap X button → `onCancel()` fires.
3. Tap outside the panel content (in the modal background) → `onCancel()` fires.
4. Hardware back button (Android) → `onCancel()` fires.
5. Tap Activate (when activatable) → `onActivate()` fires; modal closes immediately and the engine begins resolution via the existing pipeline.

**Re-entry on dice state change:**

If the player dismisses the modal, rolls more dice, then re-taps the same ability row, the modal re-opens with **updated combo readiness**. The modal is stateless on the ability — it reads `currentDice` from props every render, so re-opens reflect the latest engine state.

**Acceptance criteria:**

1. Renders the ability's hero block (badge + name + tier label) with correct variant tinting based on eligibility.
2. Effect prose renders the full `fullEffect` segments with correct typography per segment kind.
3. Combo readiness panel shows one row per **unique required face**, with accurate need/have counts derived from the current dice.
4. Activate button is enabled only when all face requirements are met AND turn is active. Disabled state shows the appropriate hint text.
5. For T4 lethal abilities with combo met, the Activate button switches to crimson "LETHAL STRIKE" variant and the lethal condition callout is visible above the buttons.
6. Tap on Cancel, X, background, or back button all dismiss with 200ms fade-out.
7. While ExpandedAbilityView is active, the underlying ladder is non-interactive. Defensive/spend prompts that fire while open queue and auto-dismiss the ability view first.
8. Long-press tooltip cannot open over the expanded view (already showing full detail).

> **Note on tap on ineligible rows:** The modal opens for **any** ability tap, eligible or not. Players can inspect what a higher-tier ability needs without rolling for it — this supports learning the combo grammar and planning multi-turn strategies. The Activate button is the gatekeeper, not the modal itself.


---

## Part 7 — Match Flow

This part specifies the **lifecycle** of a match from start to summary screen, including the turn loop, phase transitions, end-of-match detection, and how the UI coordinates with the engine across these transitions. Parts 2–6 specified individual components; this part specifies how they work together over time.

**Visual reference:** `design.html#p1-summary` shows the post-match summary; the rest is interaction model, not visual.

### 7.1 Match lifecycle overview

A match progresses through 9 engine phases, plus a small number of UI-only states layered on top.

**Engine phases** (matches `PhaseEnum` in Part 0.3):

```
pre-match
   ↓ start-match action
upkeep ─→ income ─→ main-pre ─→ offensive-roll ─→ defensive-roll ─→ main-post ─→ discard
   ↑                                                                                  │
   └──────────────────────────── (next player's turn) ────────────────────────────────┘
                                                                                       
                                          match-end (set when winner emerges from any phase)
```

| Engine phase | What happens | UI surface |
|--------------|--------------|------------|
| `pre-match` | Match not yet started | HeroSelectScreen |
| `upkeep` | Status ticks (Burn, Regen, etc.) fire | MatchScreen + UpkeepFOP (status-tick scene) |
| `income` | CP gain → card draw (in this order — see Part 7.5) | MatchScreen + UpkeepFOP (cp + draw scenes) |
| `main-pre` | Pre-roll planning window; main-phase cards playable | MatchScreen (idle planning) |
| `offensive-roll` | Active rolling; `rollAttemptsRemaining` decrements per roll-dice action | MatchScreen with dice tray active |
| `defensive-roll` | `pendingAttack` is set; defender picks defense | MatchScreen + DefensiveOverlay |
| `main-post` | Post-resolution window; main-phase cards still playable; turn can be ended | MatchScreen (post-resolution planning) |
| `discard` | Discard step before turn flip | MatchScreen (brief, ~300ms) |
| `match-end` | Winner is set; results displayed | MatchSummaryScreen |

**UI-only states layered on top** (computed from engine events, NOT engine phases):

| UI state | When | What it represents |
|----------|------|-------------------|
| `match-intro` | Briefly between `pre-match` and the first `upkeep` | The 1500ms intro cinematic — see Part 7.2 |
| `rolling` | During the 600ms dice tumble animation | While `dice-rolled` events are animating to settled state |
| `resolving` | Between `ability-triggered` event and final `damage-dealt`/`hp-changed` | While the FOP cinematic plays — see Part 7.4 |
| `instant-prompt` | When an Instant-eligible card triggers (`pendingCounter` / `pendingStatusRemoval` is set) | The reactive prompt window — see Part 6.4 |

> **Why the split.** Engine phases are the canonical state machine — they survive serialization, advance deterministically on engine actions, and are the source of truth for "what can the player do right now." UI-only states are projections on top, used for animation pacing and overlay routing. The PhaseBanner (Part 2.6) reads both: it derives its display copy from the engine phase, but can also show transient states like "Rolling…" during the UI tumble.

State transitions are driven by engine events; the UI never advances state autonomously.

### 7.2 PRE_MATCH → MATCH_INTRO transition

**Trigger:** Player taps "Begin Match" on the HeroSelectScreen (see Part 8).

**Sequence:**

1. UI dispatches the `start-match` action with the chosen hero IDs, decks, and loadouts (see Part 0.4 Convention 4 for the action shape).
2. Engine initializes the match state and emits an initial state snapshot.
3. UI's router navigates to `/match`.
4. MatchScreen mounts with `matchState === 'intro'`.
5. The intro overlay renders for ~1500ms, then auto-dismisses.

**Intro overlay specifications:**

A brief cinematic frames the match. Not a full takeover like the ultimate — more like an opening credit.

```typescript
// ui/components/screens/MatchScreen/MatchIntro.tsx

export type MatchIntroProps = {
  active: boolean
  playerHero: HeroId
  opponentHero: HeroId
  onComplete: () => void
}
```

Layout:
- Full screen, position absolute, inset 0
- Background: `linear-gradient(180deg, var(--night-stone) 0%, var(--night-deep) 100%)`
- Two columns: player on left, opponent on right
- Center separator: a thin vertical gold rule with a `◆` diamond in the middle

Per-column content:
- Hero portrait (80×100px) with gold border
- Hero name in Cinzel 18px, hero-element-tinted color
- Archetype label in Cormorant Garamond italic 13px, `var(--bone-dim)`

Bottom of screen: "Match begins…" in Cinzel 10px, 0.4em letter-spacing, `var(--gold)`, fades in last.

**Timeline:**

| Time | Event |
|------|-------|
| 0ms | Component mounts, background fades in (300ms) |
| 200ms | Player portrait scales in from 0.8 → 1.0 (250ms, ease-out) |
| 400ms | Player name + archetype fade in (200ms) |
| 600ms | Opponent portrait scales in (250ms) |
| 800ms | Opponent name + archetype fade in (200ms) |
| 1100ms | "Match begins…" fades in (200ms) |
| 1500ms | Component fades out (300ms), calls `onComplete` |
| 1800ms | Component unmounts |

**Acceptance criteria:**

1. Intro plays exactly once per match. Re-entering the same match (e.g., from a backgrounded state) skips the intro.
2. Tap anywhere during intro skips it (jumps to `onComplete` immediately).
3. Under reduced motion, scale-in animations become opacity fades; total duration unchanged.

### 7.3 The turn loop

Once intro completes, the match enters the turn loop. Each turn cycles through phases:

```
TURN_START → UPKEEP → ROLL → PLAN → RESOLVE → TURN_END
```

| Phase | Player input | UI shows | Duration |
|-------|--------------|----------|----------|
| TURN_START | None | Phase banner: "{player}'s Turn" | ~500ms (auto-advance) |
| UPKEEP | None | Sequential upkeep beats (status ticks → CP gain → draw) via UpkeepFOP — see Part 7.5 for full choreography | 1600-2400ms typical |
| ROLL | Tap dice to lock; tap Reroll | Dice tray active, ladder shows live combo states | Until player taps Activate / Play, or rerolls used up |
| PLAN | Same as ROLL, but no rerolls left | Same as ROLL with disabled reroll button | Until Activate / Play |
| RESOLVE | None (blocked) | FieldOfPlay overlay plays | ~2000ms (or ~3500ms for ultimate) |
| TURN_END | None | Phase banner: "{next player}'s Turn" | ~300ms (auto-advance to next TURN_START) |

> **Why upkeep is at turn start, not turn end.** Status ticks are a *consequence* of the previous turn's actions — players need to see "what happened to me overnight" before they plan their next move. Drawing a card and gaining CP before the main phase preserves planning agency (the new card may change strategy; CP affordability matters for ability picks). See Part 7.5 for the full rationale.

The turn loop is driven by **engine action dispatches**. The UI dispatches actions; the engine resolves them and updates state. The UI subscribes to state changes and re-renders accordingly.

**Action → state transition table:**

| Engine state phase | UI dispatched actions | Triggered by | Result |
|---------------------|------------------------|--------------|--------|
| ROLL | `{ kind: 'toggle-die-lock', dieIndex }` | Tap on a die in the dice tray | Engine toggles the lock, recomputes combo states for all ladder rows |
| ROLL | `{ kind: 'roll-dice' }` | Tap the action bar's Roll/Reroll button | Engine re-rolls unlocked dice; UI plays dice tumble animation (600ms) before showing new state |
| ROLL or PLAN | `{ kind: 'select-offensive-ability', abilityIndex }` | Tap Activate inside the ExpandedAbilityView modal | Engine begins resolution; UI flips to RESOLVE phase |
| ROLL or PLAN | `{ kind: 'play-card', cardId, ... }` | Tap Play inside the ExpandedCardView modal | Engine begins card resolution; UI flips to RESOLVE phase with card-play scene |
| Defensive prompt | *(UI-local selection)* | Tap on a defensive row inside the DefensiveOverlay | UI shows selected state — no action dispatched yet |
| Defensive prompt | `{ kind: 'select-defense', abilityIndex }` | Tap Confirm Pick in the DefensiveOverlay | Engine resolves defense roll in one step; UI plays defense resolution |
| Spend prompt | *(UI-local selection)* | Tap on a spend option inside the SpendOverlay | UI shows selected state |
| Spend prompt | `{ kind: 'spend-bank', amount }` | Tap Confirm Spend | Engine applies the (possibly partial) spend; UI plays brief resolution |
| Spend prompt | `{ kind: 'decline-bank-spend' }` | Tap Skip Spend | Engine proceeds without spend |

> **Modal-driven dispatches for offensive plays.** `select-offensive-ability` and `play-card` are dispatched from the respective inspection modals (ExpandedAbilityView for abilities, ExpandedCardView for cards) — not from the action bar. The action bar's Roll/Reroll button is the only commit action that fires directly from the action bar during planning. See Part 2.8 for the action bar's planning-phase configuration.

> **No action envelope.** *(Revision 1.1)* An earlier draft of this section specified a versioned `{ type, version, payload }` envelope around every action. That contradicted Part 0.4 Convention 4, which is canonical: actions are **flat kebab-case discriminated unions** with no envelope. Versioning, player authentication, and client timestamps are the multiplayer transport layer's concern — it can wrap engine actions without the engine or UI changing.

### 7.3.5 Opponent turn — what the viewer sees and can do

During the opponent's turn, the viewer is a **transparent spectator**: they see the opponent's dice rolls and lock decisions, watch the opponent's ability ladder light up with eligibility states, and can play **Instant cards** from their hand as interrupts. The opponent (AI in MVP, remote player in multiplayer) plays at a brisk pace — fast enough not to drag, slow enough that each decision is legible.

This section ties together what's specified across Parts 2.7 (DiceTray), 3.1 (AbilityLadder), 2.9.3 (HandCard), and 1.9 (Card type) into a single coherent flow.

#### 7.3.5.1 The display rule: middle band shows the active player

The dice tray and ability ladder render the **active player's** content, not the viewer's:

| Component | What it shows |
|-----------|---------------|
| `<DiceTray>` | Dice for `gameState.currentPlayer` — the active player's roll state, locks, and tumble animations |
| `<AbilityLadder>` | Abilities for `gameState.currentPlayer` — their 4 rows with live combo states as their dice update |
| `<OpponentStrip>` / `<SelfStrip>` | Always render their assigned `playerId` regardless of whose turn it is — the strips are persistent context |
| `<Hand>` | Always renders the **viewer's** hand (the viewer can play Instants during opponent turn) |
| `<ActionBar>` | Renders the viewer's available actions; during opponent turn, becomes the opponent-turn indicator (see 7.3.5.4) |
| `<PhaseBanner>` | Reflects the active player's current phase (see 7.3.5.5 for copy) |

**Why this works.** The middle band is the "current action surface." On your turn, your dice and your ladder; on the opponent's turn, their dice and their ladder. The viewer follows the action by watching the same band where their own decisions normally happen — no separate "spectator pane." This eliminates the need for OpponentDicePreview / OpponentLadderPreview components in single-player; the existing components just receive a different `playerId`.

**Component contract update.** Per Part 0.4 multiplayer-ready conventions, components already take `playerId: PlayerId`. The parent (`<MiddleBand>` or `<ScreenBands>`) reads `gameState.currentPlayer` from state and passes it down. No new props on DiceTray or AbilityLadder beyond what already exists; the `interactable: boolean` prop (DiceTray) and `interactable: boolean` prop (AbilityLadder — added in this round per Part 3.1) carry the "is this the viewer's turn" signal.

#### 7.3.5.2 What the viewer can do during opponent turn

| Surface | Viewer can | Viewer cannot |
|---------|-----------|---------------|
| Dice tray | Watch the AI roll, lock, and reroll | Tap dice (no-op per scenario 9.5.2) |
| Ability ladder | Watch combo states evolve, see eligible/lethal rows light up. Tap any row to open `<ExpandedAbilityView>` in **read-only mode** (Activate button hidden, replaced with Close) to inspect what the opponent might commit | Activate an ability (the modal has no Activate button when `interactable=false`) |
| Hand | Tap Instant cards to open ExpandedCardView and play them as interrupts. Long-press any card for tooltip | Tap non-Instant cards (no-op + brief toast: "Cannot play during opponent's turn") |
| Action bar | Read the opponent-turn indicator (7.3.5.4) | Tap any button (Skip Turn is disabled per Part 2.8) |
| Opponent strip | Long-press for hero info modal (deferred per Part 2.2) | — |
| Self strip | Long-press for hero info modal (deferred per Part 2.2) | — |

#### 7.3.5.3 AI pacing — brisk, not instant

The AI's turn must feel **purposeful** — each decision visible long enough for the viewer to register it — but **never drag**. Total opponent turn target: **6–10 seconds** for a typical turn, ~12 seconds for a turn with ultimate.

> **These are AI-side pacing targets, not engine-enforced floors.** Per Decision 1 (Batch 4), the bible's earlier specification of engine-enforced pacing floors (150ms inter-lock, 800ms pre-commit hold) has been retired. The engine does NOT delay actions to guarantee reactive windows — actions resolve immediately. Instead, the AI's controller is implemented to space its actions on the cadences below natively, which provides a viewing rhythm without artificial engine delays. For PvP this means the architecture relies on engine's trigger-based Instant model (see 7.3.5.6) rather than universal reactive windows. The durations below are *AI behaviour*, not engine guarantees.

| Beat | Duration (AI pacing target) | What's happening |
|------|------------------------------|------------------|
| TURN_START banner | 500ms | "Opponent's Turn" banner fade-in/hold/fade-out (same timing as player's TURN_START) |
| UPKEEP | 1600–2400ms | Status ticks, draw, CP gain — same UpkeepFOP choreography as the player (Part 7.5) |
| First dice roll (auto) | 600ms tumble + 300ms hold | Dice tumble animation plays; final faces visible briefly before locking begins |
| Each LOCK decision | ~300ms per die (AI cadence) | The AI's controller spaces lock decisions ~300ms apart so each lock's scale-pulse animation is visible. The engine itself does not enforce this gap — the AI's planner just paces this way. |
| Each REROLL | 600ms tumble + 300ms hold + lock cycle | Same as first roll; repeat up to 2× for the 3 reroll budget |
| Pre-commit hold (AI-only) | ~400ms between final lock and commit action | The AI's controller waits ~400ms before dispatching the commit, giving the viewer a moment to read the locked dice. Engine has no hold — a remote PvP human can commit instantly. Instants surface via engine triggers (see 7.3.5.6), not via this AI pause. |
| RESOLVE | ~2000ms (or ~3500ms ultimate) | Same FOP cinematic as a player ability — no abbreviation |
| TURN_END | 300ms | Banner crossfade to "Your Turn" |

**Total examples** (AI pacing, ~5 locks per commit cycle):
- 0 rerolls, no ultimate: ~500 + 1800 + 900 + 1500 + 400 + 2000 + 300 = **~7.4s**
- 2 rerolls, no ultimate: ~500 + 1800 + 900 + 600 + 900 + 600 + 900 + 1500 + 400 + 2000 + 300 = **~10.4s**
- 1 reroll, fires ultimate: ~500 + 1800 + 900 + 900 + 900 + 1500 + 400 + 3500 + 300 = **~10.7s**

If the AI's controller exceeds these totals by more than ~15%, something has stalled — see Part 7.9 for recovery.

**No "thinking" delays.** The AI does not show a "thinking…" spinner or artificial pause. Decisions emit as engine actions and the UI plays the same animations a human player's actions would trigger. The pacing emerges from the AI's controller spacing its actions, not from added latency on the engine side.

**AI does not open inspection modals.** When the AI commits an ability, the engine flips straight to RESOLVE and the FieldOfPlay cinematic plays. No ExpandedAbilityView pop-up — that modal is for the *viewer's* decision-making. The viewer learns what the AI committed by reading the FOP cinematic's ability name display (Part 5.2).

**AI card plays.** When the AI plays a card, the CardPlayOverlay (Part 6.6.5) plays the cinematic the same way a viewer's card play would render. The viewer sees the card flip up from the **opponent's deck-indicator pair** (top-right name row), animate to centre at large readable size for the hold duration, then dissolve. This mirrors the viewer's card-play visual but originates from the opponent's deck slot rather than from the viewer's hand band.

#### 7.3.5.4 Action bar during opponent turn

Per Part 2.8, the action bar in opponent-turn state is:

```
[ Skip Turn (disabled) ][ Opponent's Turn — Hero Name (indicator) ]
```

The right slot — normally Reroll · N or contextual confirm button — renders as a **non-interactive indicator**:

- Background: subtle ember tint (`linear-gradient(180deg, rgba(240, 104, 72, 0.08), rgba(240, 104, 72, 0.03))`) to reinforce "the opponent is acting"
- Text: `"Opponent · {phase}"` where `{phase}` is one of `Upkeep`, `Rolling`, `Planning`, or the ability name during RESOLVE
- Font: Cinzel 11px, weight 500, color `var(--bone-dim)`, letter-spacing 0.15em, uppercase
- Border: `1px solid rgba(240, 104, 72, 0.15)` — same height as a button (44px) so the action bar doesn't shift vertically when turns swap
- No tap handler — the indicator is purely informational

When the turn returns to the viewer (TURN_END → TURN_START with currentPlayer === viewerId), the right slot transitions back to the normal action button set with a 200ms crossfade.

#### 7.3.5.5 Phase banner copy during opponent turn

The banner mirrors the player's phase progression with an "Opponent · " prefix:

| Active player phase | Player's banner | Opponent's banner |
|---------------------|-----------------|-------------------|
| TURN_START | "Your Turn" | "Opponent's Turn" |
| UPKEEP — status tick | "Upkeep · Burn Ticks" | "Opponent · Upkeep · Burn Ticks" |
| UPKEEP — card draw | "Upkeep · Draw" | "Opponent · Upkeep · Draw" |
| UPKEEP — CP gain | "Upkeep · +1 CP" | "Opponent · Upkeep · +1 CP" |
| ROLL | "Roll · {N} of 3" | "Opponent · Roll · {N} of 3" |
| PLAN | "Planning" | "Opponent · Planning" |
| RESOLVE | "{Ability Name}" (or "Lethal · {Ability Name}") | "{Ability Name}" — same treatment regardless of who's attacking |
| TURN_END | "Opponent's Turn" (transition target) | "Your Turn" (transition target) |

**Why include the reroll counter on opponent's turn.** The viewer benefits from knowing "the AI has 1 reroll left" — it cues them on whether the AI might still change its lock pattern. Mirrors the player's experience.

**RESOLVE banner deliberately neutral.** During the FOP cinematic, the banner shows the ability name (e.g., "Wolf's Howl") with no "Opponent · " prefix because the elemental tone backdrop and the strip flash on the receiving player already communicate "this is happening to YOU" — the banner doesn't need to repeat it.

#### 7.3.5.6 Instant cards — engine's trigger-based reactive model

The viewer may play **Instant cards** (`kind: 'instant'`) only when the engine surfaces an opportunity matching the card's `trigger`. There is no free reactive window during the opponent's UPKEEP/ROLL/PLAN phases — Instants are event-driven, not time-window-driven.

> **Bible v0 had this wrong.** Earlier drafts described a "free reactive window" where the viewer could play any Instant card at any pause during the opponent's turn, backed by an 800ms engine-enforced pre-commit hold. Per Decision 1 (Batch 4), this model has been retired. Engine reality: each Instant has a `trigger: CardTrigger` declaring *which engine event* it responds to. The engine surfaces an Instant-play opportunity ONLY when the current event matches the trigger — typically via `pendingCounter`, `pendingStatusRemoval`, or `choreoStore.instantPrompt`. This is the same model MTG and similar card games use for reactive cards.

**How Instants surface during opponent's turn.**

The engine emits events as the opponent acts. For each event, the engine checks the viewer's hand for Instant cards whose `trigger` matches:

| Engine event | Triggers that match | Example v1 Instant |
|--------------|---------------------|--------------------|
| Opponent commits an offensive ability | `{ kind: 'opponent-fires-ability' }` (optional `tierFilter`) | **Aegis of Dawn** (Lightbearer, signature) — fires when opponent commits any ability |
| Damage is about to land on viewer | `{ kind: 'self-takes-damage' }` | **Counterstrike** (Berserker, signature) — fires when viewer is being hit |
| Viewer is targeted by an ability (before damage) | `{ kind: 'self-attacked' }` | **Phoenix Veil** (Pyromancer, signature; oncePerMatch; gated to non-ultimate) |
| Opponent applies/removes a status on viewer | `{ kind: 'opponent-applies-status' }` / `{ kind: 'opponent-removes-status' }` | **Final Heat** (Pyromancer, signature) — fires when the opponent removes Cinder; deals 2 pure damage per stack stripped |
| Match state crosses a threshold | `{ kind: 'match-state-threshold', condition: ... }` | (no v1 cards; trigger reserved) |
| On owner's symbol rolled | `{ kind: 'on-symbol-rolled', symbols: [...] }` | (reserved for future content) |

When a trigger matches and the viewer has the card in hand, the engine writes one of:
- `pendingCounter` — for cards triggered by an opponent's card play that can be countered
- `pendingStatusRemoval` — for cards triggered by an attempt to strip the viewer's status
- `choreoStore.instantPrompt` (UI-side store) — for cards triggered by ability/damage events during the cinematic pipeline

The UI then displays an `<InstantPrompt>` modal (Part 6.4) listing the eligible cards. The viewer chooses one and confirms, or declines (the engine continues without the Instant firing).

**Real v1 Instant card registry.**

| Card | Hero | Cost | Trigger | One-shot |
|------|------|------|---------|----------|
| **Counterstrike** | Berserker | 2 | `self-takes-damage` | oncePerMatch |
| **Phoenix Veil** | Pyromancer | 4 | `self-attacked` (non-ultimate filter) | oncePerMatch |
| **Final Heat** | Pyromancer | 3 | `opponent-removes-status` (Cinder) — 2 pure damage per stack stripped | oncePerMatch |
| **Aegis of Dawn** | Lightbearer | 4 | `opponent-fires-ability` | oncePerMatch |

> **Bible v0 correction.** Earlier drafts listed Sanctuary, Faith, Steady, Sun's Blessing, and Vow of Light as Instants. Engine reality:
> - Sanctuary — confirmed `kind: 'main-phase'` (cost 3, −2 incoming until next turn), NOT an Instant
> - Faith — `kind: 'roll-phase'` (reroll a die during own roll phase), NOT Instant
> - Steady (engine: `lightbearer/steady-light`) — `kind: 'roll-phase'`, NOT Instant
> - Sun's Blessing — does not exist in engine content
> - Vow of Light — does not exist in engine content
>
> The four cards in the table above are the real v1 Instant registry.

**Instant card play flow (engine-driven).**

```
[Opponent commits an offensive ability]
   |
   | Engine emits ability-triggered event
   v
Engine checks viewer's hand: does anyone have an Instant matching
"opponent-fires-ability"? → Yes: Aegis of Dawn
   |
   v
Engine writes pendingCounter (or instantPrompt depending on trigger kind);
viewer's UI opens <InstantPrompt> modal
   |
   | Viewer taps "Play Aegis of Dawn" → engine dispatches respond-to-counter
   | with the cardId
   v
Engine resolves Aegis of Dawn's effect inline within the ongoing event flow
(NOT a state-save/restore — see Decision 6 / Part 7.4 snapshot-and-interpolate)
   |
   v
Engine continues the opponent's ability resolution with whatever modifications
Aegis applied (reduced damage, conditional negation, etc.)
   |
   v
Match continues
```

**Constraints (engine-enforced):**

1. **Instants fire only on matching triggers.** The viewer cannot play an Instant arbitrarily during the opponent's roll/plan — only when the engine surfaces a matching event.
2. **One Instant per prompt.** When the engine opens an Instant-play opportunity, the viewer plays one card or declines. Chaining requires the engine to emit a follow-up event that triggers another Instant.
3. **`oncePerMatch` Instants are consumed by playing them.** Engine tracks via `heroSnapshot.consumedOncePerMatchCards: CardId[]`.
4. **Resolution coordination.** The Instant's effect applies immediately to engine state (per Decision 6). The UI animates the change via snapshot-and-interpolate (Part 7.4) — no INSTANT_INTERRUPT save/restore mechanic.
5. **Non-Instant cards during opponent's turn.** Non-Instant cards (`kind: 'main-phase'`, `'roll-phase'`, `'mastery'`) are NOT playable during the opponent's turn. Hand renders them with the wrong-timing dim per Part 7.3.5.6 visual treatment (next paragraph).

**Visual treatment for non-Instant cards during opponent turn:**

- Card renders at normal size and position in the hand
- A **wrong-timing dim** overlay applies: `filter: brightness(0.55) saturate(0.7)`
- The border tint shifts to `rgba(212, 165, 72, 0.15)` (gold-dim) — distinct from the affordability-fail border (which is ember-tinted)
- Tap: brief deny-shake animation (50ms × 2 cycles) + toast `"Cannot play during opponent's turn"` (1500ms)
- Long-press: tooltip still opens — viewers can inspect their hand any time

**Instant cards visual treatment during opponent turn:**

- When NO Instant prompt is active: cards render at normal brightness but tapping shows a toast `"Wait for the trigger to fire this card"` — the card has a trigger that hasn't matched yet.
- When an `<InstantPrompt>` is active and a card matches the prompt: that card renders with a subtle dawn-bright glow indicating "playable now." Other (non-matching) Instant cards remain at normal brightness with the no-trigger-yet toast on tap.
- The `<InstantPrompt>` modal itself shows the matching cards in a centered selection — viewer doesn't strictly need to tap from the hand; the modal is the primary interaction surface for Instant plays.

#### 7.3.5.7 Acceptance criteria

1. **Middle band re-binds on turn change.** When `gameState.activePlayer` changes, the DiceTray and AbilityLadder re-render with the new player's data within the next render cycle (≤16ms). No flicker; combo states recompute against the new player's ability set.
2. **Dice tray non-interactive during opponent turn.** Per scenario 9.5.2: taps emit no actions; cursor/touch feedback is suppressed (no hover halo, no tap denial flash).
3. **Ladder tap during opponent turn opens read-only modal.** ExpandedAbilityView renders with Activate button hidden (replaced by Close at full button width). Long-press tooltip still works.
4. **Hand stays interactive.** Non-Instant cards visually dimmed with the gold-dim border treatment; Instant cards render at full brightness with normal affordances. Tap on dimmed card shows deny-shake + toast.
5. **AI pacing matches the table.** Manual timing verification: a typical opponent turn (no ultimate, 1 reroll) completes within ±500ms of the ~9.5s target.
6. **Phase banner updates within 100ms** of engine phase transitions; opponent-prefix copy is correct for every phase.
7. **Instants fire only on matching engine triggers.** A tap on an Instant card with no active `pendingCounter` / `pendingStatusRemoval` / `instantPrompt` shows a "wait for trigger" toast — no state-save mechanism is involved. When the engine surfaces a matching prompt, the `<InstantPrompt>` modal opens and the viewer can play the card or decline.
8. **No double-prompts.** While an `<InstantPrompt>` is open, no second prompt can stack on top — the engine queues events behind the active prompt and processes them after the viewer responds.

#### 7.3.5.8 Reactive model — engine triggers, not pacing floors

> **Bible v0 had this fundamentally wrong.** Earlier drafts of this section specified two engine-enforced pacing floors — a 150ms inter-lock minimum and an 800ms pre-commit hold — to guarantee the defender's Instant window regardless of how fast the actor inputted. Per Decision 1 (Batch 4), this model has been retired. **The engine does not enforce pacing floors.** Actions resolve immediately. Instants are event-driven via the `CardTrigger` system, not time-window-driven.

**The principle.** The engine surfaces Instant-play opportunities by emitting **events** that match Instant cards' `trigger` declarations. Each Instant card has a structured `trigger: CardTrigger` (see Part 1.9). When the engine emits an event matching a viewer's Instant trigger, the engine pauses to give the viewer a chance to play that card. There is no universal "the attacker is about to commit, react now" window — the granularity is per-event.

**This is the same model used by MTG and similar reactive card systems.** The "reactive window" is implicit and event-specific: damage-incoming triggers fire when damage is about to land; opponent-fires-ability triggers fire when an ability is committed; etc. The viewer cannot react arbitrarily mid-turn — only when a trigger matches.

**Implementation pattern.**

```typescript
// Pseudo-code for how the engine processes a typical opponent action.

function processOpponentAction(action: GameAction) {
  // 1. Engine validates the action and computes effects
  const events = computeEffects(action)
  
  // 2. For each event, check if any viewer Instant triggers match
  for (const event of events) {
    const triggeredInstants = findMatchingInstants(viewerHand, event)
    
    if (triggeredInstants.length > 0) {
      // Pause action processing; surface the prompt
      gameState.pendingCounter = {
        triggerCard: action.cardId,        // or null for non-card actions
        target: viewerId,
        candidateCounters: triggeredInstants.map(c => c.id),
      }
      
      // UI opens <InstantPrompt> modal; viewer chooses to play or decline
      // After response, engine resumes processing the remaining events
      yield  // await viewer response via respond-to-counter action
    }
    
    // No matching Instant or viewer declined → apply the event
    applyEvent(event)
  }
}
```

**Open issue from PvP planning.** Without engine pacing floors, a fast-typing remote PvP human can chain dice locks faster than the AI's natural cadence. For single-player MVP this isn't a problem (the AI's controller paces itself). For PvP, the design questions to resolve before multiplayer build are:

1. Should the engine add a minimum render-time pause on lock/reroll actions purely for the viewer to see the animation? (UI-side cosmetic delay, not engine state delay — affects only the broadcast cadence)
2. Should Instants triggered on opponent's dice events (e.g., a hypothetical "trigger on opponent rolling a critical symbol") get a small pause to allow viewer reaction time?

The current architecture punts these to the PvP phase. For MVP, the AI's controller provides the viewing rhythm and Instants surface only on the event-driven triggers above.

**What this means for the viewer's experience.**

During the opponent's turn, the viewer:
- **Watches** dice tumble, lock, reroll, commit — pacing comes from the AI's controller (~300ms inter-lock, ~400ms pre-commit AI-side)
- **Cannot** tap a random Instant during the opponent's roll — there's no event to trigger it
- **Will be prompted** via `<InstantPrompt>` modal when the opponent's actions emit events matching the viewer's Instant triggers (e.g., the opponent commits an attack → viewer's Aegis of Dawn surfaces with the prompt)
- **Decides** in the prompt to play the card or decline; the engine resumes processing the action after the viewer responds

This is a more constrained model than the bible's earlier "free reactive window" — but it matches engine reality and avoids over-engineering pacing floors that don't actually exist.

**Acceptance criteria for the reactive model:**

1. **No engine pacing floors enforced.** Test: dispatch multiple toggle-die-lock actions synchronously; engine applies each immediately. There is no inter-lock or pre-commit hold on the engine side.
2. **Instants surface via prompts.** Test: opponent commits an ability triggering Aegis of Dawn; engine writes `pendingCounter` referencing Aegis; UI opens `<InstantPrompt>` within 100ms.
3. **Viewer must respond.** Test: while `pendingCounter` is set, dispatch any other action; engine rejects it until the viewer dispatches `respond-to-counter` (play or decline).
4. **Decline = continue.** Test: viewer declines the prompt; engine resumes processing the queued events as if no Instant existed.
5. **Played Instant applies inline.** Test: viewer plays Aegis of Dawn; its effect applies immediately to engine state, the remaining queued events fire with modifications, UI animates over the already-applied state per snapshot-and-interpolate (Part 7.4).

### 7.4 Resolution coordination — snapshot-and-interpolate

> **Bible v0 had this fundamentally wrong.** Earlier drafts of this section specified a RESOLUTION_COMPLETE round-trip where the engine waited for the UI to signal cinematic completion before applying state changes. Per Decision 6 (Batch 4), this model has been retired. **The engine applies state changes immediately when an action resolves.** It does not pause for UI cinematics. The UI is responsible for animating *over* the already-applied state via the snapshot-and-interpolate pattern below.

**The principle.** When the player dispatches a commit action (e.g., `select-offensive-ability`), the engine immediately:
1. Computes the resolution synchronously
2. Mutates HP, statuses, signature counters, etc. to their post-resolution values
3. Emits a stream of `GameEvent[]` (`ability-triggered`, `damage-dealt`, `hp-changed`, `status-applied`, etc.) describing what happened
4. Advances to the next phase

The UI subscribes to the event stream. When events arrive, the UI must:
1. **Snapshot** the previous state (current HP, current stacks) before the events apply visually
2. **Animate** from the snapshotted previous values toward the engine's already-applied new values
3. **Settle** on the engine's final state when the cinematic completes

This is the standard pattern used in turn-based games where engine logic and UI animation are decoupled (Hearthstone, Slay the Spire, most card games). The engine never blocks on UI; the UI never lags on engine.

**Sequence diagram.**

```
[Engine]                                    [UI]
   |                                            |
   | (player dispatches select-offensive-ability)
   |<-------------------------------------------|
   |                                            |
   | Synchronously:                             |
   |   - resolves ability                       |
   |   - mutates HP, statuses, signatureState   |
   |   - emits ability-triggered event          |
   |   - emits damage-dealt event               |
   |   - emits hp-changed event                 |
   |   - emits status-applied event             |
   |   - advances phase to defensive-roll or    |
   |     main-post                              |
   |------------------------------------------->|
   |                                            | useResolutionTimer hook fires:
   |                                            |   - snapshots prev values from
   |                                            |     a ref taken BEFORE the
   |                                            |     event stream arrived
   |                                            |   - aggregates events into FOPScene
   |                                            |   - opens FOP overlay
   |                                            |   - starts cinematic timeline:
   |                                            |     - fade-in (250ms)
   |                                            |     - name-in (200ms)
   |                                            |     - damage-in (200ms) ← number
   |                                            |       displayed counts UP from
   |                                            |       prev HP to engine's new HP
   |                                            |     - effects-in (200ms)
   |                                            |     - holding (400ms)
   |                                            |     - fade-out (300ms)
   |                                            |   - HP bar interpolates from prev
   |                                            |     to new over the full cinematic
   |                                            |   - cinematic settles; UI shows
   |                                            |     engine's already-applied state
   |                                            |
   | (no further action from engine — state
   |  was already applied; engine moved on to
   |  the next phase the moment it emitted     
   |  the events)                               |
```

**Implementation pattern — `useResolutionTimer` hook.**

The UI uses a single hook to manage the cinematic timeline. The hook subscribes to engine events, captures snapshots, and runs the animation timeline using `performance.now()` timestamps (not `setTimeout` chains, for testability and determinism).

```typescript
// ui/hooks/useResolutionTimer.ts

export function useResolutionTimer() {
  const events = useGameStore(s => s.matchLog)        // The engine's GameEvent[] stream
  const prevHpRef = useRef<{ p1: number, p2: number }>()  // Snapshot taken before events arrive
  const [scene, setScene] = useState<FOPScene | null>(null)
  const [phase, setPhase] = useState<ResolutionPhase>('idle')
  
  // Snapshot HPs at the start of every render — captures the "pre-event" state
  // BEFORE we observe a new ability-triggered event in the stream.
  useEffect(() => {
    const lastEvent = events[events.length - 1]
    if (lastEvent?.kind === 'ability-triggered') {
      // Begin cinematic: snapshot the HPs from the PREVIOUS render (already
      // captured in prevHpRef) and aggregate the next chunk of events into a scene.
      const sceneFromEvents = aggregateEventsIntoScene(events, lastEvent.eventId)
      setScene(sceneFromEvents)
      startCinematicTimeline()
    }
  }, [events])
  
  // Timeline using performance.now() — animation timing anchored to engine timestamps
  // for determinism, not setTimeout chains.
  function startCinematicTimeline() {
    const t0 = performance.now()
    setPhase('fade-in')
    
    requestAnimationFrame(function tick(t: number) {
      const elapsed = t - t0
      if      (elapsed < 250)  setPhase('fade-in')
      else if (elapsed < 450)  setPhase('name-in')
      else if (elapsed < 650)  setPhase('damage-in')
      else if (elapsed < 850)  setPhase('effects-in')
      else if (elapsed < 1250) setPhase('holding')
      else if (elapsed < 1550) setPhase('fade-out')
      else {
        setPhase('idle')
        setScene(null)
        return  // cinematic done
      }
      requestAnimationFrame(tick)
    })
  }
  
  return { scene, phase, prevHp: prevHpRef.current }
}
```

**HP bar interpolation example.**

The HPTrack component reads both the snapshotted previous value (from the resolution timer hook) and the engine's current value. It interpolates between them over the cinematic duration:

```typescript
function HPTrack({ playerId }: { playerId: PlayerId }) {
  const currentHp = useGameStore(s => s.players[playerId].hp)
  const { prevHp, phase } = useResolutionTimer()
  
  // During cinematic: interpolate from prev to current.
  // Outside cinematic: just show current.
  const displayHp = useMemo(() => {
    if (phase === 'idle' || !prevHp) return currentHp
    return interpolateOverPhase(prevHp[playerId], currentHp, phase)
  }, [phase, prevHp, currentHp, playerId])
  
  return <div className={s.hpBar} style={{ width: `${(displayHp / hpStart) * 100}%` }}>...</div>
}
```

**What this means for engine work.**

Zero. The engine doesn't need to know about cinematics. It applies state synchronously, emits events, and continues. The UI handles all timing concerns on its own. This is one of the cleaner architectural payoffs of Decision 6 — engine logic stays pure; rendering concerns stay in the rendering layer.

**Edge cases.**

- **App backgrounds during cinematic.** The cinematic timeline is paused (via Page Visibility API). When the app returns, it snaps to the final state (no replay). The engine state is already correct; only the visual catch-up happens.
- **Rapid consecutive events.** If the engine emits two ability-triggered events in quick succession (e.g., an Instant fires immediately after an attack resolves), the UI queues the second cinematic to run after the first completes. There's no engine pacing forcing this; the UI manages its own queue.
- **Multiple HP changes in one event chain.** A single ability commit can emit multiple `hp-changed` events (initial damage, then a Burn tick that fires from the same commit). The UI aggregates these into a single FOPScene with multiple effect rows, animating each over its own sub-timeline within the larger cinematic.

### 7.5 Turn-start sequence (upkeep choreography)

Every turn begins with a deterministic 3-step upkeep sequence that runs BEFORE the player enters the main phase. The sequence is **always the same order**, with each step taking ~800ms so the player can read the events. This consistency is the single most important property: players must learn the turn-start rhythm so they trust what happens during this window and never feel "wait, did I just lose HP?" or "where did that card come from?".

**Visual reference:** `design.html#p2-upkeep-sequence` shows the full sequence as an animated timeline (6 frames: pre-sequence + tick(s) + draw + CP gain + main phase begin). The narrower `design.html#p2-burn` shows a single status tick in isolation for the status-tick beat.

**The three steps (always in this order — per engine reality):**

1. **STATUS TICKS** — each ticking status fires sequentially (Burn, Regen, etc.). Fires during engine's `upkeep` phase.
2. **CP GAIN** — player gains 1 CP (capped at 15 / `CP_CAP`). Fires during engine's `income` phase.
3. **DRAW** — player draws 1 card from their deck into their hand (capped at 6 / `HAND_CAP`). Also during `income` phase, after CP gain.

> **Bible v0 correction.** Earlier drafts of this section listed the order as ticks → draw → CP gain (with a UX rationale that drawing first lets the new card inform spending decisions). Per Decision 3 (Batch 4), the bible matches engine reality: CP gain happens before card draw. The phase banner copy "Upkeep · Draw" / "Upkeep · +1 CP" remains the same, but spans engine's `upkeep` (ticks) and `income` (CP + draw) phases.

After these three, the engine transitions to the `main-pre` phase and the player can interact (dice tray becomes active, hand becomes clickable, ability ladder unlocks).

```
[turn boundary — control passes to active player, engine enters `upkeep` phase]
   |
   | STEP 1: STATUS TICKS (sequential)
   |    for each ticking status, in deterministic order:
   |        emit status-ticked event
   |        UI plays UPKEEP FOP in middle band (centered label + value, ~700ms)
   |        UI updates HP/CP/etc.
   |        UI updates the status chip badge (count decrements)
   |        wait 800ms before next tick
   |    
   |    for each status that expires (count → 0):
   |        emit status-removed event with reason='expired'
   |        UI plays chip fade-out (350ms)
   |
[engine transitions to `income` phase]
   |
   | STEP 2: CP GAIN (one beat, 800ms)
   |    emit cp-changed event with delta=+1
   |    UI plays UPKEEP FOP in middle band: "+1 CP" gold value (~700ms)
   |    UI animates CP value increment on the self-strip (scale pulse + brief gold-bright flash)
   |    Phase banner: "Upkeep · +1 CP"
   |
   | STEP 3: DRAW (one beat, 800ms)
   |    emit card-drawn event
   |    UI plays UPKEEP FOP in middle band: "Draw" + card name (~700ms)
   |    UI also animates a card sliding from deck indicator position into hand
   |    Phase banner: "Upkeep · Draw"
   |
[engine transitions to `main-pre` phase]
   |
   | Phase banner: "Roll · 1 of 3"
   | Dice tray becomes interactive
   | Player can now roll, lock, play cards, fire abilities
```

**Visual grammar — upkeep FOP, not portrait floats:**

Every upkeep event (status tick, draw, CP gain) uses the **lightweight upkeep FOP** rather than a small floating number over the portrait orb. The upkeep FOP is a tone-tinted centered display in the middle band — same vertical region as full ability resolutions, but visually distinct:

| Treatment | Where | Size | Duration | Used for |
|-----------|-------|------|----------|----------|
| Full FOP cinematic | Middle band, full backdrop with particles | 56–84px damage value, 13px ability name | 1500–2000ms | Ability resolutions, ultimates, lethal hits, signature detonations |
| **Upkeep FOP** | **Middle band, soft backdrop, no particles** | **38px value, 11px Cinzel label** | **~700ms** | **Status ticks (Burn/Poison/Regen), card draws, CP gains** |
| Portrait float (legacy) | Above portrait orb | 18px Cinzel | ~500ms | RARE in v1 — reserved for ambient state changes that don't deserve middle-band attention |

The ability ladder behind the upkeep FOP dims to 10% opacity during the beat, focusing the player's eye on the FOP content. The phase banner above continues to display the step name ("Upkeep · Burn Ticks" / "Upkeep · Draw" / "Upkeep · +1 CP") — a redundant signal that reinforces the FOP value.

**Step 1 — Status tick order** (deterministic, set by engine):
1. Damaging statuses first (Burn, Poison, Wound)
2. Healing statuses next (Regen)
3. Resource-granting statuses (Momentum)
4. Control statuses (Stun decrement)
5. Buff durations (turn-based) decrement last

If multiple instances of the same status tick (e.g., two Burns on opponent from different sources), they fire as two separate upkeep FOP beats (each 700ms), not stacked simultaneously — each gets its own labeled moment so the player reads them as distinct events.

**Upkeep FOP variants by event type:**

| Event | Label | Value | Tone |
|-------|-------|-------|------|
| Burn tick | "Burn Ticks" | −N | ember (`var(--ember-bright)`) |
| Poison tick | "Poison Ticks" | −N | toxic-green (`var(--toxic-green-bright)`) |
| Regen tick | "Regen" | +N | green (`var(--green-bright)`) |
| Wound tick | "Wound" | −N | crimson (`var(--crimson-bright)`) |
| Bleed tick | "Bleed" | −N | crimson |
| Card draw | "Draw" | + card name (Cormorant italic 13px subtext below) | gold (`var(--gold-bright)`) |
| CP gain | "+1 CP" | +1 | gold |
| Deck shuffle | "Deck Shuffled" | (no value, just label) | gold |

**Step 2 — CP gain mechanics:**

- The upkeep FOP shows "+1 CP" label + a gold `+1` value (38px Cinzel)
- The CP value on the self-strip increments visibly during the FOP beat (`8` → `9`) with a brief 200ms scale pulse and a gold-bright flash on the digit
- The phase banner reads `"Upkeep · +1 CP"`
- **Edge case — CP at cap (15):** Still play the upkeep FOP (`"+1 CP wasted"` label, dawn-bright tone instead of gold). The CP value doesn't change but briefly pulses dawn-bright. This visual is intentionally noticeable so players learn to spend CP before upkeep. No floating "+1" — just the FOP with a dimmer "wasted" treatment.

**Step 3 — Card draw mechanics:**

- The upkeep FOP shows "Draw" label + the drawn card name in Cormorant Garamond italic subtext (e.g., "Draw" / "Cleave")
- The drawn card also slides in from the deck indicator position (top-right of hand band) into the hand — 600ms ease-out animation
- Animation: 600ms slide + 100ms gold glow flash on settle = 700ms total. The remaining 100ms of the 800ms beat is hold time before transitioning to main-pre.
- The phase banner reads `"Upkeep · Draw"` for the duration of this beat
- **Edge case — deck empty:** Skip the slide animation. Upkeep FOP shows "Deck Shuffled" label briefly (~600ms), the discard pile reshuffles into the deck, and the engine draws on the next available frame. If the discard is also empty, skip the draw entirely.
- **Edge case — hand at HAND_CAP (6 cards):** Card draws and the upkeep FOP shows the card name, but the card visual then fades out and shrinks toward the discard pile rather than landing in the hand. Toast shows `"Hand full · {card name} discarded"`.

**Acceptance criteria:**

1. **The sequence always runs in order** — even when steps are empty/null. If no statuses tick (no ongoing burn/poison/regen), step 1 is **skipped silently** (~0ms, no banner). Steps 2 and 3 always run.
2. **Step 1 total duration scales with status count.** 0 statuses = 0ms; 1 status = 800ms; 3 statuses (Burn + Poison + Regen) = 2400ms. Steps 2 and 3 are always 800ms each.
3. **A typical turn-start with 1 burn:** 800ms (tick) + 800ms (CP) + 800ms (draw) = 2400ms total upkeep.
4. **A turn-start with no statuses:** 800ms (CP) + 800ms (draw) = 1600ms total upkeep. Snappy.
5. **If a status kill at upkeep drops the active player's HP to 0**, the engine emits `MATCH_END` and skips steps 2 and 3. UI transitions to MATCH_END state mid-sequence. No draw, no CP gain — match is over.
6. **If a status kill drops the OPPONENT's HP to 0** (e.g., a Burn the opponent was carrying ticks during my upkeep — wait, that's not how the game works; opponent's statuses tick on opponent's turn). Skip this edge case.
7. **Phase banner transitions are atomic** — when step 1 ends and step 2 begins, the banner text updates instantly (no fade between). The visual continuity comes from the consistent banner background and bracketing diamond marks.

**Why this order — engine + UX rationale:**

- **Status ticks first** because they're a CONSEQUENCE of last turn's actions. Players need to see "what happened to me overnight" before they plan their next move. Putting ticks last would make the player plan with stale information.
- **CP gain before draw** (engine reality, per Decision 3): the engine's `income` phase grants CP, then draws. From a UX angle this works in the player's favor too — the drawn card is the *last* thing that happens before control returns, so the freshest information in the player's mind entering main-pre is "what did I just draw," and CP affordability is already settled by the time they read it.
- **Draw last** because it's the natural "you're up" signal — the card physically lands in the hand, the banner transitions to `Roll · 1 of 3`, and the player's eye is already at the bottom of the screen where their hand and dice live. The player feels the moment of agency.

**Activity log entries** (one per step that fires):

```
14:23:01 · TURN 3 BEGIN — Berserker
14:23:02 · UPKEEP — Burn ticks: −2 HP (24 → 22), Burn chip 2 → 1
14:23:03 · INCOME — +1 CP (8 → 9)
14:23:04 · INCOME — Draw: Cleave
14:23:04 · MAIN PHASE — Roll 1 of 3
```

Each step that produces an event emits a discrete log entry. Steps that were skipped (no statuses, deck empty, CP capped) emit a single annotated line: `UPKEEP — No statuses ticking · +1 CP wasted (cap)`.

### 7.6 MATCH_END detection

The engine determines match end. Conditions:

- Either player's HP reaches 0 (most common)
- Either player concedes (future feature; UI must support a Concede button in the menu)
- Turn limit reached (if implemented; not in v1)

When MATCH_END fires, the engine emits a final state snapshot with:
- `winner`: HeroId or 'draw'
- `loser`: HeroId (or undefined if draw)
- `endCondition`: 'hp-zero' | 'concede' | 'turn-limit'
- `matchStats`: aggregated stats for the summary screen

**UI handling:**

If the final ability was an ultimate, the UltimateTakeover plays first (3500ms), then transitions to the summary.

If the final ability was a non-ultimate, the standard FOP resolution plays (2000ms), then transitions.

For HP-zero deaths during upkeep, the UI plays a brief "match end" cinematic:
- The losing hero's portrait briefly desaturates and fades
- Phase banner reads "{winner} prevails" in gold
- 1200ms hold
- Transition to MatchSummaryScreen

### 7.7 MatchSummaryScreen

**Visual reference:** `design.html#p1-summary`.

```typescript
// ui/components/screens/MatchSummaryScreen/MatchSummaryScreen.tsx

export type MatchSummaryScreenProps = {
  data: MatchSummaryData
  onRematch: () => void
  onNewHero: () => void          // Returns to HeroSelectScreen with same opponent
  onReturnHome: () => void
}

export type MatchSummaryData = {
  outcome: 'victory' | 'defeat' | 'draw'
  playerHero: HeroId
  opponentHero: HeroId
  playerHpRemaining: number
  opponentHpRemaining: number
  turnCount: number
  matchDurationSeconds: number
  bark: string                        // Hero-specific line
  stats: SummaryStat[]
}

export type SummaryStat = {
  label: string                       // "DAMAGE DEALT", "ABILITIES FIRED", etc.
  value: string                       // "47", "12", "2 minutes 14 seconds"
  highlight?: boolean                 // True for the most significant stat
}
```

**Layout:**

Full-screen vertical layout, centered content, with a clean dark background (no diagonal stripe overlay — different from FOP):

```css
.summaryScreen {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--night-stone) 0%, var(--night-deep) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  gap: 16px;
  z-index: 100;
}
```

**Children, top to bottom:**

1. **Eyebrow** — Cinzel 9px, 0.5em letter-spacing, `var(--gold)`, uppercase. Text: "— Match Resolved —"

2. **Result heading** — Cinzel 36px, 800 weight, 0.12em letter-spacing. Color depends on outcome:
   - victory: gradient `linear-gradient(180deg, var(--gold-glow), var(--gold-bright), var(--gold))` with `-webkit-background-clip: text`
   - defeat: gradient `linear-gradient(180deg, var(--bone), var(--bone-dim), var(--bone-deeper))`
   - draw: `var(--bone-bright)`

3. **Divider** — A 200px wide gold rule centered: `1px height, background: linear-gradient(90deg, transparent, var(--gold), transparent)`

4. **Bark line** — Cormorant Garamond italic 18px, `var(--bone-bright)`, with gold-bright quotation marks. Max-width 80%, centered. Wrapped in 14px padding.

5. **Stats grid** — 2-column grid, gap 12px horizontal, 8px vertical, max-width 320px:
   - Each stat has a label (JetBrains Mono 8px, 0.3em letter-spacing, `var(--bone-dim)`, uppercase) and a value (Cinzel 24px, 700 weight, `var(--bone-bright)`)
   - Stats with `highlight: true` use color `var(--gold-bright)` for the value
   - Stats include: damage dealt, damage taken, abilities fired, ultimates fired (0 or 1), tokens generated, turns elapsed, match duration

6. **Action buttons** — Flex column, 10px gap, full-width stack. Buttons are **substantially larger than action-bar buttons** because the summary is a deliberate, end-of-match moment where buttons should feel touch-friendly and inviting:

   - **Rematch** (primary variant) — top, 52px tall, Cinzel 13px 800-weight, 0.2em letter-spacing, 6px border-radius, with stronger glow: `box-shadow: 0 0 22px rgba(212, 165, 72, 0.5), 0 4px 14px rgba(0, 0, 0, 0.4)`. Chevron arrow at 16px.
   - **New Hero** (default variant) — middle, 44px tall, Cinzel 11px, 0.18em letter-spacing, 6px border-radius
   - **Return Home** (default variant) — bottom, 44px tall, same styling as New Hero

   ```css
   .summary-actions {
     width: 100%;
     display: flex;
     flex-direction: column;
     gap: 10px;
     margin-top: 4px;
   }
   .summary-actions .btn {
     height: 44px;
     font-size: 11px;
     letter-spacing: 0.18em;
     border-radius: 6px;
   }
   .summary-actions .btn.primary {
     height: 52px;
     font-size: 13px;
     font-weight: 800;
     letter-spacing: 0.2em;
     box-shadow: 0 0 22px rgba(212, 165, 72, 0.5), 0 4px 14px rgba(0, 0, 0, 0.4);
   }
   .summary-actions .btn .arrow { font-size: 16px; margin-left: 4px; }
   ```

**Entry animation:**

| Time | Event |
|------|-------|
| 0ms | Background fades in (400ms) |
| 200ms | Eyebrow fades in (200ms) |
| 400ms | Result heading scales in from 0.85 with overshoot (300ms) |
| 700ms | Divider expands from center (300ms, `transform: scaleX(0) → scaleX(1)`) |
| 1000ms | Bark line fades in + slides up 8px (300ms) |
| 1400ms | Stats grid items fade in with stagger (each 100ms after the prior, total ~700ms) |
| 2200ms | Action buttons fade in (300ms) |

Total entry: ~2500ms. The user can tap a button as soon as it becomes visible (buttons are functional during their fade-in).

**Acceptance criteria:**

1. The summary screen replaces the MatchScreen entirely (different route or conditional render). The MatchScreen is unmounted, freeing memory.
2. "Rematch" dispatches `start-match` with the same hero/opponent config — fastest path to another match.
3. "New Hero" navigates to HeroSelectScreen so the player can pick a different hero (or different opponent) before the next match.
4. "Return Home" navigates to HomeScreen.
5. Match stats persist long enough to be displayed; engine should keep the final state snapshot in memory until the summary screen unmounts.
6. Bark text rotates per match (multiple options per outcome+hero combination). Bark inventory lives in `ui/content/heroBarks.ts`.

### 7.8 State diagram (complete match flow)

```
                  ┌─────────────────────┐
                  │  HomeScreen         │
                  └──────────┬──────────┘
                             │ tap "New Match"
                             ▼
                  ┌─────────────────────┐
                  │  HeroSelectScreen   │
                  └──────────┬──────────┘
                             │ tap "Begin Match"
                             ▼
                  ┌─────────────────────┐
                  │  MATCH_INTRO        │
                  │  (1800ms cinematic) │
                  └──────────┬──────────┘
                             ▼
       ┌───────────────────────────────────────┐
       │  IN_MATCH                             │
       │  ┌─────────────────────────────┐      │
       │  │  TURN_START                 │      │
       │  └──────────┬──────────────────┘      │
       │             ▼                          │
       │  ┌─────────────────────────────┐      │
       │  │  UPKEEP + INCOME            │      │
       │  │  (status ticks → CP gain    │      │
       │  │   → draw)                   │      │
       │  └──────────┬──────────────────┘      │
       │             ▼                          │
       │  ┌─────────────────────────────┐      │
       │  │  ROLL  (with rerolls)       │      │
       │  └──────────┬──────────────────┘      │
       │             ▼                          │
       │  ┌─────────────────────────────┐      │
       │  │  PLAN  (no rerolls left)    │      │
       │  └──────────┬──────────────────┘      │
       │             ▼ Activate / Play          │
       │  ┌─────────────────────────────┐      │
       │  │  RESOLVE                    │      │
       │  │    ├─ standard ability      │      │
       │  │    ├─ card play             │      │
       │  │    ├─ defensive             │      │
       │  │    └─ ultimate              │      │
       │  └──────────┬──────────────────┘      │
       │             ▼                          │
       │  ┌─────────────────────────────┐      │
       │  │  TURN_END                   │      │
       │  └──────────┬──────────────────┘      │
       │             │                          │
       │     ┌───────┴────────┐                 │
       │     │ HP > 0 both    │ match continues │
       │     │ players ✓      ├─→ loop back to  │
       │     └────────────────┘   TURN_START    │
       │             │                          │
       │     ┌───────┴────────┐                 │
       │     │ HP = 0 either  │                 │
       │     │ player        ─┼─→ MATCH_END    │
       │     └────────────────┘                 │
       └───────────────────────────────────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │  MATCH_END          │
                  │  (final cinematic)  │
                  └──────────┬──────────┘
                             ▼
                  ┌─────────────────────┐
                  │  MatchSummaryScreen │
                  └──────────┬──────────┘
                       ┌─────┴─────┐
                       │           │
                  Rematch      Return Home
                       │           │
                       ▼           ▼
                  HeroSelect    HomeScreen
```

### 7.9 Error and recovery states

Real-world failures need defined handling:

| Failure | UI response |
|---------|-------------|
| App backgrounds during resolution animation | Cancel pending setTimeouts. On foreground, query engine for current state and render accordingly. Resolution does not resume mid-animation. |
| Engine throws during action dispatch | Display a toast (Part 6.5) with "Something went wrong. Retry." Log the error. The UI state remains in its pre-action state. |
| Engine state and UI state desync (e.g., UI thinks dice are 4 ⚔ but engine says 5 ⚔) | Force a UI re-render from the canonical engine state. Drop any in-flight UI animations. |
| Network disconnect (future multiplayer) | Show "Reconnecting…" toast. Pause all actions. On reconnect, resync state. |
| Hero asset fails to load | Render a placeholder gray orb in place of the portrait. Match still playable. |

**Recovery rule:** The engine state is always canonical. UI state is derived. If they conflict, UI rebuilds from engine state, never the reverse.

### 7.10 Persistence and resume

For a single-player game, the match state should survive app backgrounding without loss. For PvP (future), state lives on the server.

**Local persistence:**

- The full game state is serialized to `localStorage` after every action dispatch (debounced 200ms)
- On app launch, if a match-in-progress exists in localStorage, the user is prompted: "Resume your match?" (Yes / Discard)
- Resume restores the engine state and routes directly to MatchScreen, skipping the intro
- UI state is NOT persisted (it's all derived); only engine state matters

**Discard rules:**

- Match state is discarded automatically after 7 days of inactivity
- Match state is discarded when the user starts a new match (no "save slots" in v1)
- Match state is discarded when the user completes the match (post MatchSummaryScreen)

Implementation lives in `ui/util/persistence.ts`. The store subscribes to changes and saves; on init, the store loads from localStorage if available.


---

## Part 8 — Meta Surfaces

The match UI is the centerpiece, but a complete game requires surrounding surfaces: a home screen to land on, hero selection before matches, settings, onboarding for first-time players, and a hero detail view ("card book"). This part specifies these surfaces at a **skeletal** level — enough to establish structure and behavior, but not the full visual fidelity of the match UI. Full design passes for these surfaces happen in a later phase; engineers can implement them now as functional but visually unfinished.

**Note:** These surfaces share the dark cathedral aesthetic (Cinzel headers, gold accents) but are intentionally simpler than the match screen. Most use plain dark backgrounds without the radial gradients and diagonal-stripe overlays.

### 8.1 Routing structure

The application uses a simple router (e.g., React Router or a hand-rolled state-based router). Routes:

```
/                          → HomeScreen
/select                    → HeroSelectScreen
/match                     → MatchScreen (the focus of Parts 2–7)
/summary                   → MatchSummaryScreen (terminal, no back nav)
/settings                  → SettingsScreen
/heroes                    → HeroBookScreen
/heroes/:heroId            → HeroDetailScreen
/heroes/:heroId/customize  → HeroCustomizationScreen (Abilities + Deck tabs)
/onboarding                → OnboardingFlow (first-launch only)
```

Most navigation is forward-only. The summary screen does NOT have a back button — the player either Rematches (returns to HeroSelect) or returns Home. Mid-match, the player cannot navigate away without conceding (deferred to a later phase). The customize route can be entered with `?tab=abilities` or `?tab=deck` to deep-link to a specific tab.

### 8.2 HomeScreen

The landing screen on app launch (post-onboarding).

**Visual reference:** `design.html#p5-home` shows the full rendered screen with title, centerpiece placeholder, button stack, and footer.

```typescript
// ui/components/screens/HomeScreen/HomeScreen.tsx

export type HomeScreenProps = {
  hasResumeMatch: boolean
  onNewMatch: () => void
  onResumeMatch: () => void
  onOpenSettings: () => void
  onOpenHeroBook: () => void
}
```

**Layout:**

```
┌─────────────────────────────────────┐
│                                     │
│         PACT OF HEROES              │ ← Title, Cinzel 36px, gold gradient
│         (subtitle: "Three Heroes,   │   Subtitle italic 14px
│          One Pact")                 │
│                                     │
│         [hero silhouette art        │ ← Decorative centerpiece (deferred art)
│           placeholder]              │
│                                     │
│      ┌─────────────────────┐        │
│      │   NEW MATCH         │        │ ← Primary button (full width on this screen)
│      └─────────────────────┘        │
│      ┌─────────────────────┐        │
│      │   RESUME            │        │ ← Only shown if hasResumeMatch
│      └─────────────────────┘        │
│      ┌─────────────────────┐        │
│      │   HEROES            │        │ ← Default variant
│      └─────────────────────┘        │
│      ┌─────────────────────┐        │
│      │   SETTINGS          │        │ ← Default variant
│      └─────────────────────┘        │
│                                     │
│         v0.1 · 2026                 │ ← Version label at bottom
└─────────────────────────────────────┘
```

**Styling:**

- Full-screen dark gradient: `linear-gradient(180deg, var(--night-stone) 0%, var(--night-deep) 100%)`
- Title: Cinzel 36px, 800 weight, 0.08em letter-spacing, gold gradient via `-webkit-background-clip: text`
- Subtitle: Cormorant Garamond italic 14px, `var(--bone)`
- Buttons: 240px wide, 48px tall, vertically stacked with 12px gap
- Version label: JetBrains Mono 9px, `var(--bone-dim)`, positioned at bottom: 16px

**Acceptance criteria:**

1. Title and subtitle render immediately on mount. No entry animation needed beyond a 200ms fade-in for the whole screen.
2. Resume button only renders if `hasResumeMatch` is true. When tapped, the user is taken directly to the in-progress match (skipping hero select).
3. Tapping New Match navigates to `/select`. Tapping Heroes navigates to `/heroes`. Tapping Settings navigates to `/settings`.

### 8.3 HeroSelectScreen

Where the player chooses their hero before a match. Three options (Berserker, Pyromancer, Lightbearer) presented as cards.

**Visual reference:** `design.html#p5-hero-select` shows the screen with Lightbearer selected and the detail panel expanded below the row of hero cards.

```typescript
// ui/components/screens/HeroSelectScreen/HeroSelectScreen.tsx

export type HeroSelectScreenProps = {
  selectedHeroId?: HeroId
  onSelectHero: (heroId: HeroId) => void
  onConfirm: () => void
  onBack: () => void
}
```

**Layout:**

```
┌─────────────────────────────────────┐
│  ‹ Back       Choose Your Hero      │ ← Header bar
├─────────────────────────────────────┤
│                                     │
│   ┌─────────┐ ┌─────────┐ ┌────────┐│ ← Three hero cards in a horizontal row
│   │ BRSKR   │ │ PYROMR  │ │ LTBR   ││   (scrollable if more heroes added)
│   │ Frost   │ │ Ember   │ │ Dawn   ││
│   │ Rush    │ │ Burn    │ │ Surv.  ││
│   │ ★       │ │ ★★★    │ │ ★★    ││ ← Complexity dots
│   └─────────┘ └─────────┘ └────────┘│
│                                     │
│   [Selected hero detail panel]      │ ← Expands when a hero is tapped
│   ───────────────────────────       │
│   "Hael the Unbroken"               │   Hero full name
│   "Crashes the line, refuses to     │   Hero flavor description
│    yield, ends turns in a fury."    │
│                                     │
│   Signature: Frenzy                 │   Signature mechanic name
│   0-6 counter; gained on damage     │   Mechanic description (matches engine — see Part 4.2)
│   taken. +1 dmg per stack.          │
│                                     │
│   Tier abilities: T1 Cleave,        │   Ability list (real engine names)
│   T2 Glacier Strike, T3 Blood       │
│   Harvest, T4 Wolf's Howl           │
│                                     │
│   ┌─────────────────────────────┐   │
│   │   BEGIN MATCH               │   │ ← Primary button (only enabled when hero selected)
│   └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Hero card visual:**

- Size: ~100×130px
- Background: hero-element-tinted gradient
- Border: `2px solid var(--frame-stroke)` default, `2px solid [hero element bright]` when hovered, `3px solid var(--gold)` when selected
- Children:
  - Hero name in Cinzel 11px, 700 weight, hero-element-bright color
  - Element label (Frost/Ember/Dawn) in JetBrains Mono 8px, `var(--bone-dim)`
  - Archetype label (Rush/Burn/Survival) in Cormorant Garamond italic 10px, `var(--bone)`
  - Complexity dots: 1–3 dots, gold-bright filled, gold-dim unfilled

**Selected hero detail panel:**

When a hero is selected, a detail panel slides up from below (or fades in below the card row):

- Background: `linear-gradient(180deg, rgba(20, 20, 42, 0.6), rgba(10, 10, 20, 0.6))`
- Padding: 20px
- Border-top: 1px `var(--frame-stroke)`
- Content as specified in the layout sketch

**Acceptance criteria:**

1. Tapping a card sets `selectedHeroId` via the `onSelectHero` callback.
2. Detail panel appears with a 250ms fade+slide when a hero is selected. If a different hero is then tapped, the detail panel content swaps (cross-fade 200ms).
3. "Begin Match" button is disabled (default variant, opacity 0.55) until a hero is selected, then becomes primary.
4. Back button returns to HomeScreen.
5. For v1, opponent is always AI with a randomly-assigned hero. Future versions add opponent selection.

### 8.4 SettingsScreen

Player preferences. Linear list layout, no fancy visuals.

**Visual reference:** `design.html#p5-settings` shows the full screen with all 5 sections (Audio, Display, Language, Accessibility, About) and demonstrates the four control primitives (Slider, Dropdown, Radio, Toggle).

```typescript
// ui/components/screens/SettingsScreen/SettingsScreen.tsx

export type SettingsScreenProps = {
  prefs: UserPreferences
  onUpdatePrefs: (patch: Partial<UserPreferences>) => void
  onBack: () => void
}

export type UserPreferences = {
  audio: {
    master: number          // 0–100
    music: number
    sfx: number
    voice: number
  }
  reducedMotion: 'auto' | 'on' | 'off'
  language: 'en' | 'fr'
  colorBlindMode: 'off' | 'protan' | 'deutan' | 'tritan'
  hapticFeedback: boolean
}
```

**Layout:**

```
┌─────────────────────────────────────┐
│  ‹ Back              Settings       │
├─────────────────────────────────────┤
│                                     │
│  AUDIO                              │ ← Section header
│  Master         [████░░░░░░] 60     │ ← Slider control
│  Music          [██████░░░░] 65     │
│  SFX            [████████░░] 80     │
│  Voice          [██████████] 100    │
│                                     │
│  DISPLAY                            │
│  Reduced Motion  [Auto ▾]           │ ← Dropdown
│  Color Mode      [Off ▾]            │
│                                     │
│  LANGUAGE                           │
│  ◉ English                          │ ← Radio buttons
│  ◯ Français                         │
│                                     │
│  ACCESSIBILITY                      │
│  Haptic Feedback   [ ON ]           │ ← Toggle switch
│                                     │
│  ABOUT                              │
│  Version: 0.1.0                     │
│  Made with care.                    │
│  [Privacy] [Credits]                │ ← Links to sub-screens
│                                     │
└─────────────────────────────────────┘
```

**Component primitives needed** (build as atoms, see Part 0.2):

- `<Slider>` — horizontal slider with 0–100 value, color-coded fill
- `<Dropdown>` — native `<select>` styled to match the aesthetic
- `<Radio>` — radio button group
- `<Toggle>` — on/off switch with gold/dim states

**Visual notes:**

- Section headers: Cinzel 10px, 0.4em letter-spacing, `var(--gold)`, uppercase, padded top 24px
- Setting labels: Cormorant Garamond 14px, `var(--bone)`, weight 400
- Setting values (numeric, dropdown text): JetBrains Mono 12px, `var(--bone-bright)`
- Section dividers: 1px `var(--frame-stroke)` between sections

**Acceptance criteria:**

1. All preferences are persisted to localStorage on change.
2. Reduced Motion = Auto uses the OS preference. On/Off override.
3. Language change requires app reload (display a brief "Reloading…" toast). For v1, French translations are a placeholder; English-only at launch is acceptable.
4. Color Blind Mode applies a CSS filter to the root element. Filter values:
   - protan: `protanopia` SVG filter
   - deutan: `deuteranopia` SVG filter
   - tritan: `tritanopia` SVG filter
5. Volume sliders update `<audio>` element volumes in real time (no need to commit).

### 8.5 HeroBookScreen

A browsable view of all heroes. Read-only — no editing.

**Visual reference:** `design.html#p5-hero-book` shows the screen rendered as the left phone in a dual-phone layout (the right phone shows HeroDetailScreen, Part 8.6).

```typescript
// ui/components/screens/HeroBookScreen/HeroBookScreen.tsx

export type HeroBookScreenProps = {
  onSelectHero: (heroId: HeroId) => void
  onBack: () => void
}
```

**Layout:**

Vertical list of hero entries, each with:
- Portrait thumbnail (60×80)
- Hero name and archetype on the right
- Tappable; opens HeroDetailScreen

Includes a count at top: "3 of 3 heroes" (forward compatibility).

### 8.6 HeroDetailScreen

Full hero info, including all ability descriptions and the signature mechanic explanation.

**Visual reference:** `design.html#p5-hero-book` shows the screen rendered as the right phone in the dual-phone layout — the Berserker detail page with portrait, fullname, flavor, signature, all four tier abilities, deck preview strip, and Choose for Match button.

```typescript
// ui/components/screens/HeroDetailScreen/HeroDetailScreen.tsx

export type HeroDetailScreenProps = {
  heroId: HeroId
  onBack: () => void
  onChooseForMatch: () => void
}
```

**Layout:**

```
┌─────────────────────────────────────┐
│  ‹ Back        Berserker            │
├─────────────────────────────────────┤
│                                     │
│  [Hero portrait, larger]            │
│                                     │
│  HAEL THE UNBROKEN                  │
│  Frost · Rush · Complexity ★        │
│                                     │
│  ─────────────────────              │
│                                     │
│  Crashes the line, refuses to       │
│  yield, ends turns in a fury.       │
│                                     │
│  SIGNATURE: FRENZY                  │
│  0–6 banked counter. Gain +1 when   │
│  you take damage from an opponent   │
│  ability (max +1/turn). Each stack  │
│  adds +1 damage to your offense.    │
│                                     │
│  TIER 1 — CLEAVE                    │
│  Combo: 3 axes. Scaling damage      │
│  (+1 per extra axe) + 1 Frost-bite. │
│                                     │
│  TIER 2 — GLACIER STRIKE            │
│  Combo: 2 axes + 2 fur.             │
│  Undefendable damage + Frost-bite.  │
│                                     │
│  TIER 3 — BLOOD HARVEST             │
│  Combo: 3 axes + 1 fur.             │
│  Heavy damage; feeds on Frenzy.     │
│                                     │
│  TIER 4 — WOLF'S HOWL (ULTIMATE)    │
│  Combo: requires the howl face.     │
│  Massive damage; lethal-preview     │
│  pulses when it would end the match.│
│                                     │
│  ───────────────────                │
│                                     │
│  DECK · 12 CARDS                    │ ← Section header
│  ┌──────┐ ┌──────┐ ┌──────┐         │
│  │ 2◉   │ │ 1◉   │ │ 3◉   │  …      │ ← Card thumbnails, scrollable
│  │ Sun  │ │ Rage │ │ Frost│         │   (tap to open ExpandedCardView)
│  │ Bls. │ │ Sh.  │ │ Wrt. │         │
│  └──────┘ └──────┘ └──────┘         │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  CHOOSE FOR MATCH           │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

The deck section shows the hero's current 12-card deck composition (as configured in HeroCustomizationScreen — Part 8.6.1). Cards render as small thumbnails using the same `<HandCard>` component from Part 2.9.3, in `playable={false}` state. Tapping a card thumbnail opens the ExpandedCardView (Part 6.6) in inspection mode. Below the deck preview, a primary button "EDIT LOADOUT & DECK" opens the HeroCustomizationScreen for this hero. The "CHOOSE FOR MATCH" button at the very bottom remains as the primary commit action.

**Hero content lives in** `ui/content/heroes/<heroId>.ts`. Schema:

```typescript
type HeroContent = {
  id: HeroId
  fullName: string                    // "Hael the Unbroken"
  displayName: string                 // "Berserker"
  element: HeroElement
  archetype: string                   // "Rush"
  complexity: 1 | 2 | 3
  flavor: string                      // The poetic description
  signature: {
    name: string                      // "Frenzy"
    description: string
  }
  abilityCatalog: HeroAbilityCatalog  // Pool the player picks from (see Part 8.6.1)
  cardCatalog: HeroCardCatalog        // Hero-specific cards (see Part 8.6.1)
  defaultLoadout: HeroLoadout         // Pre-built loadout used on first launch
  defaultDeck: DeckConfig             // Pre-built 12-card deck used on first launch
}
```

Note: HeroDetailScreen reads the player's CURRENT loadout and deck from localStorage (per Part 8.6.1 persistence) — not from `defaultLoadout`/`defaultDeck`. The hero content defines the catalog and defaults; the player's actual configuration is per-player state.

**ExpandedCardView in inspection mode:**

When the ExpandedCardView (Part 6.6) is opened from the HeroDetailScreen rather than from a match, it renders in inspection mode:
- The Play button is replaced with a Close button (default variant)
- No affordability or playability state is shown (irrelevant outside a match)
- The Cancel button is renamed to "Back" for clarity
- Tapping Close or Back dismisses the modal back to HeroDetailScreen

This is a single `mode` prop on ExpandedCardView: `mode: 'in-match' | 'inspection'`. The visual structure is identical; only the action buttons differ.

### 8.6.1 HeroCustomizationScreen

The screen where players configure their hero's loadout (which abilities go in T1-T3 slots; which 2 defenses are brought to matches) and build their deck (12 cards from the hero's available pool). One screen, two tabs: **Abilities** and **Deck**.

**Visual reference:** `design.html#p5-customization` shows the screen in both tab states — the Abilities tab with a T2 slot expanded to show the ability catalog, and the Deck tab with a partial deck built from a generic+specific card pool.

```typescript
// ui/components/screens/HeroCustomizationScreen/HeroCustomizationScreen.tsx

export type HeroCustomizationScreenProps = {
  heroId: HeroId
  loadout: HeroLoadout
  deck: DeckConfig
  onUpdateLoadout: (patch: Partial<HeroLoadout>) => void
  onUpdateDeck: (patch: Partial<DeckConfig>) => void
  onBack: () => void
  initialTab?: 'abilities' | 'deck'
}
```

**Data model — extends Part 0.3 state:**

```typescript
// In ui/types/loadout.ts

export type HeroLoadout = {
  heroId: HeroId
  abilities: {
    t1: AbilityId        // Selected T1 ability (from hero's T1 catalog)
    t2: AbilityId
    t3: AbilityId
    t4: AbilityId        // Selected T4 ultimate (from hero's T4 catalog — 2-4 options per hero)
  }
  defenses: [AbilityId, AbilityId]  // Exactly 2 — fill D1 and D2 slots in match
  updatedAt: number      // Timestamp; engine uses this to detect changes between matches
}

export type DeckConfig = {
  heroId: HeroId
  cards: CardId[]        // Length 12. Strict 4/3/3/2 cardCategory rule — see below.
  updatedAt: number
}

// Engine deck-composition rule (validated on match-start):
//   - Exactly 4 cards with cardCategory: 'generic'
//   - Exactly 3 cards with cardCategory: 'dice-manip'
//   - Exactly 3 cards with cardCategory: 'ladder-upgrade'
//   - Exactly 2 cards with cardCategory: 'signature'
//   - Total: 12 cards
//   - Max 2 copies of any cardId within these constraints
//
// The deck-builder UI MUST enforce this composition. The count badge should display
// per-category progress: "Generic 4/4 · Dice-manip 2/3 · Ladder-upgrade 3/3 · Signature 1/2 · Total 10/12".
// If the player attempts to start a match with an invalid composition, the Begin Match
// button is disabled with a tooltip explaining the missing slot(s). See deck-builder
// validation section below.

// Per-hero catalogs live in content/heroes/<heroId>.ts:
export type HeroAbilityCatalog = {
  abilityCatalog: Ability[]   // Flat list — UI groups by .tier field. Engine ships abilities flat.
  defensiveCatalog: Ability[] // Defensive abilities (typically 5-7); player picks 2
}

// Note: bible v0 listed t1/t2/t3/t4 as separate Ability[] arrays. Engine ships a flat
// abilityCatalog and the UI groups by the `tier` field at render time. The grouping
// is a UI concern, not a content-authoring concern.

export type HeroCardCatalog = {
  specific: Card[]       // Cards unique to this hero (signature + hero-flavored cards)
  // The "generic" pool lives separately in content/cards/generic.ts (shared across heroes)
  // The deck-builder draws from both: 4 from generic, 3 dice-manip + 3 ladder-upgrade + 2 signature
  // from specific[] (signature cards must come from specific; dice-manip/ladder-upgrade can
  // come from either pool depending on engine content).
}
```

**Persistence:** Both `loadout` and `deck` are saved per hero in `localStorage`:
- Key: `pact-of-heroes:loadout:<heroId>` and `pact-of-heroes:deck:<heroId>`
- Stored as JSON. Loaded on match start. If the keys don't exist, a default loadout/deck is generated from the hero catalog (first available ability per tier; first 12 cards in a curated default order).

**Layout — tabbed screen:**

```
┌─────────────────────────────────────┐
│  ‹ Back        BERSERKER            │  ← header bar
├─────────────────────────────────────┤
│  ▣ Abilities    ◯ Deck   ✓ 4/3/3/2  │  ← tab switcher + deck composition status
├─────────────────────────────────────┤
│                                     │
│  [Tab content renders here]         │
│                                     │
└─────────────────────────────────────┘
```

The header shows the hero's display name. The tab switcher has two pills: Abilities and Deck, with the active tap highlighted in gold. The Deck tab also shows a small composition badge — when all four category counts match the 4/3/3/2 rule, it renders as a green-tinted "✓ 4/3/3/2"; when any category is incomplete, it shows the current state in ember-tinted form (e.g., "3/3/3/1") so the player can scan progress without switching tabs. Mismatched compositions also block the Begin Match button (see validation section).

#### Abilities tab — layout

```
TIER 4 · ULTIMATE · CURRENT: RAGNAROK      ← Section header + current selection
┌─────────────────────────────────────┐
│ [10] RAGNAROK              ✓        │  ← Current pick (gold halo, checkmark)
│      ult · lethal if HP ≤ 10        │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ [12] IRON TEMPEST                   │  ← Alternative ultimate
│      ult · scales w/Frost-bite      │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ [8] BERSERKER'S WAKE                │
│     ult · gain Frenzy + heal 6      │
└─────────────────────────────────────┘
 ⓘ Each Berserker ultimate plays the same 5-dice combo lane.

TIER 3 · CURRENT: HOWLING BLITZ           ← Section header + current selection
┌─────────────────────────────────────┐
│ [8] HOWLING BLITZ          ✓        │  ← Current pick (gold halo, checkmark)
│     damage + Frost-bite ×2          │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ [7] AVALANCHE                       │  ← Alternative option
│     damage + Stun                   │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ [9] WHIRLWIND                       │
│     damage to all targets           │
└─────────────────────────────────────┘

TIER 2 · CURRENT: FROST MAUL
... (same pattern)

TIER 1 · CURRENT: BRUTAL STRIKE
... (same pattern)

DEFENSES · 2 OF 2 PICKED
┌─────────────────────────────────────┐
│ [D1] DAWN-WARD            ✓        │  ← Picked (count = 1)
│      Heal 4 — 1+ dawn               │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ [D2] PRAYER OF SHIELDING  ✓        │  ← Picked (count = 2/2)
│      Reduce 5 + 1 Radiance          │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ WALL OF DAWN                        │  ← Available (not picked; can't pick if 2/2)
│ Reduce 8 — 2+ sun                   │
└─────────────────────────────────────┘
```

**Interaction:**
- Tapping any non-current ability in a T1/T2/T3/T4 section sets it as the new pick for that tier. Visual feedback: brief gold flash on the new pick; the previous pick loses its checkmark.
- All four tiers behave the same way — each hero has 2-4 options per tier including T4 (ultimates). Hero identity comes from dice composition and signature mechanic; the T4 pick is one expression of build choice on top of that foundation.
- Defensive section: tap to add (up to 2). When 2 are picked, the 3rd-onwards are dimmed (opacity 0.5) with a label "Unpick one to swap." Tapping a dimmed row reveals an inline "Replace which?" prompt offering the two currently-picked defenses; selecting one swaps it for the tapped row.

#### Deck tab — layout

```
[Left half: Your Deck (8/12)]    [Right half: Available Cards]

YOUR DECK · 8 / 12               BERSERKER CARDS
┌────────────────────┐           ┌────────────────────┐
│ [2] Icy Grip   ×2  │ −         │ [2] Pursuit   1/2  │ +
│     1+ Frost-bite   │           │     Reroll dice    │
├────────────────────┤           ├────────────────────┤
│ [2] Blood Rage ×2  │ −         │ [3] Avalanche 0/2  │ +
│     +2 dmg · Empower│           │     AOE damage     │
...                              ...

GENERIC CARDS (visible across heroes)
┌────────────────────┐
│ [1] Steady    1/2  │ +
│     Lock 1 die     │
...
```

**Deck building flow:**
- Left column: cards currently in deck, with copy count badge (×1, ×2). Tapping the "−" button removes one copy.
- Right column: scrollable list of all cards available to this hero, split into **Hero-specific** and **Generic** sections. Each row shows current-in-deck count (e.g., "1/2") and a "+" button to add a copy. If the card is at 2/2 cap, the "+" button is dimmed.
- Cards are sorted within each section by cost ascending, then alphabetically.
- Generic cards have a small "GEN" badge in their cost pip to distinguish them visually from hero-specific cards.
- A persistent footer at the bottom shows: `8/12 cards · average cost 1.9 · [low/mid/high] curve breakdown`. The deck must be exactly 12 cards before the player can leave (or auto-saves an incomplete deck flagged as invalid).
- When the player has fewer than 12 cards, a "Fill with defaults" button auto-fills the remaining slots with low-cost cards from the hero's specific catalog.

**Default loadout / deck on first launch:**

When a player first opens HeroCustomizationScreen for a hero, the screen is populated with:
- Loadout: first ability in each tier's catalog (so the player sees a working configuration immediately)
- Deck: a curated 12-card starting deck defined in `content/heroes/<heroId>.ts` as `defaultDeck: CardId[]`

This means the player can play immediately without ever opening the customization screen. Customization is meaningful but never mandatory.

**Acceptance criteria:**

1. The Abilities tab and Deck tab share screen real estate via a tab switcher. Only one tab's content is visible at a time. Switching tabs is instant (no animation; switching is a low-cognitive-load action).
2. Saving is implicit — every change writes to localStorage immediately. No explicit "Save" button.
3. The header shows the hero's display name and a Back button. Tapping Back returns to the previous screen (HomeScreen, HeroBookScreen, or HeroDetailScreen depending on entry point).
4. The Deck tab's count badge shows current count out of 12. Counts < 12 render in `var(--ember-bright)` to signal "deck not yet ready"; counts === 12 render in `var(--gold-bright)`.
5. The defensive section enforces exactly 2 picks. The player cannot leave the screen with 0 or 1 picks; if they try, a toast warns them and auto-restores the previous valid state.
6. Cards are added/removed with a single tap on the "+"/"−" buttons. No drag-and-drop in MVP.
7. The "Fill with defaults" action is only enabled when the deck has fewer than 12 cards.
8. The currently-active tab persists across screen visits within a session (player who left on Deck tab returns to Deck tab).

#### Entry points

The HeroCustomizationScreen is accessible from three places:

1. **HeroDetailScreen** — A primary button "EDIT LOADOUT & DECK" replaces the static deck preview (see 8.6 update below). This is the primary, intentional path.
2. **HeroSelectScreen** — A secondary button "EDIT" next to "BEGIN MATCH" lets the player customize without going through HeroBook. Confirms a "you'll be customizing for [hero]?" toast.
3. **OnboardingFlow Step 6** — A new step (see 8.7 update) nudges the player to customize once on first launch. Tapping "Customize" jumps to the customization screen for the player's chosen hero. Tapping "Skip" continues to the match with default loadout/deck.

### 8.7 OnboardingFlow

A first-launch tutorial that introduces dice, locking, eligibility, and combos. Skippable.

**Visual reference:** `design.html#p5-onboarding` shows two representative steps (Step 2 — Dice lock; Step 3 — The Ladder) in a dual-phone layout, demonstrating the progress dots, focused visual, prose, and action button pattern.

```typescript
// ui/components/screens/OnboardingFlow/OnboardingFlow.tsx

export type OnboardingFlowProps = {
  onComplete: () => void
  onSkip: () => void
}
```

**Structure:**

Six sequential screens, each with a "Next" and "Skip All" button:

1. **Welcome** — Title, brief premise. "You are a hero who fights with dice."
2. **Dice** — Show a die. "Tap to lock a die you want to keep. Locked dice don't reroll."
3. **The Ladder** — Show the ability ladder mockup. "Four tiers. Higher tier = bigger play. Combo dice to unlock them."
4. **Tokens** — Show a token example (Frost-bite). "Heroes accumulate tokens that bend the rules."
5. **Get started** — "That's the basics. Pick a hero and begin."
6. **Customize (optional)** — Shown after hero select. "Want to swap abilities or build your deck? You can change them anytime." Buttons: "Customize" (jumps to HeroCustomizationScreen for chosen hero) and "Use defaults" (proceeds to match with default loadout/deck). This step appears only once; players who skip can still access customization later from HeroDetailScreen.

**Visual:**

- Each screen has a centered hero illustration (or visual) and short prose
- Bottom: "Next" button (primary) and "Skip All" button (default, smaller)
- Progress indicator: 6 dots at top, current dot filled gold
- Step 6 replaces "Next" with two buttons: "Customize" (primary, gold) and "Use defaults" (default, smaller)

**Acceptance criteria:**

1. Onboarding runs only on first launch (detected via localStorage flag `pact-of-heroes-onboarded`).
2. "Skip All" sets the flag and navigates to HomeScreen.
3. Completing all six screens sets the flag and navigates to HomeScreen (or HeroCustomizationScreen if the player picked "Customize" on step 6).
4. The Settings screen has a "Replay Tutorial" button that clears the flag and reroutes to onboarding.

### 8.8 In-match menu

During a match, the player may want to: pause-equivalent (close menu), concede, view help, or check settings. v1 includes a minimal in-match menu with **Concede** as the only actively-functional non-cosmetic option.

A small `⋮` icon in the top-right corner of MatchScreen opens an in-match menu drawer:

```
┌──────────────────────┐
│   ☰ Menu             │
│                      │
│   • Resume           │ ← Closes the menu
│   • View Tutorial    │ ← Opens overlay tutorial (deferred to v1.1)
│   • Settings         │ ← Routes to /settings (and back here on return)
│   • Concede Match    │ ← Two-tap confirmation, then ends match
│                      │
└──────────────────────┘
```

**Concede flow:**

1. Player taps `• Concede Match`
2. UI shows a confirmation overlay: `"Concede the match?"` with two buttons:
   - **Concede** (crimson primary)
   - **Cancel** (default, gold-dim)
3. If player taps Concede: UI dispatches `{ kind: 'concede', player: viewerId }` to the engine
4. Engine immediately:
   - Sets `gameState.winner = (opponentId)`
   - Transitions to `match-end` phase
   - Emits `match-ended` event with `reason: 'concede'`
5. UI transitions to MatchSummaryScreen with the loss treatment (crimson-tinted "Match Conceded" header instead of the typical "Defeat" / "Victory" copy)
6. The summary screen otherwise renders normally so the player can review the match before exiting

**Why a two-tap confirm.** Conceding mid-match is destructive (no undo, no continue), and the menu is reachable without obstruction. The single-step confirmation prevents accidental concedes. The confirmation overlay also briefly tells the player "the opponent will be awarded the match" so the consequence is clear.

**Engine action.** Engine's `concede` action takes a `player: PlayerId` parameter so either player can concede (in PvP both can; in MVP single-player only the viewer has the affordance, since the AI doesn't surrender).

### 8.9 Hot-seat mode

Engine supports a `MatchMode = 'hot-seat' | 'vs-ai'` (see Part 0.3). In hot-seat mode, two human players share one device and pass it between turns. v1 is single-device, single-account; hot-seat is a feature to consider for early PvP testing without server infrastructure.

**Hot-seat handoff curtain.** When `mode === 'hot-seat'`, at every turn boundary, a curtain overlay slides up from the bottom of the screen covering the entire MatchScreen. The curtain displays:

- Hero name and portrait of the player whose turn is now starting (so the next player knows it's their turn)
- A "Tap to begin your turn" affordance at the bottom
- Tap → curtain slides down, revealing the MatchScreen now perspective-flipped to the new active player

The curtain ensures one player doesn't see the other's hand/loadout. The MatchScreen's perspective derivation (Part 0.4, Convention 5) already supports flipping between viewers without code changes — hot-seat just changes `viewerId` at each turn boundary and re-renders.

**v1 scope:** the hot-seat curtain component (`<HotSeatCurtain>`) is in v1 but **only active when** the player explicitly starts a hot-seat match (a Start Match option in HomeScreen, deferred to v1.1). For MVP, all matches are `mode: 'vs-ai'` and the curtain never fires.

### 8.10 Hooks for future surfaces

Surfaces NOT specified in v1 but reserved for later:

- `/multiplayer` — Async PvP lobby and match queue
- `/profile` — Stats, achievements, history
- `/store` — Cosmetics, hero unlocks (if monetization is added)
- `/news` — Patch notes, announcements
- `/social` — Friend list, recent opponents

These should not be implemented in v1. The router should have a fallback for unknown routes that returns the user to HomeScreen with a toast: "Coming soon."


---

## Part 9 — Test Scenarios

This part converts the design doc's gameplay scenarios into engineer-runnable test specifications. Each scenario has a deterministic setup, an explicit action sequence, and verifiable expected outcomes — written so that an automated test (Vitest, Playwright, or manual QA) can run them.

The scenarios are split into:
- **Token scenarios** (the six in Part 2 of the design doc, plus a few additions for edge cases)
- **Ladder scenarios** (eligibility transitions, lethal state, scaling)
- **Resolution scenarios** (animation timing, multi-effect, defense)
- **Modal scenarios** (defensive picker, spend prompt, tooltip)

Each scenario follows the same template:

```
SCENARIO: [name]
SETUP: [initial game state and UI state]
STEPS: [numbered list of dispatched actions or UI interactions]
EXPECTED: [observable component states at the end]
ANIMATIONS: [optional, for visual-timing-sensitive scenarios]
```

### 9.1 Token scenarios

#### 9.1.1 Frost-bite applied, weakens the holder, and thaws at upkeep

```
SCENARIO: Berserker stacks Frost-bite on the Pyromancer; the debuff weakens the
Pyromancer's offense and ticks at the Pyromancer's own upkeep
(Resolved in revision 1.1 — engine truth: Frost-bite is NOT consumed for bonus
damage. It is a max-4 debuff that (a) imposes −1 damage per stack on the HOLDER's
offensive abilities, and (b) ticks at the holder's upkeep for 1 damage, thawing
1 stack per tick.)

SETUP:
- Player hero: berserker
- Opponent hero: pyromancer (HP: 24/30)
- Opponent statuses: [{ id: 'berserker:frostbite', stacks: 2, appliedBy: 'p1' }]
- Player dice (locked): [axe×3, fur×2] — satisfies Glacier Strike's compound combo
- Ladder state: T2 Glacier Strike → triggered (eligible)
- Phase: offensive-roll (player can commit)

STEPS:
1. Player taps Activate in ExpandedAbilityView → UI dispatches select-offensive-ability
2. Engine resolves Glacier Strike (undefendable damage + applies 1 Frost-bite)
3. Turn passes to the Pyromancer; upkeep begins

EXPECTED (after step 2):
- useResolutionTimer fires: snapshots HP before events arrive
- FieldOfPlay overlay renders with elementalTone='frost'
- AbilityNameDisplay shows "Glacier Strike"
- DamageNumber shows the ability's damage, variant='undefendable'
- EffectRows renders:
  1. damage marker (ember) "−N HP · undefendable"
  2. token marker (frost) "+1 Frost-bite applied"
- Opponent SignatureChip[berserker:frostbite] count animates 2 → 3 (brief glow flash, no re-entrance)
- Opponent HP bar interpolates from snapshotted 24 → engine's already-applied value over 600ms

EXPECTED (after step 3 — the Pyromancer's upkeep):
- UpkeepFOP plays a status-tick beat: label "Frost-bite", value "−1", tone='frost'
- Pyromancer HP decrements by 1; SignatureChip count ticks 3 → 2 (thaw) with the
  isTicking scale pulse
- While any Frost-bite stacks remain, the Pyromancer's ladder badge values render
  the −1/stack offense penalty (engine pre-computes; UI just displays the
  effective damage on the AbilityValueBadge)

ANIMATIONS:
- At ~1400ms (fade-out) of step 2's resolution, opponent strip flashes ember-bright for 400ms
- The upkeep thaw tick uses the standard ~700ms UpkeepFOP beat
```

#### 9.1.2 Cinder detonates at threshold

```
SCENARIO: Pyromancer applies Cinder stack triggering detonation
(Resolved in revision 1.1 — engine truth: threshold 5, on-application-overflow,
8 undefendable damage, stacks reset to 0, Pyromancer gains +2 CP on detonation.)

SETUP:
- Player hero: pyromancer
- Opponent hero: berserker (HP: 18/30, statuses: [{ id: 'pyromancer:cinder', stacks: 4 }])
- Player dice (locked): [ash×2, ember×2] — satisfies compound combo for Firestorm
- Ladder state: T2 Firestorm → triggered (eligible)
- Phase: main-pre

STEPS:
1. Player taps Activate → dispatches select-offensive-ability
2. Engine resolves Firestorm (applies +1 Cinder, brings count to 5 → threshold reached)

EXPECTED:
- useResolutionTimer fires; snapshots HP + Cinder count before events arrive
- First resolution plays for Firestorm (~2000ms):
  - AbilityNameDisplay: "Firestorm"
  - DamageNumber: Firestorm's base damage
  - EffectRows: damage row, +1 Cinder row
  - Opponent SignatureChip[pyromancer:cinder] count animates 4 → 5
  - At count 5, the detonation fires immediately (engine resolves inline in applyStatus)
- Engine emits status-detonated event
- Second resolution begins for detonation (~2000ms):
  - FOPScene kind: 'detonation'
  - ParticleField density: 'burst'
  - "— Detonation —" label
  - DamageNumber: 8, variant='undefendable'
  - Caption: "Cinder ×5 → 8 AoE damage"
  - Opponent SignatureChip[pyromancer:cinder] explodes (scale to 1.6, flash, particle burst), then removes (stacks reset to 0)
- Pyromancer CP increments +2 (selfStatusDetonated trigger) with the CPValue gaining pulse
- Opponent HP interpolates from 18 → post-Firestorm → final value (detonation), tracking engine state
- Phase banner reads "Resolving · Firestorm" then "Resolving · Detonation"

ANIMATIONS:
- Reduced motion: scale-burst replaced with single opacity flash, particles disabled, total timing identical
- Threshold-pulse on Cinder chip is visible at count 4 (the "one more and it blows" warning state)
```

#### 9.1.3 Lightbearer banks and spends Radiance

```
SCENARIO: Lightbearer accumulates Radiance via Sun Strike, spends to empower next attack

SETUP:
- Player hero: lightbearer (HP: 22/30, signatureState.radiance: 2 — banked from match start)
- Opponent hero: berserker (HP: 25/30)
- Player dice (locked): [sword×2, sun, dawn] — satisfies compound combo for Sun Strike
- Ladder state: T2 Sun Strike → triggered (eligible)
- Phase: main-pre

STEPS:
1. Player taps Confirm → dispatches select-offensive-ability
2. Engine resolves Sun Strike (5 undefendable damage + 1 Radiance gain + 1 Verdict applied)
3. Engine emits offensive-resolution flow; pendingBankSpend may be set if Radiance spend option exists
4. SpendOverlay renders (if pendingBankSpend is set)
5. Player taps damage-bonus spend option (engine-supplied, generic — not per-ability)
6. UI dispatches spend-bank with amount=2

EXPECTED:
- After step 2:
  - SignatureCounter[radiance] count animates 2 → 3 with isGaining animation
  - Opponent SignatureChip[lightbearer:verdict] appears with slam-in animation
  - Opponent HP interpolates from snapshotted 25 → 20 via useResolutionTimer hook
- After step 3 (SpendOverlay appears):
  - SpendOverlay shows AvailableResourceDisplay: "3"  (current Radiance bank)
  - SpendOption rows render the engine's generic spend modes (damage-bonus, heal-self, reduce-incoming),
    NOT per-ability names. UI authors display labels per spend kind.
  - Phase banner: "Spend Radiance?"
- After step 6:
  - SignatureCounter[radiance] count animates 3 → 1
  - A small follow-up resolution plays: AbilityNameDisplay "Empowered Strike", DamageNumber "+4", EffectRows "+4 damage" (engine: +2 damage per token spent × 2 tokens)
  - Opponent HP interpolates 20 → 16
- Final state:
  - Player signatureState.radiance: 1
  - Opponent HP: 16/30
  - Opponent statuses: [{ id: 'lightbearer:verdict', stacks: 1 }]
```

> **Bible v0 corrections.** Earlier draft used "unblockable" damage type (engine term is `undefendable`), per-ability spend mode names like "Empower Sun Strike" (engine has only generic spend modes — damage-bonus, heal-self, reduce-incoming — UI authors display labels), and `SPEND_PROMPT` / `RESOLVE_ABILITY` SCREAMING_SNAKE actions (engine uses kebab-case kind discriminators per Part 0.4).

#### 9.1.4 Verdict cleared via Atone

```
SCENARIO: Player atones to clear Verdict stacks via status-holder-action

SETUP:
- Player hero: lightbearer
- Player statuses: [{ id: 'lightbearer:verdict', stacks: 2 }]   // Yes, Verdict can be on self
- Player CP: 3
- Phase: main-pre (or main-post — Atone is playable during the player's main phase)

STEPS:
1. UI shows Atone affordance on the Verdict chip (player can tap to trigger status-holder-action)
2. UI dispatches { kind: 'status-holder-action', status: 'lightbearer:verdict', actionIndex: 0 }
3. Engine resolves the holder action: deducts 2 CP, strips ALL Verdict stacks

EXPECTED:
- ConsumeContent scene renders (token-clear variant):
  - AbilityNameDisplay: "Atone"
  - Two ConsumedToken[verdict] in a row with dawn strikethrough
  - Downward arrow connector (↓)
  - "−2" clear label (damage-style position, dawn-tinted)
  - Equation caption: "Verdict ×2 → cleared · −2 CP"
- SignatureChip[lightbearer:verdict] count animates 2 → 0, then fades out (status-removed event fired)
- Player CP interpolates 3 → 1 (engine applies cost; UI animates the snapshot delta)
- Total scene duration: ~1800ms (compressed since no damage scaling)

> Resolved in revision 1.1 — engine truth from lightbearer.ts holderRemovalActions:
> phase 'main-phase', cost { resource: 'cp', amount: 2 }, effect { stacksRemoved: 'all' },
> UI copy: actionName "Atone", confirmationPrompt "Spend 2 CP to remove all Verdict stacks?".
```

#### 9.1.5 Frenzy gained on damage taken

```
SCENARIO: Berserker takes damage from opponent's offensive ability; Frenzy counter gains +1

SETUP:
- Player hero: berserker
- Player heroSnapshot.signatureState.frenzy = 2 (already 2 stacks banked from prior turns)
- Phase: defensive-roll (opponent has just committed an ability; damage is about to apply)
- Opponent commits Firestorm dealing 5 damage to Berserker

STEPS:
1. Engine emits damage-dealt event with target=berserker, amount=5
2. Damage applies; Berserker HP decreases

EXPECTED:
- HPTrack interpolates Berserker HP from prev to new value over the cinematic
- Engine increments frenzy counter: 2 → 3 (capped at +1 per turn, regardless of how many hits)
- Engine emits signature-counter-changed event with kind='frenzy', delta=+1, newValue=3
- SignatureCounter[frenzy] renders with isGaining=true:
  - Counter chip plays counter-gain animation (350ms scale 1.0 → 1.18 → 1.0)
  - Count badge updates from "2" to "3" at the animation's 40% peak
  - Box-shadow briefly intensifies (0 0 6px → 0 0 18px → 0 0 6px frost-bright glow)
- After settle: Frenzy chip displays count badge "3" with subtle 1.6s pulse if at bankCap
- All subsequent offensive abilities from this player will deal +3 damage from Frenzy
- Activity Log entry: "Frenzy 2 → 3 (damage taken)"

NEGATIVE — already-gained-this-turn:
- If frenzy was already incremented this turn (e.g., a prior hit), a subsequent hit
  does NOT increment frenzy further (engine enforces +1/turn cap)
- SignatureCounter renders no isGaining animation; counter unchanged
- Activity Log shows no Frenzy entry for the subsequent hit

NEGATIVE — at bankCap:
- If frenzy === 6 (bankCap) and Berserker takes damage, no gain occurs
- SignatureCounter remains at count 6 with `isCapped` pulse active
- Engine emits no signature-counter-changed event (no change to emit)
```

> **Bible v0 correction.** Earlier drafts of this scenario described Frenzy "lighting up" when 3+ sword faces were locked (binary lit/dormant glyph) and adding +2 damage. Engine reality (per Part 4.2 Batch 3 rewrite): Frenzy is a 0-6 bankable counter, gained when the holder takes damage from the opponent's offensive ability (+1 per turn cap), and adds +1 damage per stack to subsequent offensive abilities. The scenario above reflects engine truth.

#### 9.1.6 Burn ticks at upkeep

```
SCENARIO: Berserker has 2 Burn stacks, upkeep ticks each

SETUP:
- Player hero: berserker (HP: 28/30, statuses: { burn: 2 })
- Phase: TURN_END → UPKEEP transition

STEPS:
1. Engine enters upkeep
2. For each Burn stack, engine emits STATUS_TICK event with damage value

EXPECTED:
- Phase banner reads "Upkeep · Burn Ticks"
- First tick:
  - UpkeepFOP renders in middle-band region with eventKind='status-tick', label="Burn Ticks", value="−2", tone='ember'
  - Animation: ~700ms beat (label fade-in 0-150ms, value scale 0.7→1.05→1.0 over 150-250ms, hold 250-600ms, fade out 600-700ms)
  - Ability ladder behind FOP dims to opacity 0.10 for the duration of the beat
  - Player HP animates 28 → 26 over 600ms (sync with FOP beat)
- 100ms gap (total 800ms inter-tick spacing), second tick fires:
  - Same UpkeepFOP animation, value "−2"
  - Player HP animates 26 → 24
- Burn status decay after both ticks:
  - StatusChip[burn] count decrements 2 → 1 (or 0 depending on engine logic)
- Total upkeep duration for 2 ticks: ~1600ms (700ms beat + 100ms gap, twice)
```

### 9.2 Ladder scenarios

#### 9.2.1 Near-eligible → eligible transition

```
SCENARIO: Reroll produces the needed die face, ability becomes eligible

SETUP:
- Lightbearer with dice showing [sword, sword, sword, zenith, sword] (4 swords, 1 zenith)
- T2 Sun Strike combo (compound): 2 sword + 1 sun + 1 dawn
- T2 state: ineligible (missing sun + dawn faces; have 2/4 pips)
- Player has 1 reroll remaining

STEPS:
1. Player leaves dice 0-1 (swords) locked; unlocks dice 2 and 3
2. Player taps Reroll

EXPECTED:
- During reroll animation (~600ms), unlocked dice show tumble animation
- After reroll, dice produce e.g. [sword, sword, sun, dawn, sword]
- Engine recomputes T2 Sun Strike combo state:
  - pips: ['gold', 'gold', 'gold', 'gold'] (all four required faces present on unlocked dice; would be 'pulse' if the player locks them before rolling)
  - status: eligible
- ComboGlyphStrip animates: all four pips become gold-filled (200ms cross-fade per pip)
- AbilityRow data-state transitions ineligible → eligible (border, background, left-marker, shadow all cross-fade over 250ms)
- AbilityRow name color transitions bone → gold-bright with text-shadow
- Phase banner reads "Roll · 3 of 3"
```

#### 9.2.2 Lethal pulse activates

```
SCENARIO: Opponent HP drops below lethal threshold, T4 row becomes lethal (UI-computed kill preview)

SETUP:
- Berserker, ultimate Wolf's Howl (deals 14 damage; UI-computed isLethal when incoming ≥ opp.hp)
- Opponent HP: 12
- Berserker T4 Wolf's Howl: engine ladderRowState.state='triggered' (combo met)
- T4 row currently in 'ultimate eligible' state (dawn-pulsing left marker)
- UI's isLethal currently false (14 > 12 not yet evaluated, or computed and false because incoming display reads 14 dmg vs opp.hp 12 — wait, 14 ≥ 12 IS lethal; setup adjusted below)

SETUP REVISED — to demonstrate the transition cleanly:
- Opponent HP: 16 (above Wolf's Howl's 14 damage)
- T4 Wolf's Howl: ladderRowState.state='triggered', isLethal=false (14 < 16)

STEPS:
1. Engine ticks Burn damage on opponent: 16 → 14
2. UI recomputes isLethal at next render: incoming damage 14 ≥ opp.hp 14 → isLethal=true

EXPECTED:
- T4 AbilityRow data-state changes from 'eligible' to 'lethal' (UI-applied class)
- Border color cross-fades dawn → crimson-bright (200ms)
- Background gradient cross-fades to crimson-tinted (200ms)
- Left marker cross-fades to crimson-bright (200ms)
- box-shadow becomes crimson with halo (200ms)
- @keyframes lethal-pulse animation starts (1200ms infinite)
- Effect text REPLACES with kill-preview line:
  - Was: "14 ult + Stun"
  - Now: "LETHAL · WILL END THE MATCH" in crimson-bright Cinzel 10px uppercase
- Phase banner switches to "Lethal · Wolf's Howl" in crimson tone
- Tapping the T4 row opens ExpandedAbilityView in the crimson lethal variant; its commit button reads "LETHAL STRIKE" (the modal is the only commit path — see Part 6.7)

> **Bible v0 correction.** Earlier draft framed lethal as an engine state derived from a `lethalCondition` field on the ability. Per Decision 4, isLethal is a UI computation — `incoming >= opp.hp` evaluated against whatever the badge currently displays. The engine's `LadderRowState.lethal` flag is a separate concept (informational only for UI in MVP). The scenario above reflects the UI-computed model.
```

#### 9.2.3 T1 scaling preview updates as dice lock

```
SCENARIO: Berserker locks additional axe faces, T1 Cleave scaling updates

SETUP:
- Berserker T1 Cleave — engine effect tree contains a `scaling-damage` effect with:
  - baseAmount: 3       (damage at the minimum combo — 2 axes)
  - perExtra: 1         (+1 per extra axe beyond the combo minimum)
  - maxExtra: 3         (scaling caps at +3, so max damage = 3 + 3 = 6)
  - type: 'normal'      (damageType — 'normal' | 'undefendable' | etc.)
  - extraSymbol: 'berserker:axe'  (which symbol counts as "extra" for scaling)
- LadderAbility.scaling preview struct: { currentDamage, maxDamage, perExtra, extraSymbol }
- Dice (locked): [axe, axe, fur, fur, axe] — 3 axes locked (combo of 2 + 1 extra)
- T1 ladderRowState.state: 'triggered'
- AbilityValueBadge shows "4" (base 3 + 1 extra = 4)

STEPS:
1. Player rerolls remaining unlocked dice; gets an additional axe
2. Player locks the new axe (4th axe locked → 2 extras above the combo minimum)

EXPECTED:
- Engine recomputes scaling preview: currentDamage = baseAmount + min(extras, maxExtra) × perExtra = 3 + min(2, 3) × 1 = 5
- LadderAbility.scaling.currentDamage updates 4 → 5
- AbilityValueBadge animates: scaling-pulse className applied for one cycle (350ms scale animation, dawn-gold flash at peak)
- Badge value updates 4 → 5 during the pulse
- Effect text shortText updates if it references the dynamic value (e.g., "5 dmg + Frost-bite")

NEGATIVE — scaling already at cap:
- If extras === maxExtra (3 extras locked → currentDamage 6), locking yet another axe does NOT increase currentDamage
- ladderRowState may still update (probability or other fields), but the value badge does not pulse
- An UI affordance ("Max scaling reached") could surface as a small caption near the badge — currently not specified, deferred to content polish

> **Bible v0 correction.** Earlier draft used Brutal Strike with damage `3/4/5/6 based on sword count` and a flat AbilityScaling shape (`baseDamage / bonusPerExtraDie / maxBonusDice / faceToScaleWith`). Engine reality: the scaling lives inside the ability's AbilityEffect tree as a `scaling-damage` effect kind with `baseAmount / perExtra / maxExtra / type / extraSymbol`. The UI projects this into a ScalingPreview struct (Part 3.1) for the value badge. Berserker has no sword symbol — the engine's extraSymbol for Cleave's scaling is `'berserker:axe'`.
```

#### 9.2.4 Defensive overlay with combo + dice count

```
SCENARIO: Opponent attacks; defensive picker shows two options

SETUP:
- Opponent Pyromancer fires Firestorm (5 undefendable damage + 2 Cinder)
- Player Lightbearer (HP: 24/30, Radiance: 4/6)
- Player has two defensive options (selected in HeroCustomizationScreen prior to match):
  - D1 Dawn-Ward: heal 4, 3 dice rolled, combo: [dawn]
  - D2 Prayer of Shielding: reduce 5 + 1 Radiance, 4 dice rolled, combo: [dawn, dawn]

STEPS:
1. Engine emits DEFENSIVE_PROMPT
2. DefensiveOverlay renders
3. Player taps D2 Prayer of Shielding
4. Player taps Confirm Pick

EXPECTED:
- DefensiveOverlay renders with inset 16.5% 0 30.5% 0 (spans dice tray, middle band, self strip; leaves hand + action bar accessible)
- IncomingDamageBlock shows:
  - Label: "— Incoming —"
  - Damage: "5" in ember-bright Cinzel 32px
  - Source: "Firestorm · ub · +2 Cinder"
- DefensiveLadder shows two rows, both rendered with **equal visual weight** (no engine recommendation, no "optimal pick" gold halo on either row):
  - First row (D1 slot): name "Dawn-Ward", text "Heal 4 HP", ComboGlyphStrip [dawn outlined frost-tinted], DefDiceBadge "3D"
  - Second row (D2 slot): same structure, name "Prayer of Shielding", text "Reduce 5 + 1 Radiance", ComboGlyphStrip [dawn, dawn outlined frost-tinted], DefDiceBadge "4D"
  - **No TierBadge rendered** — the D1/D2 slot identifier exists only in the `defense.tier` data field; the picker UI uses row position + name + combo to identify each option (see Part 3 DefensiveRow JSX)
- After step 3 (player taps the second row, Prayer of Shielding): second row enters **selected** state (gold border + halo). First row dims slightly to indicate the unselected option. Confirm button enables.
- After step 4 (Confirm): overlay fades out (200ms), defense resolution plays
```

#### 9.2.5 Multi-effect resolution renders effect rows

```
SCENARIO: Lightbearer Sun Strike with multi-effect breakdown

SETUP:
- Player Lightbearer fires Sun Strike
- Effects: 5 undefendable damage, +1 Radiance, +1 Verdict applied to opponent

STEPS:
1. Player taps Confirm
2. Engine emits RESOLVE_ABILITY with the multi-effect

EXPECTED:
- FOP renders with elementalTone='dawn'
- AbilityNameDisplay: "Sun Strike"
- DamageNumber: 5, variant='damage'
- EffectRows shows three rows with stagger:
  - At 700ms: row 1 fades in with marker pulse — ember marker, "−5 HP · undefendable"
  - At 800ms: row 2 — dawn marker, "+1 Radiance"
  - At 900ms: row 3 — gold marker, "+1 Verdict applied"
- All three markers are 12×12 squared with their respective color, box-shadow glow
- Player StatusChip[radiance] count animates 4 → 5
- Opponent SignatureChip[verdict] slams in (250ms entry)
- Opponent HP: 25 → 20 over 600ms
```

### 9.3 Resolution timing scenarios

#### 9.3.1 Standard resolution timing

```
SCENARIO: Any standard T1-T3 ability resolves with correct phase timing

SETUP:
- Any ability that fires and produces a standard resolution scene
- Performance timer starts at 0ms when select-offensive-ability is dispatched

STEPS:
1. Dispatch select-offensive-ability at t=0

EXPECTED (timing tolerances ±20ms):
- t=0: resolutionPhase='preconfirm', activeOverlay='fop'
- t=100: resolutionPhase='fade-in', FOP opacity transition begins
- t=250: resolutionPhase='name-in', AbilityNameDisplay opacity 0 → 1
- t=450: resolutionPhase='damage-in', DamageNumber scale 0 → 1 with overshoot
- t=700: resolutionPhase='effects-in', EffectRows begin stagger
- t=1000: resolutionPhase='holding', everything visible
- t=1400: resolutionPhase='fade-out', FOP opacity 1 → 0 begins
- t=2000: resolutionPhase='idle', activeOverlay='none', fopScene=null
  (no completion action is dispatched back to the engine — per Part 7.4
   snapshot-and-interpolate, the engine moved on the moment it emitted events)

If any phase transition deviates by more than 50ms from this schedule, the test fails.
```

#### 9.3.2 Ultimate resolution timing

```
SCENARIO: T4 ultimate fires, full takeover plays

SETUP:
- T4 ultimate eligible and confirmed

STEPS:
1. Dispatch select-offensive-ability at t=0

EXPECTED (timing tolerances ±50ms):
- t=0: activeOverlay='ultimate', UltimateTakeover mounts
- t=100: hero portrait scales in
- t=300: ultimate name fades in
- t=500: tier label fades in
- t=800: bark line fades in
- t=1200: damage number scales in (impact moment)
- t=1500: hold phase begins
- t=2900: hold phase ends
- t=2900: all elements fade out
- t=3300: UltimateTakeover unmounts (no completion action dispatched — Part 7.4)

Total: ~3300-3500ms.
```

### 9.4 Modal interaction scenarios

#### 9.4.1 Tooltip on long-press

```
SCENARIO: Player long-presses a Frost-bite chip; tooltip appears

SETUP:
- Opponent has 3 Frost-bite stacks
- SignatureChip[frostbite] rendered on opponent strip

STEPS:
1. Player pointerdown on the chip at t=0
2. Player holds for 500ms (≥ 400ms long-press threshold)

EXPECTED:
- At t=400ms (long-press fires): TooltipRenderer becomes visible
- Tooltip content kind: 'signature-token'
- Tooltip text: "FROST-BITE. Berserker signature. 3 stacks. Consumed by Berserker damage abilities for +1 bonus damage per stack."
- Tooltip positioned above the chip (anchor coordinates from event)
- Entry animation: opacity 0 → 1, translateY +4 → 0, over 150ms

ADDITIONAL:
3. Player taps outside the tooltip (e.g., on the dice tray)
EXPECTED: Tooltip exits, opacity 1 → 0 over 100ms, then removed from DOM
```

#### 9.4.2 Tooltip auto-dismiss

```
SCENARIO: Tooltip is visible but player doesn't interact

SETUP:
- Tooltip visible at t=0 for any element

STEPS:
1. No further interaction

EXPECTED:
- At t=5000ms: tooltip auto-dismisses with the same 100ms fade-out
```

#### 9.4.5 Mastery card play — modifier kind

```
SCENARIO: Player plays a T2 Mastery (modifier kind: +3 damage)

SETUP:
- Player on PLAN phase, 1 reroll used
- Hand contains T2-Mastery card targeting tier T2, kind: 'modifier', damageDelta: +3
- Current T2 ability: "Brutal Strike", damage 6, combo [⚔, ⚔, ⚔]
- heroSnapshot.masterySlots[2] = undefined

STEPS:
1. Player taps Mastery card in hand
2. ExpandedCardView opens with Mastery preview block

EXPECTED (ExpandedCardView):
- Standard card chrome at 200×280px
- Below effect prose: MasteryPreview sub-block with NOW (Brutal Strike, value 6) and AFTER (Brutal Strike, value 9, ✦ indicator)
- NO "different combo" warning note (combo unchanged for modifier kind)
- Play button enabled

3. Player taps Play

EXPECTED (CardPlayOverlay sequence, ~2400ms):
- Dawn-tinted backdrop fades in (300ms)
- Card scales to centre, holds 400ms
- Dawn-bright targeting beam grows from card to T2 row on ladder (400ms)
- T2 row pulses dawn-bright (200ms)
- Card dissolves; T2 row's value badge animates 6 → 9 with scaling-pulse; ✦ indicator fades in next to badge
- Card slides toward discard, overlay fades out
- After ~2400ms: ladder shows T2 Brutal Strike with value 9, ✦ pulsing, dawn-bright inner glow on badge

EXPECTED (engine state):
- heroSnapshot.masterySlots[2] = { cardId: ..., upgrade: { displayKind: 'modifier', ... } }
- Card removed from hand, added to discard
- Activity Log entry: "✦ Mastery applied to T2 — Brutal Strike: +3 damage"

ALSO:
- Combo strip on T2 row unchanged (modifier doesn't touch combo)
- If T2 was eligible before the mastery, still eligible after
- Subsequent T2 commit deals 9 damage (instead of 6) + any Empower stacks on top
```

#### 9.4.6 Mastery card play — transformation kind

```
SCENARIO: Player plays a T1 Mastery (transformation kind, replacement ability)

SETUP:
- Player on PLAN phase, 2 locked swords for the base T1 "Sun Strike" (combo [⚔, ⚔])
- Hand contains T1-Mastery card targeting tier T1, kind: 'transformation'
  - replacementAbility = "Solar Crash", combo [⚔, ⚔, ☼], damage 9, different effect
- heroSnapshot.masterySlots[1] = undefined

STEPS:
1. Player taps Mastery card in hand
2. ExpandedCardView opens with Mastery preview block

EXPECTED (ExpandedCardView):
- MasteryPreview shows NOW (Sun Strike, combo [⚔,⚔], value 4) and AFTER (Solar Crash, combo [⚔,⚔,☼], value 9, ✦, name in dawn-bright)
- "Different combo" warning note rendered in italic Cormorant — combo changes from [⚔,⚔] to [⚔,⚔,☼]
- Play button enabled

3. Player taps Play

EXPECTED (CardPlayOverlay sequence, ~2400ms):
- Same as 9.4.5 EXCEPT:
- During the 600ms morph: T1 row's NAME crossfades "Sun Strike" → "Solar Crash" (now in dawn-bright)
- Combo glyphs crossfade: [⚔ ⚔] → [⚔ ⚔ ☼] (3 pips instead of 2)
- Value badge crossfades 4 → 9
- Effect text crossfades to the new ability's prose
- ✦ indicator settles next to badge, pulsing

EXPECTED (post-cinematic ladder):
- T1 row now reads "Solar Crash" in dawn-bright, combo [⚔, ⚔, ☼], value 9, ✦ indicator
- comboState re-derives against new combo: 2 swords still locked (pulse pulse), but the ☼ is now required and the player has no ☼ locked → third pip is outlined
- Row eligibility class: ineligible (1 outlined pip means near-eligible per Part 3.4)
- Activity Log entry: "✦ Mastery transformed T1 — now: Solar Crash"

ALSO:
- The player's previously-eligible Sun Strike is no longer a valid commit; they cannot retroactively undo the transformation. They can play another T1-Mastery card to replace this one, or commit Solar Crash when they roll a sun face.
- DefensiveOverlay during opponent attacks would not affect this state (defenses are a separate tier slot).
```

#### 9.4.7 Mastery replacement — playing a second Mastery on same tier

```
SCENARIO: Player has a T2 Mastery active, plays a second T2 Mastery

SETUP:
- heroSnapshot.masterySlots[2] = { cardId: ..., upgrade: { displayKind: 'modifier', ... } } from earlier play
- T2 row currently reads "Brutal Strike" value 9 with ✦ indicator
- Hand contains a different T2-Mastery card with kind: 'transformation' → "Berserk Cleave"

STEPS:
1. Player taps the new T2 Mastery card → ExpandedCardView opens
2. NOW preview shows current upgraded state (Brutal Strike value 9 with ✦)
3. AFTER preview shows the transformation result (Berserk Cleave, new combo, ✦)
4. Player taps Play

EXPECTED:
- CardPlayOverlay Mastery cinematic plays as in 9.4.6 (transformation variant)
- Engine REPLACES heroSnapshot.masterySlots[2] (the previous modifier is overwritten, NOT stacked)
- T2 row morphs from "Brutal Strike (value 9, ✦)" → "Berserk Cleave (new value, ✦)"
- After settle: row reads new ability; the previous modifier's +3 is gone (replaced, not preserved)
- Activity Log entry: "✦ Mastery replaced T2 — was Brutal Strike +3, now: Berserk Cleave"
```

### 9.5 Recovery / edge case scenarios

#### 9.5.1 App backgrounds during resolution

```
SCENARIO: User puts the app in background mid-resolution

SETUP:
- Resolution is at phase 'holding' (mid-animation)

STEPS:
1. visibilitychange event fires with document.hidden=true

EXPECTED:
- All pending setTimeouts in the resolution timer are cleared
- uiStore.cancelResolution() is called
- resolutionPhase resets to 'idle', activeOverlay to 'none'
- When app foregrounds (visibilitychange with hidden=false):
  - UI re-renders from canonical engine state
  - If engine state shows resolution completed, post-resolution state is displayed
  - If engine state shows resolution mid-flight (rare, engine should auto-complete), force completion
- NO partial animation resumes — visual state matches engine state exactly
```

#### 9.5.2 Dice tray during opponent turn

```
SCENARIO: It's the opponent's turn; player's dice tray displays opponent's dice (read-only)

SETUP:
- gameState.currentPlayer = opponent
- Opponent has rolled and locked 2 dice; 3 still rolling on opponent's screen state
- viewerId = player

STEPS:
1. Player taps a die in the dice tray

EXPECTED:
- DiceTray renders the OPPONENT's dice (per Part 7.3.5.1 active-player display rule)
- Locked dice show lock affordance; unlocked dice tumble per their roll state
- Player's tap: no action dispatched, no visual feedback
- DiceTray.interactable === false (derived from gameState.currentPlayer !== viewerId)

ALSO:
- AbilityLadder renders the opponent's ladder with live combo states (rows light up as opponent locks)
- Action bar's right slot shows "Opponent · Rolling" indicator (Cinzel 11px, bone-dim, ember tint backdrop)
- Phase banner reads "Opponent · Roll · {N} of 3"
- Long-press on a ladder row opens ExpandedAbilityView in read-only mode (Activate button hidden)
```

#### 9.5.2a Engine-triggered Instant prompt — viewer plays Aegis of Dawn

```
SCENARIO: Engine surfaces an Instant prompt when opponent commits an ability matching the viewer's Instant trigger

SETUP:
- gameState.activePlayer = opponent
- Opponent is about to commit Pyro Lance (8 undefendable damage targeting viewer)
- Viewer's hand contains Aegis of Dawn (kind: 'instant', cost 4, oncePerMatch,
  trigger: { kind: 'opponent-fires-ability' }) and Cleave (kind: 'main-phase', cost 3)
- Viewer has 5 CP

STEPS:
1. Opponent dispatches select-offensive-ability action; engine begins resolving Pyro Lance

EXPECTED:
- Engine emits ability-triggered event with attacker=opponent, abilityName='Pyro Lance', tier=2
- Engine scans viewer's hand for Instants matching the event:
  - Aegis of Dawn's trigger.kind === 'opponent-fires-ability' → MATCHES
  - Cleave's kind === 'main-phase' → not Instant, skipped
- Engine writes gameState.pendingCounter = {
    triggerCard: null,         // not from a card play
    target: viewerId,
    candidateCounters: ['lightbearer/aegis-of-dawn']
  }
- UI's choreoStore.instantPrompt is set; <InstantPrompt> modal opens within 100ms
- Modal shows Aegis of Dawn with Play / Decline buttons
- Cleave in hand remains dimmed (wrong-timing — main-phase card during opponent turn)

2. Viewer taps Play on Aegis of Dawn

EXPECTED:
- UI dispatches respond-to-counter with cardId='lightbearer/aegis-of-dawn'
- Engine resolves Aegis effect inline:
  - Modifies the incoming damage from Pyro Lance (8 → 4, reduction applied)
  - Marks Aegis as consumedOncePerMatch on viewer's HeroSnapshot
  - Continues Pyro Lance resolution with reduced damage
- CardPlayOverlay plays Aegis cinematic (~1800ms) using dawn-tinted backdrop
- Per snapshot-and-interpolate (Part 7.4): UI snapshots viewer's HP before damage, then interpolates from prev HP to engine's already-applied new HP over the damage cinematic
- After cinematic settles: viewer HP reflects 4 damage taken, Aegis card moves to discard pile with "Used" state
- Activity log entry: "✦ Aegis of Dawn fired — Pyro Lance damage 8 → 4"

NEGATIVE — viewer declines:
- Instead of Play, viewer taps Decline
- UI dispatches respond-to-counter with cardId=null
- Engine clears pendingCounter and continues Pyro Lance with full 8 damage
- Aegis remains in hand (not consumed)

NEGATIVE — viewer attempts to tap Cleave during opponent turn:
- Cleave is dimmed (kind: 'main-phase' during opponent turn)
- Tap plays deny-shake animation (50ms × 2 cycles, ±2px translateX)
- Toast appears: "Cannot play during opponent's turn" (1500ms)
- No modal opens; pending Aegis prompt (if active) remains

NEGATIVE — viewer attempts to tap Aegis when no trigger is active:
- During an opponent's roll phase (before commit), no pendingCounter is set
- Tapping Aegis in hand shows toast: "Wait for the trigger to fire this card" (1500ms)
- No modal opens; Aegis remains in hand awaiting a matching trigger event
```

#### 9.5.2b Opponent commits ability — viewer sees resolution without modal flash

```
SCENARIO: AI commits an ability after completing dice planning; viewer watches the cinematic only

SETUP:
- gameState.currentPlayer = opponent (Berserker)
- Opponent has 3 swords + 1 frost + 1 ultimate locked
- Opponent's T4 Wolf's Howl is eligible (sigil combo satisfied)

STEPS:
1. AI controller dispatches select-offensive-ability on behalf of the opponent (no UI modal opens)
2. Engine flips phase to RESOLVE

EXPECTED:
- ExpandedAbilityView DOES NOT open (modals are viewer-only — AI commits go straight to RESOLVE)
- FieldOfPlay overlay begins fade-in within 100ms of the action
- Phase banner shows ability name "Wolf's Howl" (no "Opponent · " prefix during RESOLVE per 7.3.5.5)
- FOP plays the standard ultimate cinematic (~3500ms) — same treatment regardless of attacker
- Player strip flashes ember on damage taken (per OpponentStrip strip-flash spec, Part 2.2)
- After cinematic, engine emits TURN_END; phase banner crossfades to "Your Turn"
- Action bar's right slot transitions from "Opponent · Resolving" to "Roll · 3 of 3" (200ms crossfade)
```

#### 9.5.2c AI pacing — full opponent turn within target window

```
SCENARIO: Full opponent turn timing on baseline device — should fall within ~7–11s range

SETUP:
- Opponent (Pyromancer AI) has 1 ongoing Burn on self (will tick during upkeep)
- AI will roll, use 1 reroll, lock 4 dice, commit T2 Pyre Lance (no ultimate)

STEPS:
1. Start opponent turn (TURN_START)

EXPECTED (timestamps from t=0 at TURN_START):
- t=0:        TURN_START banner appears "Opponent's Turn"
- t=500ms:    UPKEEP phase begins; UpkeepFOP for Burn tick plays
- t=1300ms:   UpkeepFOP for +1 CP (income)
- t=2100ms:   UpkeepFOP for card Draw (income)
- t=2900ms:   ROLL phase begins; dice tumble 600ms
- t=3500ms:   Dice settle; AI begins locking
- t=3500ms:   First toggle-die-lock action (AI ~300ms cadence)
- t=3800ms:   Second toggle-die-lock
- t=4100ms:   AI emits roll-dice action (tumble 600ms)
- t=4700ms:   AI begins second lock cycle
- t=4700ms:   Lock #1, lock #2, lock #3, lock #4 (every ~300ms → ~5900ms)
- t=5900ms:   Final lock complete; ~400ms AI pre-commit hold
- t=6300ms:   AI emits select-offensive-ability for Pyre Lance
- t=6300ms:   RESOLVE phase; FieldOfPlay cinematic ~2000ms
- t=8300ms:   TURN_END; "Your Turn" banner
- TOTAL: ~8.3s — within the 7–11s target

ACCEPTANCE:
- Each beat lands within ±100ms of the table in Part 7.3.5.3
- No "thinking" pauses beyond the AI's documented ~300ms inter-lock / ~400ms pre-commit cadence (these are AI-controller pacing, not engine floors — Part 7.3.5.8)
- Frame rate during opponent's turn stays ≥55fps (same target as player turn)
```

#### 9.5.3 Touch target verification

```
SCENARIO: All interactive elements meet 44×44 minimum touch target

VERIFICATION CHECKLIST (manual or automated via DOM measurement):
- [ ] Die elements have a ≥44×44 tap zone (visible size 42×42 + padding)
- [ ] Ladder rows have ≥44px height (visible size variable + padding to reach minimum)
- [ ] Defensive rows have ≥44px height
- [ ] Hand cards have ≥76×112 tap zones (card size matches the visible thumbnail)
- [ ] Action bar buttons have ≥44px height
- [ ] Status chips have ≥44×44 tap zone (visible 24×24 + extended invisible padding)
- [ ] Portrait orbs have ≥44×44 tap zone (orb is 44 or 48 already; OK)
- [ ] Settings sliders have ≥44 thumb height
- [ ] Settings toggles have ≥44px tap zone
- [ ] Tooltip dismiss zone (anywhere outside) — N/A, full screen
```

### 9.6 Performance scenarios

#### 9.6.1 Resolution maintains 60fps

```
SCENARIO: Standard ability resolution on iPhone 12 / Pixel 6 baseline

SETUP:
- Run the app on a baseline device or throttled Chrome DevTools profile
- Trigger a standard resolution

EXPECTED:
- Frame rate during 0–2000ms resolution remains ≥55fps (allowing 5fps headroom)
- No layout shifts during animation (CLS = 0 for this period)
- Only transform and opacity animations (verified via DevTools paint flashing or "Layers" panel)
- Total JS execution per frame during resolution: <8ms (allowing 8ms for paint + composite)
```

#### 9.6.2 Particle field stays within budget

```
SCENARIO: Cinder detonation triggers density='burst' (16 particles)

SETUP:
- Trigger a Cinder detonation scene

EXPECTED:
- Maximum 16 particle DOM elements present simultaneously
- Each particle uses transform + opacity animation only
- No JS-driven per-frame updates (CSS keyframes only)
- Frame rate during detonation: ≥30fps on baseline device (lower threshold for burst moments is acceptable)
```

### 9.7 Accessibility scenarios

#### 9.7.1 Reduced motion respected

```
SCENARIO: Player has prefers-reduced-motion: reduce set in OS

SETUP:
- Set reduced motion via OS settings or Chrome DevTools

STEPS:
1. Trigger a standard ability resolution

EXPECTED:
- DamageNumber animation: no scale overshoot; opacity fade only
- ParticleField: returns null, no particles rendered
- @keyframes lethal-pulse, cinder-pulse, radiance-pulse, pip-dawn-pulse: all paused or replaced with held peak states
- Dice tumble: replaced with single instant rotation
- Strip damage flash: replaced with brief border-color change
- HP bar interpolation: STILL ANIMATES (carries information)
- Opacity fade-in/fade-out of overlays: STILL ANIMATES
- Total resolution duration: identical to non-reduced-motion case (2000ms)
```

#### 9.7.2 Screen reader announces state changes

```
SCENARIO: Player triggers an ability with screen reader active

SETUP:
- Enable VoiceOver (iOS) or TalkBack (Android)
- Run through a standard resolution

EXPECTED:
- Phase banner changes announce via aria-live='polite': "Resolving Sun Strike"
- Damage taken announces: "Opponent took 5 damage" (via the SelfStrip or OpponentStrip's recent-damage logic)
- Buff/status application announces: "Verdict applied to opponent, 1 stack"
- Action bar button changes announce: "Confirm button now active" → "Confirm Spend button" (when phase changes)
```


---

## Part 10 — Implementation Roadmap

This part is the **build sequence** for Claude Code (or any engineer) to follow. It orders the work so that each milestone produces something demoable, dependencies are respected, and risk is front-loaded.

The roadmap is organized into **six milestones**, each ending in a verifiable demo state. Each milestone has explicit acceptance criteria and a list of tickets. Tickets are sized so that one Claude Code session per ticket is reasonable.

### 10.1 Pre-flight checklist

Before writing any UI code, confirm:

- [ ] The existing game engine (`src/game/`) is on `main` and passing its own tests
- [ ] The Zustand `gameStore` is the canonical state source; no UI mutation of game state directly
- [ ] Vite + TypeScript + React 18 are installed and configured
- [ ] `pact-of-heroes-design.html` is available in the project (e.g., `docs/design.html`) for visual reference during implementation
- [ ] This bible (`pact-of-heroes-ui-bible.md`) is committed to the repo

### 10.2 Milestone 1: Foundations

**Goal:** Visual primitives and project scaffolding. No gameplay yet. End state: a static "match screen" mockup renders, but nothing is interactive.

**Effort estimate:** 4–6 sessions.

**Tickets:**

| # | Title | Bible reference | Acceptance |
|---|-------|-----------------|------------|
| 1.1 | Set up `ui/` directory structure | Part 0.2 | Folders match spec; index files in place |
| 1.2 | Implement design tokens in `theme/tokens.css` | Part 1.1 | All CSS variables defined; contrast verified |
| 1.3 | Set up typography (`theme/fonts.css`) and load webfonts | Part 1.2 | Cinzel, Cormorant, JetBrains Mono all load with `font-display: swap` |
| 1.4 | Implement `theme/animations.css` with shared keyframes | Part 1.5 | All `@keyframes` defined and importable |
| 1.5 | Implement `theme/reset.css` with minimal CSS reset | Part 0.2 | Body padding/margin zero, box-sizing border-box |
| 1.6 | Create `util/duration.ts` and `util/easing.ts` constants | Part 1.4 | All DURATION and EASING constants exported |
| 1.7 | Build `<Icon>` component with placeholder Unicode glyphs | Part 1.7 | All 13 icon names render at any size; SVG path replacements deferred |
| 1.8 | Build `<Button>` atom with all variants | Part 2.8 | default, primary, crimson, disabled variants all render |
| 1.9 | Build `<ProgressBar>` atom (used by HPTrack) | Part 2.5 | Renders with configurable max + value, smooth width transition |
| 1.10 | Build `<ScreenBands>` container | Part 2.1 | Renders 7 children in flex column; band heights match spec |
| 1.11 | Build static `<MatchScreen>` with all 7 bands rendering empty/placeholder content | Parts 2.1–2.10 | Visually matches design.html's idle screen layout |

**Demo state at end of Milestone 1:** A static match screen displays with the correct layout proportions. Nothing animates, nothing is interactive. Visually it's recognizable as the game but hollow.

### 10.3 Milestone 2: Match UI Components — Static

**Goal:** All match UI components render with realistic mock data. No real gameplay yet; the UI reads from hardcoded mock state. End state: a "frozen" match looks correct in any phase.

**Effort estimate:** 6–8 sessions.

**Tickets:**

| # | Title | Bible reference | Acceptance |
|---|-------|-----------------|------------|
| 2.1 | Build `<PortraitOrb>` with all hero variants | Part 2.4 | Frost/Ember/Dawn portraits render correctly; highlights work |
| 2.2 | Build `<HPTrack>` | Part 2.5 | Normal and lethal variants render; width prop drives fill |
| 2.3 | Build `<OpponentStrip>` | Part 2.2 | Full strip renders with portrait, HP, status track, etc. |
| 2.4 | Build `<SelfStrip>` | Part 2.3 | Same as opponent but with self differences (larger orb, frost tint) |
| 2.5 | Build `<PhaseBanner>` with all phase variants | Part 2.6 | All 10 phase kinds render with correct text and tone |
| 2.6 | Build `<Die>` atom | Part 2.7 | All 6 face glyphs render; locked state, tumble animation |
| 2.7 | Build `<DiceTray>` | Part 2.7 | 5 dice render in row; tumble staggered |
| 2.8 | Build `<ActionBar>` | Part 2.8 | All button variants render in correct configurations |
| 2.9 | Build `<Card>` and `<Hand>` | Part 2.9 | Hand renders cards in scroll container with snap points; ~4 cards visible at rest; focused card lifts on tap |
| 2.10 | Build `<MiddleBand>` container | Part 2.10 | Empty placeholder that hosts ladder + FOP later |
| 2.11 | Build `<TierBadge>` (HeroDetailScreen reference contexts ONLY — Part 3.3.1) | Part 3.3.1 | T1/T2/T3/T4/D1/D2 + lethal variant render; never used in the active ladder or defensive picker |
| 2.12 | Build `<ComboGlyphStrip>` and `<Pip>` extensions | Part 3.4 | 3 pip states (outlined, gold, pulse) + defensive variant render correctly; pip-pulse animates |
| 2.13 | Build `<AbilityValueBadge>` (damage / heal / utility variants) | Part 3.3 | All three value kinds render; eligibility/ultimate/lethal tinting; scaling-pulse on value change. (ScaleBadge is DEPRECATED — do not build; see Part 3.5) |
| 2.14 | Build `<AbilityRow>` with all states | Part 3.2 | Default, eligible, near-eligible, ultimate-eligible, lethal all visible |
| 2.15 | Build `<AbilityLadder>` | Part 3.1 | Renders 4 rows in tier-descending order; opacity prop works |

**Demo state at end of Milestone 2:** A "snapshot" of any match phase can be rendered from JSON mock data. Static, no animations beyond CSS hover/pulse states.

### 10.4 Milestone 3: Token & Status System

**Goal:** Full token rendering, including animations for entry, decrement, consume, expire. End state: All six token scenarios from the design doc render correctly as static frames; entry/exit animations work.

**Effort estimate:** 5–7 sessions.

**Tickets:**

| # | Title | Bible reference | Acceptance |
|---|-------|-----------------|------------|
| 3.1 | Build `<SignatureChip>` (frostbite/cinder/verdict) | Part 4.1 | All three kinds render; entrance/exit/consume animations work |
| 3.2 | Implement Cinder fuse-ring | Part 4.1 | Conic gradient progresses 0–100% based on count; threshold class triggers pulse |
| 3.3 | Build `<SignatureCounter>` (Frenzy + Radiance) | Part 4.2 | 0-count dimmed state, counter-gain animation, isCapped pulse; Radiance renders from count 2 at match start |
| 3.4 | Build `<StatusChip>` for the universal statuses (burn/stun/protect/shield/regen + Smouldering Stone) | Part 4.4 | All registered statuses render; Lucide icons + count badge correct |
| 3.5 | Build `<BuffChip>` with duration tags | Part 4.5 | Defensive/beneficial/signature variants + duration formats render |
| 3.6 | Build `<StatusTrack>` with overflow + valence grouping | Part 4.6 | Items render in correct order; positive/negative sub-groups split with divider; +N indicator when over cap |
| 3.7 | Wire status track to engine state in OpponentStrip/SelfStrip | Part 4.7 mapping table | Real engine status types render correct components |

**Demo state at end of Milestone 3:** Open a debug page that renders each of the six token scenarios. Each token type animates in/out correctly when toggled. Status tracks update reactively when mock state changes.

### 10.5 Milestone 4: Resolution Pipeline & FOP

**Goal:** The cinematic ability resolution works. This is the highest-risk milestone — get the animation choreography right.

**Effort estimate:** 6–8 sessions.

**Tickets:**

| # | Title | Bible reference | Acceptance |
|---|-------|-----------------|------------|
| 4.1 | Implement resolution state machine in `uiStore` | Parts 0.6, 7.4 | Phase transitions fire on correct timing; timers can be cancelled |
| 4.2 | Build `<FieldOfPlay>` container | Part 5.1 | Renders inside MiddleBand; tone variants apply; overlay fades correctly |
| 4.3 | Build `<AbilityNameDisplay>` | Part 5.2 | Renders ability name; phase-driven opacity transitions |
| 4.4 | Build `<DamageNumber>` with all variants | Part 5.3 | Damage/heal/resource/ultimate/crimson variants; overshoot scale-in works |
| 4.5 | Build `<EffectRows>` with stagger | Part 5.4 | Multi-effect rows render with 100ms stagger; markers pulse on entry |
| 4.6 | Build `<ParticleField>` with density levels | Part 5.5 | All four density levels work; particles use CSS animations only; reduced motion disables |
| 4.7 | Build `<ConsumeContent>` for token consumption | Part 5.6 | Both variants (damage-add, token-clear) render correctly |
| 4.8 | Build `<DetonationContent>` for Cinder | Part 5.7 | Detonation scene plays with burst particles |
| 4.9 | Build `<UpkeepFOP>` for status ticks, draws, CP gains | Part 5.3.5 | All event kinds (status-tick / draw / cp-gain / deck-shuffle) render with correct tone; beat is ~700ms |
| 4.9b | Build `<FloatingDamageNumber>` as fallback (limited use) | Part 5.9 | Component exists for niche future use; not the primary upkeep treatment |
| 4.10 | Build `<UltimateTakeover>` full-screen modal | Part 5.8 | Full timeline plays; bark line rotates; damage number is oversized |
| 4.11 | Integrate resolution choreography with engine events (snapshot-and-interpolate) | Part 7.4 | Engine event stream triggers the full UI pipeline; UI snapshots prev values and animates over already-applied state; no completion action dispatched back |

**Demo state at end of Milestone 4:** Trigger a mock RESOLVE event and the full ~2000ms cinematic plays. Different abilities produce correct scenes. The ultimate takeover works. Reduced motion disables the right animations.

### 10.6 Milestone 5: Interaction & Match Loop

**Goal:** Full playable match against an AI opponent. End state: a real match can be played from start to finish.

**Effort estimate:** 5–7 sessions.

**Tickets:**

| # | Title | Bible reference | Acceptance |
|---|-------|-----------------|------------|
| 5.1 | Wire dice tap to the toggle-die-lock action | Part 2.7 | Tapping a die during ROLL phase locks/unlocks correctly |
| 5.2 | Wire roll/reroll button to roll-dice with tumble animation | Part 2.8, 7.3 | Reroll plays 600ms tumble then settles to new dice; reroll count decrements |
| 5.3 | Wire ladder row tap → ExpandedAbilityView → select-offensive-ability | Part 3.2, 6.7, 7.3 | Modal opens for any row; Activate commits eligible abilities; ineligible rows are inspect-only |
| 5.4 | Wire hand card tap → ExpandedCardView → play-card | Part 2.9, 6.6, 7.3 | Modal opens; Play dispatches with targeting params where needed |
| 5.5 | Build `<DefensiveOverlay>` | Part 6.1 | Full picker renders; tap row sets selectedId; Confirm dispatches |
| 5.6 | Build `<SpendOverlay>` | Part 6.2 | Spend prompt renders with options; Confirm/Skip work |
| 5.7 | Wire upkeep phase to ticking statuses | Part 7.5 | Burn/Regen/etc. tick sequentially with floating numbers |
| 5.8 | Wire MATCH_END detection | Part 7.6 | When HP reaches 0, match ends; final cinematic plays |
| 5.9 | Build `<MatchSummaryScreen>` | Part 7.7 | Full summary renders with stats, bark, action buttons |
| 5.10 | Wire Rematch and Return Home navigation | Part 7.7 | Both buttons navigate correctly |

**Demo state at end of Milestone 5:** Player can complete an entire match against AI: pick hero → play through turns → see summary → rematch or return.

### 10.7 Milestone 6: Meta Surfaces & Polish

**Goal:** Round out the application with home, settings, hero book, onboarding. Add accessibility polish.

**Effort estimate:** 5–7 sessions.

**Tickets:**

| # | Title | Bible reference | Acceptance |
|---|-------|-----------------|------------|
| 6.1 | Build `<HomeScreen>` | Part 8.2 | All buttons functional; resume button only when applicable |
| 6.2 | Build `<HeroSelectScreen>` | Part 8.3 | Three hero cards; detail panel; begin match button |
| 6.3 | Build `<SettingsScreen>` with all controls | Part 8.4 | All preference controls work; persistence to localStorage |
| 6.4 | Build `<HeroBookScreen>` | Part 8.5 | List of heroes with thumbnails |
| 6.5 | Build `<HeroDetailScreen>` | Part 8.6 | Full hero info renders from content files |
| 6.6 | Build `<OnboardingFlow>` (6 steps incl. the optional Customize step) | Part 8.7 | Six steps, skip works, completion sets localStorage flag |
| 6.7 | Implement `<TooltipRenderer>` with long-press | Part 6.3 | All content kinds render; positioning logic works |
| 6.8 | Build `<ToastQueue>` for notifications | Part 6.5 | Toasts stack, auto-dismiss, tappable |
| 6.9 | Implement local persistence for in-progress match | Part 7.10 | Match state survives backgrounding; resume prompt on relaunch |
| 6.10 | Audit accessibility: touch targets, aria labels, screen reader testing | Part 0.9, 9.7 | All interactive elements pass WCAG 2.2 AA touch target rule |
| 6.11 | Audit performance: profile resolution pipeline, particle bursts | Part 0.8, 9.6 | 60fps baseline maintained; bundle size <200KB gzipped |
| 6.12 | Replace Unicode glyphs with SVG `<Icon>` paths | Part 1.7 | All 13 icons have inline SVG paths; no Unicode fallback in production |

**Demo state at end of Milestone 6:** Production-quality build. App can be installed/served and feels complete.

### 10.8 Risk areas

Where to expect difficulty:

**Resolution choreography (Milestone 4).** The 2000ms cinematic involves many moving pieces with precise timing. Get the state machine right *first* — a robust `uiStore.scheduleResolutionPhases` makes the rest of the milestone smooth. Bad pattern: scattered `setTimeout` calls in individual components. Good pattern: a single source of truth for phase, components react reactively.

**Defensive overlay positioning (Milestone 5).** The overlay must be a direct child of `<ScreenBands>` (not nested inside `<MiddleBand>`) so its `inset: 16.5% 0 30.5% 0` computes against the screen, not the band. The inset leaves the hand and action bar visible so the player can play Instant cards during defense or confirm without obscured cards. See `design.html#p3-defensive` for the fix.

**Reduced motion compliance (Milestone 6).** Easy to forget for new animations. Set up a `useReducedMotion()` hook early (Milestone 1) and use it consistently from the start.

**Font loading FOIT.** Cinzel and Cormorant are heavy webfonts. Use `font-display: swap` and accept that the first render shows fallback fonts. Don't try to gate render on font load — that breaks LCP.

**iOS Safari quirks.** `backdrop-filter` works but requires `-webkit-backdrop-filter` fallback. `font-variant-emoji: text` is not supported in older Safari; use the font-family fallback chain.

**Conflict between Framer Motion and CSS keyframes.** When a component uses both (e.g., a chip with Framer entry + CSS pulse), the CSS animation must use `animation-play-state` so it can be paused when Framer is animating other properties. Otherwise animations compound unpredictably.

### 10.9 What's explicitly out of scope for v1

To prevent scope creep:

- **No multiplayer.** Engine is multiplayer-ready (per migration plan in repo), but the UI ships single-player vs AI only.
- **No social features.** No friends, chat, profile sharing.
- **No monetization.** No store, no IAP, no cosmetics.
- **No telemetry/analytics.** Privacy-by-default. May add later with consent.
- **No localization beyond English.** French placeholder string keys exist but full translation is post-v1.
- **Deck building and hero customization are IN scope** via the HeroCustomizationScreen (see Part 8.6.1). Players pick T1-T4 abilities from their hero's catalog, pick 2 defenses from a larger pool, and build a 12-card deck from generic + hero-specific cards. Persisted per-hero in localStorage.
- **No achievements or progression.** Each match is self-contained.

Stub these in the codebase where they'd live, with `// TODO: v2` comments, so future additions are unsurprising.

### 10.10 Working with Claude Code on this bible

A few tips for engineering sessions:

**One ticket per session.** Each ticket above is sized for one Claude Code conversation. Don't bundle.

**Reference this bible by section number.** "Implement ticket 3.1 (Part 4.1)" gives Claude Code unambiguous context.

**Keep the design HTML open.** Many specs reference `design.html#section`. Engineers should be looking at the visual reference while implementing.

**Commit per ticket.** Each completed ticket should be a clean commit. Makes review and rollback simple.

**Test scenarios from Part 9 are the acceptance criteria.** When a milestone is "done," the relevant Part 9 scenarios should pass — manually or in automated tests.

**Diverge with permission.** If a spec in this bible feels wrong during implementation (a CSS value that doesn't quite work, a timing that feels off in practice), surface it. The bible is authoritative until experience shows otherwise; then it gets updated.

### 10.11 Definition of "v1 ship-ready"

The game is shippable when:

- [ ] All six milestones complete
- [ ] All Part 9 test scenarios pass (or have documented exceptions)
- [ ] Manual playthrough of all three heroes completes without UI errors
- [ ] Accessibility audit passes (WCAG 2.2 AA for touch targets and color contrast)
- [ ] Performance profile shows 60fps baseline on iPhone 12 / Pixel 6
- [ ] No console errors during a clean playthrough
- [ ] Bundle size <200KB gzipped JS, <50KB CSS
- [ ] Initial load time <2 seconds on 4G connection
- [ ] Local persistence works: backgrounding and resuming a match works correctly
- [ ] All three heroes have complete content (abilities, barks, descriptions) in the content files

---

## Closing notes

This bible is a living document. As implementation progresses, edges will be discovered: a CSS value that doesn't quite work on a specific browser, a timing that feels off in practice, a missing edge case. Update the bible when you find these — the goal is for the bible to remain the canonical reference, not be a frozen historical document.

The companion `pact-of-heroes-design.html` provides visual ground truth. When in doubt about appearance, look there. When in doubt about behavior, look here.

Three heroes, one pact. Build it well.

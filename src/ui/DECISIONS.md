# Bible-vs-engine reconciliation decisions

The UI bible (`pact-of-heroes-ui-bible.md`) was authored against an assumed
engine that differs from the real engine (`src/game/`). Where the two conflict,
the engine wins on data shapes and mechanics; the bible wins on visuals and
interaction patterns. This document records the specific reconciliations
adopted in this rebuild so an engineer coming to a component doesn't have to
re-derive them.

## Type shapes — engine wins

- **`PlayerId`** is `"p1" | "p2"` (literal union from engine), not an opaque string.
- **`Phase`** is the engine's `Phase` union: `"pre-match" | "upkeep" | "income" |
  "main-pre" | "offensive-roll" | "defensive-roll" | "main-post" | "discard" |
  "match-end"`. The bible's `PhaseEnum` (`roll | plan | resolve | ...`) is a UI
  *projection* computed by `selectors/phaseDisplay.ts` into a `PhaseDisplay`
  discriminated union for `<PhaseBanner>`.
- **`DieFace`** is the engine's object shape `{ faceValue, symbol, label }`,
  not the bible's string-literal union `'sword' | 'defense' | ...`. There are
  no shared symbols across heroes — each hero has 3–4 unique symbols. The
  bible's `HERO_DIE_COMPOSITION` map, `FACE_GLYPH` map, and `FACE_DISPLAY_NAME`
  flavor override are all discarded; the UI reads `face.label` directly.
- **`Die`** is the engine's `{ index, faces, current, locked }` with `current`
  being an index into `faces`. UI-only flags like `isRolling` (tumbling state)
  live on `uiStore`, not on the engine Die.
- **`Card`** uses the engine's shape (`kind`, `cardCategory`, `trigger`, `effect`,
  `text`, ...). There is no `isInstant` field — Instants are `kind === 'instant'`.
  There is no `category: 'attack'|'defense'|'buff'|'utility'` — the UI derives
  a display-only `visualStyle` from card content (see `selectors/cardVisual.ts`).
- **`Card.effect`** is the engine's `AbilityEffect` discriminated union (not
  a UI-render segment array). The bible's `EffectSegment[]` is a *render-time*
  UI shape parsed from `Card.text` by `util/parseEffect.ts`.
- **Actions** use engine kebab-case `kind` strings, not the bible's
  SCREAMING_SNAKE_CASE. No action envelope; no `RESOLUTION_COMPLETE`.
- **`GameState`** is the engine's shape. `currentPlayer` in bible = `activePlayer`
  in engine. Six separate `pending*` fields, not one union.

## Constants — engine wins

- `HAND_CAP = 6` (bible says 8; wrong)
- `STARTING_HP = 30`, `HP_CAP_BONUS = 10` (max HP = 40 via over-heals)
- `STARTING_CP = 2`, `CP_CAP = 15`
- `STARTING_HAND = 4`
- `ROLL_ATTEMPTS = 3` (1 initial + 2 rerolls; label "ROLL" before first, "REROLL · N"
  after where N = rollAttemptsRemaining)

## Mechanics — engine wins

- **Frenzy** is a 0–6 bankable counter gained from taking damage from the
  opponent's offensive ability (+1 per turn at start of next turn, capped +1/turn),
  each stack adds +1 damage. NOT a binary lit/dormant glyph triggered by locking
  swords. Renders as a counter chip in the SelfStrip status track — no
  `<SignatureGlyph>` component.
- **Radiance** is a passive counter in `signatureState.radiance`, not a status in
  `statuses[]`. Renders as a StatusChip-shaped element sourced from passive state,
  not from status state.
- **Cinder / Frostbite / Verdict** are hero-namespaced status IDs
  (`pyromancer:cinder`, `berserker:frostbite`, `lightbearer:verdict`), not bare
  strings. Bible's `SignatureChip kind='frostbite'` etc. maps through the namespace.
- **Signature mechanic display names**: user-facing name is the hero's
  `signatureMechanic.name` — Berserker "Frenzy", Pyromancer "Ashfall", Lightbearer
  "Radiance". Cinder / Frostbite / Verdict are token names, not mechanic names.
- **Lethal** has no engine concept. UI computes `willKill = previewDamage >= opponent.hp`
  at render time; if true on a T4 row, applies crimson pulse per bible. No
  `lethalCondition` field on abilities.
- **Critical** is the engine's real T4 concept (`criticalCondition` +
  `criticalEffect` + `criticalCinematic`) — a more-restrictive combo triggering
  an enhanced cinematic. `<UltimateTakeover>` reads `isCritical` from the
  `ability-triggered` event to pick the enhanced variant.
- **Undefendable damage** is the engine's damage type; the bible's "Unblockable"
  keyword is a display alias for the same concept. Card text keyword renders as
  "Unblockable" per bible copy; the type field on damage effects is `undefendable`.

## Status registry — engine wins

The bible's 10-entry `StatusEffect` union is trimmed to the engine reality:

- **Universal (engine-defined):** `burn`, `stun`, `protect`, `shield`, `regen`
- **Hero-namespaced signatures:** `berserker:frostbite`, `pyromancer:cinder`,
  `pyromancer:defense-handicap-1`, `lightbearer:verdict`, `bleeding`
- **Deleted (fabrications):** `poison`, `frozen`, `momentum`, `empower`
- **Re-homed:** `radiance` (renders like a status chip but sources from
  `signatureState.radiance`, not `statuses[]`)

## Card kind and category

- `kind`: `'main-phase' | 'roll-phase' | 'instant' | 'mastery'` — determines
  when the card can be played and how it's UI-visualized.
- `cardCategory`: `'generic' | 'dice-manip' | 'ladder-upgrade' | 'signature'`
  — deck-composition category; enforced 4/3/3/2 by the deck builder.
- `visualStyle` (UI-only, derived): coloring/glyph for the HandCard illustration slot.

## Skipped bible features

The following bible specs are deferred or dropped because they require engine
changes we're not making in v1:

- **Reactive pacing floors** (150ms inter-lock, 800ms pre-commit hold) — dropped.
  Instant cards fire only on their engine trigger events.
- **`RESOLUTION_COMPLETE` round-trip** — dropped. Engine applies state on action
  dispatch; UI snapshots pre-values at cinematic start and interpolates to
  already-applied values over the cinematic.
- **Action envelope with `version` field** — dropped for MVP.
- **`matchVersion` on GameState** — dropped for MVP.
- **`aiPersonality`** — dropped for MVP.
- **`atone-prompt` PendingAction kind** — dropped; Atone dispatches
  `{ kind: 'status-holder-action', status: 'lightbearer:verdict', actionIndex }`.

## Ability and card name replacements

Bible names that don't exist in engine content, replaced with real names:

| Bible name | Real engine name |
|---|---|
| Brutal Strike (Berserker T1) | Cleave |
| Frost Maul / Glacial Maul | Winter Storm / Avalanche |
| Howling Blitz (Berserker T3) | Blood Harvest / Frostfang |
| Ragnarok (Berserker T4) | Wolf's Howl |
| Searing Strike (Pyromancer) | Firestorm |
| Pyre Lance | Pyro Lance |
| Conflagration (Pyromancer T4) | God's Crater |
| Judgment (Lightbearer T4) | Judgment of the Sun |
| Sun's Blessing (card) | (does not exist) |
| Vow of Light (card) | (does not exist) |

Bible's v1 Instant registry (`Sanctuary | Faith | Steady | Sun's Blessing |
Vow of Light`) is entirely wrong. Real v1 Instants:

- **Counterstrike** (berserker) — trigger: `self-takes-damage`
- **Phoenix Veil** (pyromancer) — trigger: `self-attacked`, non-ultimate
- **Final Heat** (pyromancer)
- **Aegis of Dawn** (lightbearer) — trigger: `opponent-fires-ability`

## Engine features the bible doesn't cover (implemented anyway)

- **Mastery cards & upgrade slots** — `masterySlots` displayed on hero strip
- **Counter cards** — `pendingCounter` → `<CounterPrompt>` overlay
- **Status removal interception** — `pendingStatusRemoval` → `<InstantPrompt>`
- **Sell cards** — sell affordance in the ExpandedCardView
- **Offensive fallback** — defense fires when offense fizzles; renders in FOP
- **`pendingOffensiveChoice`** — picker overlay when multiple abilities match
- **Bonus dice / symbol bends / combo overrides / set-die-face** — all threaded
  through the resolution cinematic

## Choreographer integration

The existing `choreoStore` and `<Choreographer>` component in `src/components/`
handle event pumping (damage numbers, shake, hit-stop, banner, instant prompt).
This rebuild integrates with them rather than replacing them:

- New `MatchScreen` mounts `<Choreographer>` for event pumping
- New FOP components subscribe to `choreoStore` for cinematic state
- `selectors/fopScene.ts` translates the event-stream buffer into `FOPScene` for
  the new `<FieldOfPlay>` component
- After match-screen parity, decision to keep or absorb choreoStore is revisited

## Bible sections retained as-authored

Everything else. The bible's visual specifications, layout proportions, color
tokens, typography scale, animation timings, component structure, modal
inset math, valence grouping, tooltip system, activity log design, meta-screen
skeletons — all preserved verbatim. Only the data/mechanics/naming layer
reconciles to engine reality.

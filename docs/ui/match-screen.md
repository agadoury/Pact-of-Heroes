# UI: Match screen

How `MatchScreen.tsx` is composed after the **seven-band revamp** — the band
stack, every component inside it, and the overlays that render on top. The
authoritative behavioral spec for this surface is the UI bible
(`docs/pact-of-heroes-ui-bible.md`, Parts 2–7, revision 1.1); this page is
the code map.

For the choreographer, beat durations, state stores, and input gating see
[`choreography.md`](./choreography.md). For tokens + theming see
[`tokens-and-theming.md`](./tokens-and-theming.md).

---

## Layout — the seven bands

`src/components/screens/MatchScreen.tsx` stacks seven horizontal bands in a
single column (capped `max-w-2xl`, centered on desktop):

```
┌────────────────────────────────────────┐
│ 1 HeroStrip — opponent                 │  portrait orb · name · hand/deck
│                                        │  counts · HP bar · CP · status track
├────────────────────────────────────────┤
│ 2 PhaseBanner                          │  ◆ ROLL · 1 OF 3 ◆  (gold Cinzel)
├────────────────────────────────────────┤
│ 3 DiceTray                             │  ACTIVE player's dice (defender's
│                                        │  during a defensive flow)
├────────────────────────────────────────┤
│ 4 MiddleBand                           │  Ladder (T4→T1) ⇄ FieldOfPlay
│                                        │  resolution overlay (dims ladder)
├────────────────────────────────────────┤
│ 5 HeroStrip — self  (frost tint)       │
├────────────────────────────────────────┤
│ 6 HandBand                             │  80×116 cards, scroll-snap
├────────────────────────────────────────┤
│ 7 MatchActionBar (fixed bottom)        │  Skip Turn · Reroll · N · Confirm
└────────────────────────────────────────┘
```

The middle band shows the **active player's** ladder and dice (bible 7.3.5.1):
on the opponent's turn the viewer watches their dice lock and their rows light
up. During a defensive flow the tray re-points at the defender. The viewer's
strip is always frost-tinted and the non-viewer's ember-tinted — a self /
non-self encoding independent of hero element.

### Atmospheric background

`HeroBackground` renders a full-bleed atmospheric layer behind everything,
cross-fading when the active player changes. Unchanged from the pre-revamp
screen.

### Hot-seat curtain / Result screen

`HotSeatCurtain` and `ResultScreen` keep their pre-revamp contracts (see git
history); both mount from `MatchScreen` as before.

---

## Match components (`src/components/match/`)

| Component | File | Notes |
|---|---|---|
| `HeroStrip` | `HeroStrip.tsx` | Three-row strip per the bible: name + indicators / HP / CP + StatusTrack. `perspective="self" \| "opponent"` drives the tint. Damage/heal flash on hp change; HP bar has a wound-lag layer, shimmer, and a dawn over-heal segment; deck indicator pulses gold at ≤3 cards. |
| `PhaseBanner` | `PhaseBanner.tsx` | Diamond-bracketed Cinzel microcopy per phase/prompt, "Opponent · " prefix on their turn; live FOP scenes override the copy ("Resolving · Cleave"). |
| `Ladder` + `ExpandedAbilityView` | `LadderV2.tsx` | Rows T4→T1 over `activeOffense` resolved through `resolveAbilityFor`. The AbilityValueBadge shows *current achievable* value (scaling-damage counts settled matching dice; conditional 0-base heals fall back to a utility glyph). UI lethal kill-preview (`value ≥ opponent.hp` on a committable row) drives the crimson `animate-lethal-pulse` treatment and the modal's "LETHAL STRIKE" commit. Tap any row → inspection modal with per-pip combo readiness; Activate only for firing/triggered rows on the viewer's turn. |
| `ComboPipStrip` | `ComboPips.tsx` | pulse / gold / outlined pip derivation for all combo kinds (symbol-count, n-of-a-kind, straight, compound + legacy). Tumbling dice contribute nothing — locked dice keep pulse pips through a reroll, unlocked gold pips revert to outlined. |
| `StatusTrack` + chips | `chips.tsx` | Valence-grouped (positive left / negative right, thin gold divider, faint green/red group tints). `SignatureChip`: Frost-bite, Cinder (conic fuse ring at stacks/5, warn-pulse at 4), Verdict. `SignatureCounter`: Frenzy/Radiance from `signatureState`, rectangular, visible even at 0 (dimmed). `StatusChip`: universal statuses colored via the engine's `visualTreatment` registry. |
| `FieldOfPlay` | `FieldOfPlay.tsx` | Middle-band resolution cinematic driven by `choreoStore.fop`: ability name (tone-tinted radial backdrop + capped CSS particles), damage number (Cinzel overshoot pop, type-colored: pure violet / undefendable white / crimson on kill), heal, upkeep beats (status ticks, +N CP, Draw + card name), Cinder detonation (bursting chips + equation caption). Reduced-motion: no particles, fades only. |
| `HandBand` + `HandCard` + `ExpandedCardView` | `HandBand.tsx` | Bible card anatomy at 80×116: overhanging cost pip (gold = affordable, ember-ringed = not), `cardCategory`-tinted illustration glyph (generic ◆ / dice-manip ⚄ / ladder-upgrade ▲ / signature ✦), name strip, compact effect text, kind tag. Scroll-snap row; tap → expanded view with Play / Sell · +1 CP / Cancel. |
| `MatchActionBar` | `MatchActionBar.tsx` | Skip Turn always present leftmost (muted variant, confirmation sheet per the bible); contextual primary right: Roll / Reroll · N + Confirm / End Turn; non-interactive ember "Opponent · {phase}" indicator on their turn. |

## Legacy components

`HeroPanel`, `AbilityLadder` (v1), `Hand`, `CardView`, `ActionBar`,
`PhaseIndicator`, `HealthBar`, and `CPMeter` under `src/components/game/` +
`src/components/ui/` are retained for the dev benches (`/dev/components`) and
other screens, but the match screen no longer mounts them. New match-surface
work should target `src/components/match/`. `Die`, `DiceTray`,
`dieFaces.tsx`, `HeroPortrait`, and `HotSeatCurtain` remain first-class and
are shared by the revamped screen.

---

## Overlays

Rendered by `Choreographer` at app root; gated on the choreographer being
idle. Z-order follows bible Part 6.4.

| Overlay | Trigger | Behaviour |
|---|---|---|
| `ResultScreen` | `state.winner != null` | Match summary + rematch / menu CTAs. |
| `HotSeatCurtain` | active player flips in hot-seat | Full-screen hand-off. |
| `ExpandedCardView` (in `HandBand.tsx`) | card tapped | Enlarged card + Play / Sell / Cancel. |
| `ExpandedAbilityView` (in `LadderV2.tsx`) | ladder row tapped | Combo readiness + Activate / Lethal Strike. |
| `AttackSelectLayer` | `pendingOffensiveChoice` + input unlocked | Pick which matched ability fires; Pass at bottom. |
| `DefenseSelectLayer` | `pendingAttack` + input unlocked | **The DefensiveOverlay (bible 6.1):** centered ember "— Incoming —" block (amount, ability, damage type), two equal-weight frost defense rows (name, effect, frost combo pips, `ND` dice badge — no engine recommendation by design), then "Take It". |
| `DefenseStatusPanel` | defense in flight | Persistent context pinned top-center through the defender's roll. |
| `InstantPromptLayer` | playable Instant after a qualifying event | TTL countdown + card buttons + Skip. |
| `AbilityCinematicLayer` | `ultimate-fired` | T4 full-screen takeover. |
| `Banner` | `bannerText` set | Gold Cinzel announcer with diamond brackets (match/turn/attack events). |
| `ActionLog` | always | Corner feed of recent events. |
| `DamageNumberLayer` | CP floaters (card sells) | Damage itself now renders in the FieldOfPlay, not as floaters. |

### Why "input unlocked" gating

`AttackSelectLayer` and `DefenseSelectLayer` only render when
`useInputUnlocked()` is true (queue empty + nothing playing + no cinematic) so
the lead-up choreography lands before a picker takes the floor. Gating happens
in the layer, not the pump.

---

## See also

- [`choreography.md`](./choreography.md) — choreographer pump, beat durations, the `fop` scene slice, input gating
- [`tokens-and-theming.md`](./tokens-and-theming.md) — design tokens (night/gold palette), hero theming pipeline
- [`README.md`](./README.md) — UI overview, routes, accessibility, audio, PWA
- [`../pact-of-heroes-ui-bible.md`](../pact-of-heroes-ui-bible.md) — the authoritative UI spec (revision 1.1)
- [`../engine/runtime.md`](../engine/runtime.md) — events + choreographer behaviour from the engine side

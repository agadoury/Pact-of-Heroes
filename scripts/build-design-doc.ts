/**
 * Pact of Heroes — design-bible generator.
 *
 * Emits `docs/design-bible.html`: ONE document covering the entire game as
 * it plays today — rules, systems, heroes, abilities, cards, tokens, balance
 * state, and the visual/UX language.
 *
 * All hero / ability / card / status data is pulled from the LIVE content
 * registry (`src/content`) and engine constants, so the document cannot
 * drift from the shipped game. Regenerate after any content change:
 *
 *   npx tsx scripts/build-design-doc.ts
 */

import { writeFileSync } from "node:fs";
import { HEROES, GENERIC_CARDS } from "../src/content";
import { HERO_CARDS } from "../src/content/cards";
import { listRegisteredStatuses } from "../src/game/status";
import {
  STARTING_HP, STARTING_CP, STARTING_HAND, ROLL_ATTEMPTS, HP_CAP_BONUS, CP_CAP, HAND_CAP,
} from "../src/game/types";
import type { AbilityDef, Card, DiceCombo, HeroDefinition, HeroId } from "../src/game/types";

const HERO_ORDER: HeroId[] = ["berserker", "pyromancer", "lightbearer"];

// ── helpers ──────────────────────────────────────────────────────────────────

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function symbolWord(symbol: string): string {
  const bare = symbol.includes(":") ? symbol.split(":").pop()! : symbol;
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}

function comboText(combo: DiceCombo): string {
  switch (combo.kind) {
    case "symbol-count": return `${combo.count}+ ${symbolWord(combo.symbol)}`;
    case "n-of-a-kind":  return `${combo.count} of a kind`;
    case "straight":     return `Straight of ${combo.length}`;
    case "compound":
      return combo.clauses.map(comboText).join(combo.op === "and" ? " + " : " or ");
    default:             return combo.kind;
  }
}

function landingBand(a: AbilityDef): string {
  const [lo, hi] = a.targetLandingRate;
  return `${Math.round(lo * 100)}–${Math.round(hi * 100)}%`;
}

function abilityRows(list: readonly AbilityDef[], defensive = false): string {
  return list.map(a => `
    <tr>
      <td class="tier t${a.tier}">T${a.tier}</td>
      <td class="name">${esc(a.name)}</td>
      <td class="combo">${esc(comboText(a.combo))}${defensive && a.defenseDiceCount ? ` <span class="dim">on ${a.defenseDiceCount} dice</span>` : ""}</td>
      <td>${esc(a.longText || a.shortText)}</td>
      <td class="dtype ${a.damageType}">${esc(a.damageType)}</td>
      <td class="dim">${landingBand(a)}</td>
    </tr>`).join("");
}

function cardRows(cards: readonly Card[]): string {
  return cards.map(c => `
    <tr>
      <td class="name">${esc(c.name)}</td>
      <td class="cost">${c.cost}</td>
      <td class="dim">${esc(c.kind)}</td>
      <td class="dim">${esc(c.cardCategory)}</td>
      <td>${esc(c.text)}${c.oncePerMatch ? ' <span class="pill">once/match</span>' : ""}${c.oncePerTurn ? ' <span class="pill">once/turn</span>' : ""}</td>
    </tr>`).join("");
}

function diceRows(hero: HeroDefinition): string {
  return hero.diceIdentity.faces.map(f => `
    <tr><td class="cost">${f.faceValue}</td><td class="name">${esc(f.label)}</td><td class="dim">${esc(f.symbol)}</td></tr>`).join("");
}

// Player-facing token descriptions (kept in sync with src/ui/types/statusInfo.ts).
const TOKEN_NOTES: Record<string, string> = {
  "burn": "At the holder's upkeep: take damage equal to current stacks, then 1 stack fades.",
  "stun": "The holder's next roll phase is skipped entirely — no dice, no attack. Resolve (1 CP) removes it.",
  "protect": "Warding tokens. Incoming hits consume them — each token spent prevents 2 damage.",
  "shield": "Steady barrier: every incoming hit is reduced by 1 per stack. Never consumed.",
  "regen": "At the holder's upkeep: heal HP equal to current stacks, then 1 stack fades.",
  "berserker:frostbite": "At the holder's upkeep: take 1 damage, then 1 stack thaws. Holder's offensive abilities deal −1 damage per stack.",
  "pyromancer:cinder": "At 5 stacks it detonates: 11 undefendable damage (15 under Crater Wind), then resets to 0. Removing stacks pays the Pyromancer 1 CP each; detonation pays her 2 CP.",
  "pyromancer:defense-handicap-1": "The holder's next defensive roll uses 1 fewer die, then the stone crumbles.",
  "lightbearer:verdict": "Holder's offensive abilities deal −2 damage per stack (capped at −3 total) and the Lightbearer gains 1 CP whenever the holder attacks. At 3+ stacks the holder's main-phase and instant cards are blocked for a turn. Atone (2 CP, Main Phase) removes all stacks.",
};

function tokenRows(): string {
  return listRegisteredStatuses().map(def => `
    <tr>
      <td class="name">${esc(def.name)}</td>
      <td class="dim">${esc(def.type)}</td>
      <td class="cost">${def.stackLimit}</td>
      <td class="dim">${esc(def.tickPhase)}</td>
      <td>${esc(TOKEN_NOTES[def.id] ?? "—")}</td>
    </tr>`).join("");
}

function heroSection(id: HeroId): string {
  const hero = HEROES[id]!;
  const cards = HERO_CARDS[id] ?? [];
  const sig = hero.signatureMechanic;
  const res = hero.resourceIdentity;
  return `
  <section id="hero-${id}" class="hero" style="--accent:${hero.accentColor}">
    <h2>${esc(hero.name)}</h2>
    <p class="quote">“${esc(hero.signatureQuote)}”</p>
    <div class="meta">
      <span class="pill">archetype: ${esc(hero.archetype)}</span>
      <span class="pill">complexity: ${hero.complexity}/3</span>
      <span class="pill">accent: ${hero.accentColor}</span>
    </div>

    <h3>Dice identity</h3>
    <p>${esc(hero.diceIdentity.fluffDescription)}</p>
    <table class="mini"><thead><tr><th>Face</th><th>Label</th><th>Symbol</th></tr></thead>
    <tbody>${diceRows(hero)}</tbody></table>

    <h3>Signature mechanic — ${esc(sig.name)}</h3>
    <p>${esc(sig.description)}</p>

    <h3>Resource identity</h3>
    <p>${esc(res.fluffDescription)}</p>

    <h3>Offensive catalog <span class="dim">(loadout drafts 1 per tier; ★ = recommended loadout)</span></h3>
    <table><thead><tr><th>Tier</th><th>Ability</th><th>Combo</th><th>Effect</th><th>Type</th><th>Land&nbsp;rate</th></tr></thead>
    <tbody>${abilityRows(markRecommended(hero.abilityCatalog, hero.recommendedLoadout.offense))}</tbody></table>

    <h3>Defensive catalog <span class="dim">(loadout drafts 2; ★ = recommended)</span></h3>
    <table><thead><tr><th>Tier</th><th>Defense</th><th>Combo</th><th>Effect</th><th>Type</th><th>Land&nbsp;rate</th></tr></thead>
    <tbody>${abilityRows(markRecommended(hero.defensiveCatalog ?? [], hero.recommendedLoadout.defense), true)}</tbody></table>

    <h3>Card pool <span class="dim">(${cards.length} cards; recommended deck = 4 generic / 3 dice-manip / 3 mastery / 2 signature)</span></h3>
    <table><thead><tr><th>Card</th><th>CP</th><th>Kind</th><th>Category</th><th>Text</th></tr></thead>
    <tbody>${cardRows(markRecommendedCards(cards, hero.recommendedDeck))}</tbody></table>
  </section>`;
}

function markRecommended(list: readonly AbilityDef[], recommended: readonly string[]): AbilityDef[] {
  return list.map(a => recommended.includes(a.name) ? { ...a, name: `★ ${a.name}` } : a);
}
function markRecommendedCards(list: readonly Card[], deck: readonly string[]): Card[] {
  return list.map(c => deck.includes(c.id) ? { ...c, name: `★ ${c.name}` } : c);
}

// ── document ─────────────────────────────────────────────────────────────────

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pact of Heroes — Design Bible</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Cormorant+Garamond:ital@0;1&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root {
    --night: #0a0a14; --panel: #131320; --panel-2: #1a1a2c;
    --gold: #d4a548; --gold-bright: #f0c668;
    --bone: #d8d4c0; --bone-dim: #88826c;
    --frost: #6cb0e8; --ember: #f06848; --dawn: #fbbf24; --green: #34d399;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--night); color: var(--bone);
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px; line-height: 1.55;
  }
  main { max-width: 980px; margin: 0 auto; padding: 24px 20px 120px; }
  h1, h2, h3 { font-family: Cinzel, Georgia, serif; letter-spacing: 0.06em; }
  h1 { color: var(--gold-bright); font-size: 34px; text-align: center; margin: 30px 0 4px; }
  .subtitle { text-align: center; color: var(--bone-dim); font-style: italic; margin: 0 0 8px; }
  .stamp { text-align: center; color: var(--bone-dim); font-family: 'JetBrains Mono', monospace; font-size: 11px; }
  h2 { color: var(--gold); font-size: 22px; margin: 44px 0 10px; border-bottom: 1px solid rgba(212,165,72,.35); padding-bottom: 6px; }
  h3 { color: var(--bone); font-size: 16px; margin: 24px 0 6px; }
  p { margin: 8px 0; }
  code, .mono { font-family: 'JetBrains Mono', monospace; font-size: .8em; color: var(--frost); }
  table { width: 100%; border-collapse: collapse; margin: 10px 0 18px; font-size: 14.5px; font-family: Inter, system-ui, sans-serif; }
  table.mini { max-width: 420px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: var(--bone-dim); padding: 6px 10px; border-bottom: 1px solid rgba(255,255,255,.15); }
  td { padding: 7px 10px; border-bottom: 1px solid rgba(255,255,255,.06); vertical-align: top; }
  tr:nth-child(even) td { background: rgba(255,255,255,.02); }
  td.name { color: var(--gold-bright); font-weight: 600; white-space: nowrap; }
  td.cost { color: var(--dawn); font-weight: 700; text-align: center; }
  td.combo { color: var(--frost); white-space: nowrap; }
  td.tier { font-weight: 800; text-align: center; }
  td.t1 { color: var(--green); } td.t2 { color: var(--frost); } td.t3 { color: var(--dawn); } td.t4 { color: var(--ember); }
  td.dtype.normal { color: var(--bone-dim); } td.dtype.undefendable { color: var(--ember); }
  td.dtype.ultimate { color: var(--gold-bright); } td.dtype.pure { color: var(--frost); }
  .dim { color: var(--bone-dim); font-weight: 400; font-size: .92em; }
  .pill { display: inline-block; border: 1px solid rgba(212,165,72,.5); border-radius: 999px; padding: 1px 10px; font-size: 11px; font-family: 'JetBrains Mono', monospace; color: var(--gold); margin-right: 6px; }
  .hero { border-left: 3px solid var(--accent, var(--gold)); padding-left: 18px; margin-top: 40px; }
  .hero h2 { color: var(--accent, var(--gold)); border-bottom-color: color-mix(in srgb, var(--accent) 40%, transparent); }
  .quote { font-style: italic; color: var(--bone-dim); margin-top: -4px; }
  .callout { background: var(--panel); border: 1px solid rgba(212,165,72,.3); border-radius: 8px; padding: 12px 16px; margin: 14px 0; }
  .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px 26px; }
  nav.toc { background: var(--panel); border-radius: 8px; padding: 14px 18px; margin: 22px 0; font-family: Inter, system-ui, sans-serif; font-size: 14px; }
  nav.toc a { color: var(--frost); text-decoration: none; }
  nav.toc a:hover { text-decoration: underline; }
  nav.toc li { margin: 3px 0; }
  .swatch { display:inline-block; width: 11px; height: 11px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; border: 1px solid rgba(255,255,255,.25); }
  @media print { body { background: #fff; color: #222; } }
</style>
</head>
<body>
<main>

<h1>PACT OF HEROES</h1>
<p class="subtitle">The Complete Design Bible — rules, systems, heroes, cards, and craft</p>
<p class="stamp">Generated from the live game content on ${new Date().toISOString().slice(0, 10)} · regenerate with <code>npx tsx scripts/build-design-doc.ts</code></p>

<nav class="toc"><ol>
  <li><a href="#vision">Vision &amp; design pillars</a></li>
  <li><a href="#loop">The match loop</a></li>
  <li><a href="#dice">Dice &amp; the combo grammar</a></li>
  <li><a href="#ladder">The ability ladder</a></li>
  <li><a href="#defense">Defense &amp; the damage pipeline</a></li>
  <li><a href="#tokens">Status tokens</a></li>
  <li><a href="#cards">The card system</a></li>
  <li><a href="#economy">Economy &amp; tempo</a></li>
  <li><a href="#hero-berserker">The Berserker</a> · <a href="#hero-pyromancer">The Pyromancer</a> · <a href="#hero-lightbearer">The Lightbearer</a></li>
  <li><a href="#generic">Generic card pool</a></li>
  <li><a href="#balance">Balance state &amp; methodology</a></li>
  <li><a href="#visual">Visual &amp; UX language</a></li>
</ol></nav>

<h2 id="vision">1 · Vision &amp; design pillars</h2>
<p><strong>Pact of Heroes</strong> is a mobile-first 1v1 dice-and-card duel: Yahtzee-style
press-your-luck rolling, hero abilities that fire off dice combos, and a small
deck of cards that bends the odds. Matches run 6–12 turns in five to eight minutes.</p>
<div class="callout"><div class="grid2">
<p><strong>Every roll is a decision.</strong> Three roll attempts with per-die locking
turn each turn into a push-your-luck puzzle aimed at the ability ladder.</p>
<p><strong>Heroes are identities, not stat lines.</strong> Each hero has its own die,
its own signature token economy, its own resource engine, and a card pool that
bends its dice — not generic +1s.</p>
<p><strong>The opponent always matters.</strong> Defense is a live pick, incoming
attacks open instant windows, and signature tokens make the <em>opponent's</em>
choices (defuse or race the detonation, atone or attack judged) part of your engine.</p>
<p><strong>Readable drama.</strong> Every beat — tumbling dice, labeled effect
pills, cascading landings, content-aware cinematic pacing — is choreographed so a
first-time player can narrate what just happened.</p>
</div></div>
<p><strong>Architecture pillars:</strong> the rules engine is pure TypeScript (no DOM) —
every mutation flows through <code>applyAction(state, action)</code> and emits a typed
event log the UI replays; heroes are pure data modules (adding a hero touches no
engine code); the same evaluators back the player's UI and the AI so both always
agree about what a roll can do.</p>

<h2 id="loop">2 · The match loop</h2>
<p>Win by reducing the opponent to 0 HP. Heroes start at <strong>${STARTING_HP} HP</strong>
(healable to ${STARTING_HP + HP_CAP_BONUS}), <strong>${STARTING_CP} CP</strong>, and
<strong>${STARTING_HAND} cards</strong>. A coin flip picks the first player; the player going
<em>second</em> starts with <strong>+1 CP and +1 card</strong>, and the first player skips their
first Income — both compensate the first-strike tempo (sim-measured at 55–62% before compensation, ~50–55% after).</p>
<table><thead><tr><th>Phase</th><th>What happens</th><th>Input</th></tr></thead><tbody>
<tr><td class="name">Upkeep</td><td>Status ticks (Burn/Frost-bite damage, Regen heals), signature passives bank (Frenzy).</td><td class="dim">auto</td></tr>
<tr><td class="name">Income</td><td>Draw 1 card, gain 1 CP (cap ${CP_CAP}).</td><td class="dim">auto</td></tr>
<tr><td class="name">Main (pre-roll)</td><td>Play main-phase cards, sell cards (+1 CP), Atone, or roll.</td><td>tap ROLL</td></tr>
<tr><td class="name">Offensive roll</td><td>Up to ${ROLL_ATTEMPTS} roll attempts, locking dice between attempts; roll-phase cards can set faces, reroll, or bend symbols. When the roll ends, every matched ability is offered and the player <strong>picks one</strong> to fire (or passes).</td><td>lock · reroll · pick</td></tr>
<tr><td class="name">Defender's pause</td><td>For defendable damage the defender picks one defense from their drafted pair (or takes the hit); its dice roll once — no rerolls. Instant cards from both players can fire in this window.</td><td>defender picks</td></tr>
<tr><td class="name">Main (post-roll)</td><td>Play cards, sell, then end turn.</td><td>tap END TURN</td></tr>
<tr><td class="name">Discard</td><td>Hand clamps to ${HAND_CAP} (overflow auto-sells at +1 CP each); turn passes.</td><td class="dim">auto</td></tr>
</tbody></table>

<h2 id="dice">3 · Dice &amp; the combo grammar</h2>
<p>Each hero rolls <strong>five copies of its own six-faced die</strong>. Faces carry a
<em>symbol</em> (hero-scoped, e.g. three of the Berserker's faces are Axe) and a
<em>face value</em> 1–6. Abilities declare a <strong>combo</strong> over the five results:</p>
<table><thead><tr><th>Combo kind</th><th>Matches when…</th></tr></thead><tbody>
<tr><td class="combo">symbol-count</td><td>N or more dice show the symbol (e.g. “3+ Axe”). The bread-and-butter shape.</td></tr>
<tr><td class="combo">n-of-a-kind</td><td>N dice share the same face value — symbol-agnostic.</td></tr>
<tr><td class="combo">straight</td><td>N consecutive face values are present (4 = small, 5 = large).</td></tr>
<tr><td class="combo">compound and / or</td><td>Multiple clauses combine (e.g. “2 Axe + 2 Howl”).</td></tr>
</tbody></table>
<p>Cards can <em>bend</em> this algebra: set a die to a chosen face, reroll subsets,
or make one symbol count as another for a turn (Pelt of the Wolf, Resolve). The
engine evaluates combos on the <em>effective</em> faces, and the ladder UI judges
with the same function, so a bend visibly lights up rows.</p>

<h2 id="ladder">4 · The ability ladder</h2>
<p>Each hero authors a catalog of offensive abilities (several per tier) and
defenses. Pre-match, the player drafts a <strong>4-ability offensive loadout</strong>
(one per tier) and <strong>2 defenses</strong>. In match, the ladder shows all four
rows live: <em>firing</em> (will fire now), <em>triggered</em> (matched but outranked),
<em>reachable</em> (with % odds from remaining rerolls), or <em>out of reach</em>.</p>
<ul>
<li><strong>Tiers:</strong> T1 lands most turns (75–95%), T2 ~half (45–70%), T3 is a
payoff (20–45%), T4 is the career-moment ultimate (~1–2%, all five dice on the
ultimate face) — Stun + massive damage + signature crescendo.</li>
<li><strong>Criticals:</strong> exceeding a combo grants a minor crit (+1 damage);
abilities with a declared critical condition (e.g. more axes than required)
escalate to a major crit (×1.5) with an upgraded cinematic.</li>
<li><strong>Masteries upgrade the ladder in place:</strong> permanent card upgrades
are baked into the resolved ability — the row shows a gold ★ and its value badge,
previews, the AI, and fire-time resolution all read the same upgraded numbers.</li>
</ul>

<h2 id="defense">5 · Defense &amp; the damage pipeline</h2>
<table><thead><tr><th>Damage type</th><th>Defense roll?</th><th>Shield/Protect?</th><th>Used by</th></tr></thead><tbody>
<tr><td class="dtype normal">normal</td><td>yes</td><td>yes</td><td>most attacks</td></tr>
<tr><td class="dtype undefendable">undefendable</td><td>no</td><td>yes</td><td>T2/T3 spikes, Cinder detonation</td></tr>
<tr><td class="dtype ultimate">ultimate</td><td>yes*</td><td>yes</td><td>T4 only — *Aegis of Dawn can halve it</td></tr>
<tr><td class="dtype pure">pure</td><td>no</td><td>no</td><td>Final Heat, self-costs</td></tr>
</tbody></table>
<p>Order of operations on a hit: defense reduction (if defendable + landed) →
instant-window injections (negates, halving) → Shield (−1/stack, persistent) →
Protect (each token consumed prevents 2) → HP. Damage floors at 0 — a fully
blocked hit reads <strong>BLOCKED</strong> on screen. Every attack, defendable or not,
pauses for the defender so instants (Phoenix Veil, Aegis of Dawn, Counterstrike)
can respond.</p>

<h2 id="tokens">6 · Status tokens</h2>
<p>All tokens are tappable in game — the chip explains itself. Buffs sit left of
the track, debuffs right; signature tokens get bespoke chips (Cinder shows a
detonation fuse ring).</p>
<table><thead><tr><th>Token</th><th>Valence</th><th>Max</th><th>Ticks</th><th>Mechanics</th></tr></thead>
<tbody>${tokenRows()}</tbody></table>

<h2 id="cards">7 · The card system</h2>
<p>Decks are exactly <strong>12 cards: 4 generic / 3 dice-manipulation / 3 masteries / 2 signatures</strong>
(one mastery per ladder slot — T1, T2, T3, or defensive; T4 has no mastery by design).
Any card can be <strong>sold for +1 CP</strong> instead of played. Hand cap ${HAND_CAP}.</p>
<table><thead><tr><th>Kind</th><th>When it plays</th><th>Examples</th></tr></thead><tbody>
<tr><td class="name">main-phase / main-action</td><td>Either main window</td><td>Hunter's Mark, Sanctuary, Char</td></tr>
<tr><td class="name">roll-phase</td><td>During your roll</td><td>Iron Focus (set a face), Forge, Faith (reroll)</td></tr>
<tr><td class="name">mastery</td><td>Main phase; permanent, fills its ladder slot</td><td>Cleave Mastery, Volcanic Awakening, Cathedral Light</td></tr>
<tr><td class="name">instant</td><td>Reactive window on a qualifying event (brief countdown)</td><td>Counterstrike, Phoenix Veil, Aegis of Dawn</td></tr>
</tbody></table>
<p><strong>Collection &amp; Renown:</strong> the recommended loadout and deck are
owned from the start; every alternate ability and card is collectible. Playing
matches earns per-hero <em>Renown</em> (+3 win / +1 loss, awarded on the match
summary — plus performance bonuses: Critical Victory +3; Flawless, Clutch, or
Comeback finishes +2; Surgeon/Stomp/Grinder +1; and +1 for firing your ultimate,
win or lose), spent in the Collection hub (hero → Customize) to unlock alternates —
abilities price at 4/6/8/12 by tier, cards at 3–8 by category. The hub is a
slot-based builder: tap any ladder or deck slot to open its option tray, equip
owned items instantly, unlock locked ones in place. Every change persists
immediately; decks are composition-valid by construction.</p>
<p><strong>Masteries are the deck's engine-building spine:</strong> they permanently
rewrite ability numbers (damage, stacks, heals, damage types), sometimes
conditionally on the firing roll ("undefendable with all 5 axes"). Unconditional
upgrades are baked into every preview; roll-conditional riders resolve against
the actual firing faces.</p>

<h2 id="economy">8 · Economy &amp; tempo</h2>
<ul>
<li><strong>CP</strong> (cap ${CP_CAP}) pays for cards and Atone. Income +1/turn, selling +1,
plus each hero's resource identity: the Berserker banks +1 per landed hit, the
Pyromancer is paid when Cinder detonates (+2) or is stripped (+1/stack), the
Lightbearer earns +1 whenever a judged opponent attacks.</li>
<li><strong>Passive banks:</strong> Frenzy (Berserker, max 4) converts damage taken into
+1 damage per stack; Radiance (Lightbearer, starts 2, max 6) spends during attacks
(+1 dmg or +1 heal per token) or defenses (−1 incoming per token).</li>
<li><strong>Tempo envelope:</strong> Berserker games run ~9 turns, Pyromancer ~7 (glass
cannon races), Lightbearer ~13–14 (attrition). Damage throughput is tuned flat
(~30–33 dealt per match per hero) with sustain as the differentiator.</li>
</ul>

${HERO_ORDER.map(heroSection).join("\n")}

<h2 id="generic">10 · Generic card pool</h2>
<p>Every hero can draft these. Recommended decks carry Quick Draw, Focus,
Battle Plan, and Bandage; Cleanse is deliberate catalog-only tech (a default-deck
Cleanse defused the Cinder/Frost-bite engines and warped the matchup matrix).</p>
<table><thead><tr><th>Card</th><th>CP</th><th>Kind</th><th>Category</th><th>Text</th></tr></thead>
<tbody>${cardRows(GENERIC_CARDS)}</tbody></table>

<h2 id="balance">11 · Balance state &amp; methodology</h2>
<p>Balance is measured, not asserted: <code>npx tsx scripts/balance.ts --n 300</code> runs a
2,700-match AI matrix (every ordered pairing) with per-source damage/heal/CP
attribution — every number in a tuning change is justified by a diff of that
report. Current validated state:</p>
<table><thead><tr><th>Measure</th><th>Berserker</th><th>Pyromancer</th><th>Lightbearer</th></tr></thead><tbody>
<tr><td class="name">Pooled winrate</td><td>48.5%</td><td>50.6%</td><td>50.9%</td></tr>
<tr><td class="name">Damage dealt / match</td><td>~31</td><td>~31</td><td>~30</td></tr>
<tr><td class="name">Avg match length (mirror)</td><td>9 turns</td><td>7 turns</td><td>13 turns</td></tr>
</tbody></table>
<p>Matchups all sit within ±5 of even (Ber–Pyro 45.5, Ber–LB 50.0, Pyro–LB 47.3
pooled across seats). Known residual: the Lightbearer's first-strike Verdict tempo
gives it a seat-sensitive edge in fast pairings — tracked, acceptable.</p>

<h2 id="visual">12 · Visual &amp; UX language</h2>
<div class="grid2">
<div>
<h3>Palette</h3>
<p>
<span class="swatch" style="background:#0a0a14"></span>Night <code>#0a0a14</code> — never pure black<br>
<span class="swatch" style="background:#d4a548"></span>Gold <code>#d4a548</code> — chrome, CP, upgrades<br>
<span class="swatch" style="background:#6cb0e8"></span>Frost <code>#6cb0e8</code> — Berserker, blocks, "you"<br>
<span class="swatch" style="background:#f06848"></span>Ember <code>#f06848</code> — Pyromancer, damage, "foe"<br>
<span class="swatch" style="background:#fbbf24"></span>Dawn <code>#fbbf24</code> — Lightbearer, resources<br>
<span class="swatch" style="background:#d8d4c0"></span>Bone <code>#d8d4c0</code> — body text</p>
<h3>Type</h3>
<p>Cinzel (display, uppercase, wide tracking) · Cormorant Garamond (rules prose,
italic flavor) · JetBrains Mono (numbers, tech chrome).</p>
<h3>Art</h3>
<p>Hand-built layered SVG throughout: painted hero portraits, 46 illustrated card
motifs on a five-color hero palette, geometric crests. No raster assets.</p>
</div>
<div>
<h3>The seven bands</h3>
<p>The 390×844 match screen is seven fixed bands summing to 100%: opponent strip
(13) · phase banner (3.5) · dice tray (13) · middle/ladder (31) · self strip (12)
· hand fan (20) · action bar (7.5). Overlays inset against band edges, never
occlude the action bar.</p>
<h3>Choreography rules</h3>
<p>Dice physically tumble (3D hop-and-spin, faces cycling, cascading left-to-right
landings with impact rings). Combat feedback is <em>content-aware</em>: cinematics
hold 900ms + 350ms per extra effect row, so dense turns read and simple ones stay
snappy. Effects render as labeled pills (icon + text + YOU/FOE tag); resource
floaters stack in lanes. Every timing lives in one <code>DURATION</code> table;
everything honors <code>prefers-reduced-motion</code>.</p>
</div>
</div>

<p class="stamp" style="margin-top:60px">Pact of Heroes · this document supersedes the scattered docs/ tree for game-design reference ·
data sections are generated from <code>src/content</code> — do not hand-edit the HTML.</p>

</main>
</body>
</html>
`;

writeFileSync("docs/design-bible.html", html);
console.log(`docs/design-bible.html written (${(html.length / 1024).toFixed(0)} KB)`);

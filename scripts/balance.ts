/**
 * Pact of Heroes — balance matrix harness.
 *
 * Runs a full AI-vs-AI matchup matrix (every ordered hero pairing, so both
 * seats are measured) and prints:
 *   - winrate matrix + seat bias
 *   - avg match length per pairing
 *   - per-hero damage/heal attribution by source (ability, card, status tick,
 *     detonation) aggregated across all its matches
 *   - ability landed-counts and card play-counts
 *
 * Attribution works by scanning each applyAction event batch in order and
 * crediting damage-dealt / heal-applied events to the most recent marker
 * event (ability-triggered, card-played, status-ticked, status-detonated,
 * defense-resolved) in the same batch.
 *
 * Usage:
 *   npx tsx scripts/balance.ts                 # 60 matches per ordered pairing
 *   npx tsx scripts/balance.ts --n 200         # heavier run
 *   npx tsx scripts/balance.ts --seed 1000     # different seed base
 */

import { applyAction, makeEmptyState } from "../src/game/engine";
import { nextAiAction, pendingActorFor } from "../src/game/ai";
import type { Action, GameState, HeroId, PlayerId } from "../src/game/types";

const HERO_IDS: HeroId[] = ["berserker", "pyromancer", "lightbearer"];

interface SourceBuckets {
  damage: Map<string, number>;
  heals: Map<string, number>;
  cpGained: number;
  abilitiesLanded: Map<string, number>;
  cardsPlayed: Map<string, number>;
}

interface HeroAgg {
  matches: number;
  wins: number;
  buckets: SourceBuckets;
  totalDamage: number;
  totalHeals: number;
}

function emptyBuckets(): SourceBuckets {
  return { damage: new Map(), heals: new Map(), cpGained: 0, abilitiesLanded: new Map(), cardsPlayed: new Map() };
}

function bump(m: Map<string, number>, k: string, v: number): void {
  m.set(k, (m.get(k) ?? 0) + v);
}

function parseArgs(): { n: number; seed: number } {
  const args = process.argv.slice(2);
  let n = 60, seed = 42;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--n") n = Number(args[++i]);
    if (args[i] === "--seed") seed = Number(args[++i]);
  }
  return { n, seed };
}

function runMatch(
  seed: number, p1: HeroId, p2: HeroId,
  agg: Record<PlayerId, SourceBuckets>,
): { winner: PlayerId | "draw"; turns: number } {
  let state: GameState = makeEmptyState();
  ({ state } = applyAction(state, { kind: "start-match", seed, p1, p2, coinFlipWinner: "p1" }));

  // Source markers persist across action batches — an attack's damage often
  // lands several batches after the ability fires (defense pick, bank-spend
  // windows sit in between).
  const src: Record<PlayerId, string> = { p1: "unattributed", p2: "unattributed" };

  let safety = 0;
  while (!state.winner && safety++ < 4000) {
    const actor = pendingActorFor(state);
    const action: Action | null = nextAiAction(state, actor);
    if (!action) break;
    const r = applyAction(state, action);
    state = r.state;

    for (const ev of r.events) {
      switch (ev.t) {
        case "attack-intended":
          src[ev.attacker] = `ability:${ev.abilityName}`;
          break;
        case "ability-triggered":
          src[ev.player] = `ability:${ev.abilityName}`;
          bump(agg[ev.player].abilitiesLanded, `T${ev.tier} ${ev.abilityName}`, 1);
          break;
        case "defense-resolved": {
          const e = ev as unknown as { defender: PlayerId; abilityName: string | null; landed?: boolean };
          if (e.landed && e.abilityName) src[e.defender] = `defense:${e.abilityName}`;
          break;
        }
        case "card-played": {
          src[ev.player] = `card:${ev.cardId}`;
          bump(agg[ev.player].cardsPlayed, ev.cardId, 1);
          break;
        }
        case "status-detonated": {
          const applier: PlayerId = ev.holder === "p1" ? "p2" : "p1";
          src[applier] = `detonation:${ev.status}`;
          break;
        }
        case "status-ticked":
          if (ev.effect === "damage") {
            // Tick damage doesn't emit damage-dealt; credit applier directly.
            const applier: PlayerId = ev.holder === "p1" ? "p2" : "p1";
            bump(agg[applier].damage, `status:${ev.status}`, ev.amount);
          }
          break;
        case "damage-dealt":
          if (ev.from !== ev.to) {
            bump(agg[ev.from].damage, src[ev.from], ev.amount);
          } else {
            // Detonation damage is emitted with from === to === holder;
            // credit the opposing player (the token's applier).
            const applier: PlayerId = ev.from === "p1" ? "p2" : "p1";
            if (src[applier].startsWith("detonation:")) {
              bump(agg[applier].damage, src[applier], ev.amount);
            }
          }
          break;
        case "heal-applied":
          bump(agg[ev.player].heals, src[ev.player], ev.amount);
          break;
        case "cp-changed":
          if (ev.delta > 0) agg[ev.player].cpGained += ev.delta;
          break;
        default: break;
      }
    }
  }
  return { winner: state.winner ?? "draw", turns: state.turn };
}

function mergeBuckets(into: SourceBuckets, from: SourceBuckets): void {
  for (const [k, v] of from.damage) bump(into.damage, k, v);
  for (const [k, v] of from.heals) bump(into.heals, k, v);
  for (const [k, v] of from.abilitiesLanded) bump(into.abilitiesLanded, k, v);
  for (const [k, v] of from.cardsPlayed) bump(into.cardsPlayed, k, v);
  into.cpGained += from.cpGained;
}

function main(): void {
  const { n, seed } = parseArgs();
  const heroAgg: Record<string, HeroAgg> = {};
  for (const h of HERO_IDS) {
    heroAgg[h] = { matches: 0, wins: 0, buckets: emptyBuckets(), totalDamage: 0, totalHeals: 0 };
  }

  console.log(`\n=== Balance matrix — ${n} matches per ordered pairing (seed base ${seed}) ===\n`);
  const rows: string[] = [];
  const pairData: { p1: HeroId; p2: HeroId; p1wr: number; turns: number }[] = [];

  for (const h1 of HERO_IDS) {
    for (const h2 of HERO_IDS) {
      let p1Wins = 0, draws = 0, turnSum = 0;
      for (let i = 0; i < n; i++) {
        const perMatch: Record<PlayerId, SourceBuckets> = { p1: emptyBuckets(), p2: emptyBuckets() };
        const r = runMatch(seed + i * 7919, h1, h2, perMatch);
        if (r.winner === "p1") p1Wins++;
        else if (r.winner === "draw") draws++;
        turnSum += r.turns;
        mergeBuckets(heroAgg[h1].buckets, perMatch.p1);
        mergeBuckets(heroAgg[h2].buckets, perMatch.p2);
        heroAgg[h1].matches++; heroAgg[h2].matches++;
        if (r.winner === "p1") heroAgg[h1].wins++;
        if (r.winner === "p2") heroAgg[h2].wins++;
      }
      const wr = (100 * p1Wins) / n;
      pairData.push({ p1: h1, p2: h2, p1wr: wr, turns: turnSum / n });
      rows.push(
        `  ${h1.padEnd(11)} (p1) vs ${h2.padEnd(11)} (p2): p1 wins ${wr.toFixed(1).padStart(5)}%` +
        `  draws ${draws}  avg turns ${(turnSum / n).toFixed(1)}`,
      );
    }
  }
  console.log(rows.join("\n"));

  // Hero-level winrates (both seats pooled; mirrors count for both).
  console.log("\n=== Per-hero pooled winrate ===");
  for (const h of HERO_IDS) {
    const a = heroAgg[h];
    console.log(`  ${h.padEnd(11)} ${(100 * a.wins / a.matches).toFixed(1)}%  (${a.wins}/${a.matches})`);
  }

  // Cross-matchup (non-mirror) summary from the pair data.
  console.log("\n=== Non-mirror matchups (pooled across seats) ===");
  for (let i = 0; i < HERO_IDS.length; i++) {
    for (let j = i + 1; j < HERO_IDS.length; j++) {
      const a = HERO_IDS[i], b = HERO_IDS[j];
      const asP1 = pairData.find(p => p.p1 === a && p.p2 === b)!.p1wr;
      const asP2 = 100 - pairData.find(p => p.p1 === b && p.p2 === a)!.p1wr;
      console.log(`  ${a} vs ${b}: ${((asP1 + asP2) / 2).toFixed(1)}% for ${a}  (as p1 ${asP1.toFixed(1)}%, as p2 ${asP2.toFixed(1)}%)`);
    }
  }

  // Seat bias from mirrors.
  console.log("\n=== Seat bias (mirror matches, p1 winrate) ===");
  for (const h of HERO_IDS) {
    const m = pairData.find(p => p.p1 === h && p.p2 === h)!;
    console.log(`  ${h.padEnd(11)} p1 wins ${m.p1wr.toFixed(1)}%  avg turns ${m.turns.toFixed(1)}`);
  }

  // Per-hero source attribution.
  const top = (m: Map<string, number>, k = 12) =>
    [...m.entries()].sort((x, y) => y[1] - x[1]).slice(0, k);
  for (const h of HERO_IDS) {
    const a = heroAgg[h];
    const dmgTotal = [...a.buckets.damage.values()].reduce((s, v) => s + v, 0);
    const healTotal = [...a.buckets.heals.values()].reduce((s, v) => s + v, 0);
    console.log(`\n=== ${h} — per-match averages over ${a.matches} matches ===`);
    console.log(`  damage dealt ${(dmgTotal / a.matches).toFixed(1)}/match   heals ${(healTotal / a.matches).toFixed(1)}/match   CP gained ${(a.buckets.cpGained / a.matches).toFixed(1)}/match`);
    console.log("  damage by source:");
    for (const [k, v] of top(a.buckets.damage))
      console.log(`    ${k.padEnd(36)} ${(v / a.matches).toFixed(2).padStart(6)}/match`);
    console.log("  heals by source:");
    for (const [k, v] of top(a.buckets.heals, 6))
      console.log(`    ${k.padEnd(36)} ${(v / a.matches).toFixed(2).padStart(6)}/match`);
    console.log("  abilities landed (/match):");
    for (const [k, v] of top(a.buckets.abilitiesLanded))
      console.log(`    ${k.padEnd(36)} ${(v / a.matches).toFixed(2).padStart(6)}`);
    console.log("  cards played (/match):");
    for (const [k, v] of top(a.buckets.cardsPlayed))
      console.log(`    ${k.padEnd(36)} ${(v / a.matches).toFixed(2).padStart(6)}`);
  }
  console.log("");
}

main();

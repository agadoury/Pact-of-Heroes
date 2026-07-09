/**
 * Pact of Heroes — collection / progression layer.
 *
 * Per-hero Renown currency + unlock state for catalog abilities and cards.
 * The recommended loadout and recommended deck are always owned; every
 * other catalog ability / card is collectible: it carries a Renown price
 * (derived from its tier / category — no per-item authoring) and unlocks
 * when the player spends Renown in the customization hub.
 *
 * Renown is earned per finished match with the hero you played:
 * +3 on a win, +1 on a loss, plus performance bonuses — named finishes
 * (Flawless/Clutch/Comeback +2, Critical Victory +3, Surgeon/Stomp/
 * Grinder +1, wins only) and +1 for firing your ultimate (win or lose).
 * Awarding is idempotent per match (keyed on the match's seed + winner +
 * turn) so re-renders / revisits can't double-pay.
 *
 * Pure functions, no React. Same fail-soft localStorage posture as
 * deckStorage / loadoutStorage.
 */

import type { AbilityDef, Card, CardId, HeroId } from "@/game/types";
import type { MatchDescriptor } from "@/game/match-summary";
import type { AiRank } from "@/game/ai";
import { RANK_RENOWN_MULT } from "@/game/ai";
import { getHero, getCardCatalog } from "@/content";

const STORAGE_KEY = "pact-of-heroes:collection:v1";
const SCHEMA_VERSION = 1;

export const RENOWN_WIN = 3;
export const RENOWN_LOSS = 1;
/** A head start so the first unlock is one match away, not five. */
export const RENOWN_STARTING = 3;
/** Extra Renown for a named finish (the match summary's descriptor). */
export const RENOWN_DESCRIPTOR_BONUS: Partial<Record<MatchDescriptor, number>> = {
  "CRITICAL VICTORY": 3,
  "FLAWLESS": 2,
  "CLUTCH": 2,
  "COMEBACK": 2,
  "SURGEON": 1,
  "STOMP": 1,
  "GRINDER": 1,
};
/** Firing your ultimate is a career moment — paid win or lose. */
export const RENOWN_ULTIMATE_BONUS = 1;
/** "On Fire" — extra Renown per win once a streak reaches the threshold. */
export const RENOWN_STREAK_BONUS = 1;
export const STREAK_BONUS_AT = 3;

interface HeroCollectionEntry {
  renown: number;                 // spendable balance
  earnedLifetime: number;
  unlockedAbilities: string[];    // catalog ability names beyond the recommended set
  unlockedCards: CardId[];        // card ids beyond the recommended deck
  /** Wins per Pact Rank — Nightmare unlocks at 5 Champion wins. Optional
   *  for pre-existing saves. */
  rankWins?: Partial<Record<AiRank, number>>;
  /** Win Streak Embers — consecutive wins with this hero. Optional for
   *  pre-existing saves. */
  currentStreak?: number;
  bestStreak?: number;
}

/** Champion wins required (per hero) before Nightmare opens. */
export const NIGHTMARE_UNLOCK_WINS = 5;

interface StorageRoot {
  version: number;
  perHero: Partial<Record<HeroId, HeroCollectionEntry>>;
  /** Idempotency key of the last awarded match. */
  lastAwardKey: string | null;
  /** Consecutive wins across all heroes. Optional for pre-existing saves. */
  globalStreak?: number;
}

function emptyEntry(): HeroCollectionEntry {
  return { renown: RENOWN_STARTING, earnedLifetime: RENOWN_STARTING, unlockedAbilities: [], unlockedCards: [] };
}

function emptyRoot(): StorageRoot {
  return { version: SCHEMA_VERSION, perHero: {}, lastAwardKey: null };
}

function readRoot(): StorageRoot {
  try {
    if (typeof localStorage === "undefined") return emptyRoot();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyRoot();
    const parsed = JSON.parse(raw) as Partial<StorageRoot>;
    if (!parsed || parsed.version !== SCHEMA_VERSION) return emptyRoot();
    return {
      version: SCHEMA_VERSION,
      perHero: parsed.perHero ?? {},
      lastAwardKey: parsed.lastAwardKey ?? null,
      globalStreak: parsed.globalStreak ?? 0,
    };
  } catch {
    return emptyRoot();
  }
}

function writeRoot(root: StorageRoot): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
  } catch {
    // Quota / private mode — collection simply doesn't persist.
  }
}

// ── Pricing ──────────────────────────────────────────────────────────────────

/** Renown price for a non-recommended catalog ability. */
export function abilityPrice(a: AbilityDef): number {
  switch (a.tier) {
    case 1: return 4;
    case 2: return 6;
    case 3: return 8;
    case 4: return 12;
  }
}

/** Renown price for a non-recommended card. */
export function cardPrice(c: Card): number {
  switch (c.cardCategory) {
    case "generic":        return 3;
    case "dice-manip":     return 5;
    case "signature":      return 6;
    case "ladder-upgrade": return 8;
  }
}

// ── Reads ────────────────────────────────────────────────────────────────────

export interface HeroCollection {
  renown: number;
  earnedLifetime: number;
  /** All owned ability names (recommended + unlocked). */
  ownedAbilities: Set<string>;
  /** All owned card ids (recommended + unlocked). */
  ownedCards: Set<CardId>;
  /** Total collectible count + owned count, for "12/17 collected" UI. */
  collectibleCount: number;
  ownedCount: number;
}

export function getCollection(heroId: HeroId): HeroCollection {
  const hero = getHero(heroId);
  const entry = readRoot().perHero[heroId] ?? emptyEntry();
  const recommendedAbilities = new Set<string>([
    ...hero.recommendedLoadout.offense,
    ...hero.recommendedLoadout.defense,
  ]);
  const recommendedCards = new Set<CardId>(hero.recommendedDeck as CardId[]);
  const ownedAbilities = new Set<string>([...recommendedAbilities, ...entry.unlockedAbilities]);
  const ownedCards = new Set<CardId>([...recommendedCards, ...entry.unlockedCards]);

  const catalogAbilities = [...hero.abilityCatalog, ...(hero.defensiveCatalog ?? [])];
  const catalogCards = getCardCatalog(heroId);
  const collectibleCount = catalogAbilities.length + catalogCards.length;
  const ownedCount =
    catalogAbilities.filter(a => ownedAbilities.has(a.name)).length +
    catalogCards.filter(c => ownedCards.has(c.id as CardId)).length;

  return {
    renown: entry.renown,
    earnedLifetime: entry.earnedLifetime,
    ownedAbilities,
    ownedCards,
    collectibleCount,
    ownedCount,
  };
}

// ── Mutations ────────────────────────────────────────────────────────────────

export interface RenownAward {
  total: number;
  /** Ordered lines for the summary screen, e.g. Win +3 · Flawless +2. */
  breakdown: Array<{ label: string; amount: number }>;
}

/** Compute the Renown owed for a finished match, with a per-line
 *  breakdown: base win/loss, a named-finish bonus (descriptor), an
 *  ultimate-fired bonus (paid win or lose — career moments count), plus
 *  the stakes layer: the Pact Rank multiplier (Champion ×1.5 /
 *  Nightmare ×2) and Seal the Pact (×2 on a win, forfeits the loss pay). */
export function computeRenownAward(
  won: boolean,
  perf?: { descriptor?: MatchDescriptor; ultimatesFired?: number; streak?: number },
  stakes?: { rank?: AiRank; sealed?: boolean },
): RenownAward {
  // A sealed loss pays nothing — the pact was forfeited. This is the
  // gamble that makes sealing a real decision, not a free upside.
  if (stakes?.sealed && !won) {
    return { total: 0, breakdown: [{ label: "Sealed pact forfeited", amount: 0 }] };
  }

  const breakdown: RenownAward["breakdown"] = [
    won ? { label: "Victory", amount: RENOWN_WIN } : { label: "Fought", amount: RENOWN_LOSS },
  ];
  if (won && perf?.descriptor) {
    const bonus = RENOWN_DESCRIPTOR_BONUS[perf.descriptor] ?? 0;
    if (bonus > 0) {
      const label = perf.descriptor.charAt(0) + perf.descriptor.slice(1).toLowerCase();
      breakdown.push({ label, amount: bonus });
    }
  }
  if ((perf?.ultimatesFired ?? 0) > 0) {
    breakdown.push({ label: "Ultimate fired", amount: RENOWN_ULTIMATE_BONUS });
  }
  // On Fire — a live streak (including this win) at the threshold pays out.
  if (won && (perf?.streak ?? 0) >= STREAK_BONUS_AT) {
    breakdown.push({ label: `On fire ×${perf!.streak}`, amount: RENOWN_STREAK_BONUS });
  }

  let total = breakdown.reduce((s2, b) => s2 + b.amount, 0);

  // Pact Rank multiplier — wins only (losing to Nightmare still pays the
  // base "Fought" +1, not a multiplied consolation).
  const mult = stakes?.rank ? RANK_RENOWN_MULT[stakes.rank] : 1;
  if (won && mult > 1) {
    const withRank = Math.round(total * mult);
    const rankLabel = stakes!.rank!.charAt(0).toUpperCase() + stakes!.rank!.slice(1);
    breakdown.push({ label: `${rankLabel} ×${mult}`, amount: withRank - total });
    total = withRank;
  }

  // Seal the Pact — a sealed win pays double, whoever sealed it.
  if (stakes?.sealed && won) {
    breakdown.push({ label: "Pact sealed ×2", amount: total });
    total *= 2;
  }

  return { total, breakdown };
}

// ── Pact Ranks: per-hero rank wins + Nightmare unlock ───────────────────────

export function getRankWins(heroId: HeroId): Partial<Record<AiRank, number>> {
  return readRoot().perHero[heroId]?.rankWins ?? {};
}

/** Record a win against a given rank (call once per won match — the
 *  caller's award idempotency gates re-invocation). */
export function recordRankWin(heroId: HeroId, rank: AiRank): void {
  const root = readRoot();
  const entry = root.perHero[heroId] ?? emptyEntry();
  const rankWins = { ...(entry.rankWins ?? {}) };
  rankWins[rank] = (rankWins[rank] ?? 0) + 1;
  root.perHero = { ...root.perHero, [heroId]: { ...entry, rankWins } };
  writeRoot(root);
}

/** Nightmare opens per-hero after enough Champion wins — a rank you earn. */
export function isNightmareUnlocked(heroId: HeroId): boolean {
  return (getRankWins(heroId).champion ?? 0) >= NIGHTMARE_UNLOCK_WINS;
}

/** Award match Renown to the hero the viewer played. Idempotent per
 *  `matchKey` — returns the amount actually awarded (0 when re-invoked).
 *  When `won` is provided the match result also drives the Win Streak
 *  Embers (per-hero + global) — including a 0-Renown sealed loss, which
 *  must still break the streak. */
export function awardMatchRenown(heroId: HeroId, amount: number, matchKey: string, won?: boolean): number {
  const root = readRoot();
  if (root.lastAwardKey === matchKey) return 0;
  if (amount <= 0 && won === undefined) return 0;
  const entry = root.perHero[heroId] ?? emptyEntry();
  const gained = Math.max(0, amount);
  const next: HeroCollectionEntry = {
    ...entry,
    renown: entry.renown + gained,
    earnedLifetime: entry.earnedLifetime + gained,
  };
  if (won !== undefined) {
    const streak = won ? (entry.currentStreak ?? 0) + 1 : 0;
    next.currentStreak = streak;
    next.bestStreak = Math.max(entry.bestStreak ?? 0, streak);
    root.globalStreak = won ? (root.globalStreak ?? 0) + 1 : 0;
  }
  root.perHero = { ...root.perHero, [heroId]: next };
  root.lastAwardKey = matchKey;
  writeRoot(root);
  return gained;
}

// ── Win Streak Embers + Next Unlock target ──────────────────────────────────

export interface StreakInfo { hero: number; best: number; global: number }

export function getStreaks(heroId: HeroId): StreakInfo {
  const root = readRoot();
  const e = root.perHero[heroId];
  return {
    hero: e?.currentStreak ?? 0,
    best: e?.bestStreak ?? 0,
    global: root.globalStreak ?? 0,
  };
}

export interface NextUnlockTarget {
  kind: "ability" | "card";
  name: string;
  price: number;
  /** Current spendable balance — the bar's fill numerator. */
  renown: number;
}

/** The cheapest locked collectible — the Next Unlock Bar's goal. Null once
 *  the hero's catalog is fully owned. */
export function getNextUnlockTarget(heroId: HeroId): NextUnlockTarget | null {
  const hero = getHero(heroId);
  const c = getCollection(heroId);
  const candidates: Array<{ kind: "ability" | "card"; name: string; price: number }> = [];
  for (const a of [...hero.abilityCatalog, ...(hero.defensiveCatalog ?? [])]) {
    if (!c.ownedAbilities.has(a.name)) candidates.push({ kind: "ability", name: a.name, price: abilityPrice(a) });
  }
  for (const card of getCardCatalog(heroId)) {
    if (!c.ownedCards.has(card.id as CardId)) candidates.push({ kind: "card", name: card.name, price: cardPrice(card) });
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
  const target = candidates[0]!;
  return { ...target, renown: c.renown };
}

/** Spend Renown to unlock an ability. Returns true on success (false when
 *  already owned or unaffordable). */
export function unlockAbility(heroId: HeroId, ability: AbilityDef): boolean {
  const root = readRoot();
  const entry = root.perHero[heroId] ?? emptyEntry();
  const collection = getCollection(heroId);
  if (collection.ownedAbilities.has(ability.name)) return false;
  const price = abilityPrice(ability);
  if (entry.renown < price) return false;
  root.perHero = {
    ...root.perHero,
    [heroId]: {
      ...entry,
      renown: entry.renown - price,
      unlockedAbilities: [...entry.unlockedAbilities, ability.name],
    },
  };
  writeRoot(root);
  return true;
}

/** Spend Renown to unlock a card. Same contract as `unlockAbility`. */
export function unlockCard(heroId: HeroId, card: Card): boolean {
  const root = readRoot();
  const entry = root.perHero[heroId] ?? emptyEntry();
  const collection = getCollection(heroId);
  if (collection.ownedCards.has(card.id as CardId)) return false;
  const price = cardPrice(card);
  if (entry.renown < price) return false;
  root.perHero = {
    ...root.perHero,
    [heroId]: {
      ...entry,
      renown: entry.renown - price,
      unlockedCards: [...entry.unlockedCards, card.id as CardId],
    },
  };
  writeRoot(root);
  return true;
}

/** True when the hero has at least one locked item it can afford — drives
 *  the "new unlocks available" nudge on the match summary. */
export function hasAffordableUnlock(heroId: HeroId): boolean {
  const hero = getHero(heroId);
  const c = getCollection(heroId);
  const abilities = [...hero.abilityCatalog, ...(hero.defensiveCatalog ?? [])];
  if (abilities.some(a => !c.ownedAbilities.has(a.name) && abilityPrice(a) <= c.renown)) return true;
  const cards = getCardCatalog(heroId);
  return cards.some(card => !c.ownedCards.has(card.id as CardId) && cardPrice(card) <= c.renown);
}

/** Test / debug — wipe all collection state. */
export function clearAllCollections(): void {
  writeRoot(emptyRoot());
}

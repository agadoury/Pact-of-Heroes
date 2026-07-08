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
 * +3 on a win, +1 on a loss. Awarding is idempotent per match (keyed on
 * the match's seed + winner + turn) so re-renders / revisits can't
 * double-pay.
 *
 * Pure functions, no React. Same fail-soft localStorage posture as
 * deckStorage / loadoutStorage.
 */

import type { AbilityDef, Card, CardId, HeroId } from "@/game/types";
import { getHero, getCardCatalog } from "@/content";

const STORAGE_KEY = "pact-of-heroes:collection:v1";
const SCHEMA_VERSION = 1;

export const RENOWN_WIN = 3;
export const RENOWN_LOSS = 1;
/** A head start so the first unlock is one match away, not five. */
export const RENOWN_STARTING = 3;

interface HeroCollectionEntry {
  renown: number;                 // spendable balance
  earnedLifetime: number;
  unlockedAbilities: string[];    // catalog ability names beyond the recommended set
  unlockedCards: CardId[];        // card ids beyond the recommended deck
}

interface StorageRoot {
  version: number;
  perHero: Partial<Record<HeroId, HeroCollectionEntry>>;
  /** Idempotency key of the last awarded match. */
  lastAwardKey: string | null;
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

/** Award match Renown to the hero the viewer played. Idempotent per
 *  `matchKey` — returns the amount actually awarded (0 when re-invoked). */
export function awardMatchRenown(heroId: HeroId, won: boolean, matchKey: string): number {
  const root = readRoot();
  if (root.lastAwardKey === matchKey) return 0;
  const entry = root.perHero[heroId] ?? emptyEntry();
  const amount = won ? RENOWN_WIN : RENOWN_LOSS;
  root.perHero = {
    ...root.perHero,
    [heroId]: {
      ...entry,
      renown: entry.renown + amount,
      earnedLifetime: entry.earnedLifetime + amount,
    },
  };
  root.lastAwardKey = matchKey;
  writeRoot(root);
  return amount;
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

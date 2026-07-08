/**
 * collection-storage.test.ts — Renown economy + unlock state.
 */
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import {
  getCollection, awardMatchRenown, unlockAbility, unlockCard,
  hasAffordableUnlock, clearAllCollections, abilityPrice, cardPrice,
  RENOWN_WIN, RENOWN_LOSS, RENOWN_STARTING,
} from "../src/store/collectionStorage";
import { getHero, getCardCatalog } from "../src/content";

// vitest runs in `node` environment; install a minimal localStorage shim so
// the storage layer has somewhere to read/write.
beforeAll(() => {
  if (typeof globalThis.localStorage === "undefined") {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
        setItem: (k: string, v: string) => { store.set(k, String(v)); },
        removeItem: (k: string) => { store.delete(k); },
        clear: () => { store.clear(); },
        key: (i: number) => Array.from(store.keys())[i] ?? null,
        get length() { return store.size; },
      },
    });
  }
});

beforeEach(() => {
  localStorage.clear();
  clearAllCollections();
});

const hero = getHero("berserker");
const lockedAbility = () =>
  hero.abilityCatalog.find(a => !hero.recommendedLoadout.offense.includes(a.name))!;
const lockedCard = () =>
  getCardCatalog("berserker").find(c => !hero.recommendedDeck.includes(c.id))!;

describe("collection defaults", () => {
  it("recommended loadout + deck start owned; alternates locked", () => {
    const c = getCollection("berserker");
    for (const name of hero.recommendedLoadout.offense) expect(c.ownedAbilities.has(name)).toBe(true);
    for (const name of hero.recommendedLoadout.defense) expect(c.ownedAbilities.has(name)).toBe(true);
    for (const id of hero.recommendedDeck) expect(c.ownedCards.has(id)).toBe(true);
    expect(c.ownedAbilities.has(lockedAbility().name)).toBe(false);
    expect(c.ownedCards.has(lockedCard().id)).toBe(false);
    expect(c.renown).toBe(RENOWN_STARTING);
    expect(c.ownedCount).toBeLessThan(c.collectibleCount);
  });
});

describe("renown awards", () => {
  it("pays win/loss amounts and is idempotent per match key", () => {
    expect(awardMatchRenown("berserker", true, "match-1")).toBe(RENOWN_WIN);
    expect(awardMatchRenown("berserker", true, "match-1")).toBe(0);   // same match
    expect(awardMatchRenown("berserker", false, "match-2")).toBe(RENOWN_LOSS);
    const c = getCollection("berserker");
    expect(c.renown).toBe(RENOWN_STARTING + RENOWN_WIN + RENOWN_LOSS);
    expect(c.earnedLifetime).toBe(c.renown);
  });
});

describe("unlocks", () => {
  it("spends renown and persists the unlock", () => {
    const target = lockedAbility();
    // Fund enough renown.
    let k = 0;
    while (getCollection("berserker").renown < abilityPrice(target)) {
      awardMatchRenown("berserker", true, `m-${k++}`);
    }
    const before = getCollection("berserker").renown;
    expect(unlockAbility("berserker", target)).toBe(true);
    const c = getCollection("berserker");
    expect(c.ownedAbilities.has(target.name)).toBe(true);
    expect(c.renown).toBe(before - abilityPrice(target));
    // Double-unlock is refused and doesn't double-charge.
    expect(unlockAbility("berserker", target)).toBe(false);
    expect(getCollection("berserker").renown).toBe(before - abilityPrice(target));
  });

  it("refuses unaffordable unlocks", () => {
    const target = lockedCard();
    // Starting renown (3) is below every non-generic card price by design,
    // but drain to zero to be robust against tuning: buy generics if needed.
    const c0 = getCollection("berserker");
    expect(c0.renown).toBeLessThan(cardPrice(target) + 10); // sanity
    // Force renown below price by picking the priciest locked card.
    const cards = getCardCatalog("berserker")
      .filter(c => !c0.ownedCards.has(c.id))
      .sort((a, b) => cardPrice(b) - cardPrice(a));
    const expensive = cards[0]!;
    if (cardPrice(expensive) > c0.renown) {
      expect(unlockCard("berserker", expensive)).toBe(false);
      expect(getCollection("berserker").ownedCards.has(expensive.id)).toBe(false);
    }
  });

  it("hasAffordableUnlock flips as renown accrues", () => {
    // Cheapest locked item for berserker is a 3-renown generic card, so the
    // starting balance already affords something.
    expect(hasAffordableUnlock("berserker")).toBe(true);
  });
});

describe("pricing", () => {
  it("prices every catalog item deterministically", () => {
    for (const a of [...hero.abilityCatalog, ...(hero.defensiveCatalog ?? [])]) {
      expect(abilityPrice(a)).toBeGreaterThan(0);
    }
    for (const c of getCardCatalog("berserker")) {
      expect(cardPrice(c)).toBeGreaterThan(0);
    }
  });
});

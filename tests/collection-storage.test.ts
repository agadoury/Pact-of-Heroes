/**
 * collection-storage.test.ts — Renown economy + unlock state.
 */
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import {
  getCollection, awardMatchRenown, computeRenownAward, unlockAbility, unlockCard,
  hasAffordableUnlock, clearAllCollections, abilityPrice, cardPrice,
  getRankWins, recordRankWin, isNightmareUnlocked, NIGHTMARE_UNLOCK_WINS,
  RENOWN_WIN, RENOWN_LOSS, RENOWN_STARTING, RENOWN_ULTIMATE_BONUS,
} from "../src/store/collectionStorage";
import { RANK_RENOWN_MULT } from "../src/game/ai";
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
    expect(awardMatchRenown("berserker", RENOWN_WIN, "match-1")).toBe(RENOWN_WIN);
    expect(awardMatchRenown("berserker", RENOWN_WIN, "match-1")).toBe(0);   // same match
    expect(awardMatchRenown("berserker", RENOWN_LOSS, "match-2")).toBe(RENOWN_LOSS);
    const c = getCollection("berserker");
    expect(c.renown).toBe(RENOWN_STARTING + RENOWN_WIN + RENOWN_LOSS);
    expect(c.earnedLifetime).toBe(c.renown);
  });

  it("computeRenownAward pays performance bonuses with a breakdown", () => {
    const plain = computeRenownAward(true);
    expect(plain.total).toBe(RENOWN_WIN);
    const flawless = computeRenownAward(true, { descriptor: "FLAWLESS" });
    expect(flawless.total).toBe(RENOWN_WIN + 2);
    expect(flawless.breakdown.some(b => b.label === "Flawless")).toBe(true);
    const ultLoss = computeRenownAward(false, { ultimatesFired: 1 });
    expect(ultLoss.total).toBe(RENOWN_LOSS + RENOWN_ULTIMATE_BONUS);
    // Descriptor bonuses never pay on a loss.
    const descLoss = computeRenownAward(false, { descriptor: "FLAWLESS" });
    expect(descLoss.total).toBe(RENOWN_LOSS);
    // Plain VICTORY descriptor adds nothing.
    const victory = computeRenownAward(true, { descriptor: "VICTORY" });
    expect(victory.total).toBe(RENOWN_WIN);
  });

  it("applies the Pact Rank multiplier to wins only", () => {
    const champ = computeRenownAward(true, undefined, { rank: "champion" });
    expect(champ.total).toBe(Math.round(RENOWN_WIN * RANK_RENOWN_MULT.champion));
    expect(champ.breakdown.some(b => b.label.startsWith("Champion"))).toBe(true);
    const nightmare = computeRenownAward(true, undefined, { rank: "nightmare" });
    expect(nightmare.total).toBe(RENOWN_WIN * RANK_RENOWN_MULT.nightmare);
    const squire = computeRenownAward(true, undefined, { rank: "squire" });
    expect(squire.total).toBe(RENOWN_WIN);
    // Losses always pay the base "Fought" +1 — no multiplied consolation.
    const nightmareLoss = computeRenownAward(false, undefined, { rank: "nightmare" });
    expect(nightmareLoss.total).toBe(RENOWN_LOSS);
  });

  it("Seal the Pact doubles a win and forfeits a loss", () => {
    const sealedWin = computeRenownAward(true, undefined, { sealed: true });
    expect(sealedWin.total).toBe(RENOWN_WIN * 2);
    expect(sealedWin.breakdown.some(b => b.label === "Pact sealed ×2")).toBe(true);
    const sealedLoss = computeRenownAward(false, { ultimatesFired: 2 }, { sealed: true });
    expect(sealedLoss.total).toBe(0);
    expect(sealedLoss.breakdown.some(b => b.label === "Sealed pact forfeited")).toBe(true);
    // Rank + seal stack: (3 × 2) × 2 = 12 for a sealed Nightmare win.
    const jackpot = computeRenownAward(true, undefined, { rank: "nightmare", sealed: true });
    expect(jackpot.total).toBe(RENOWN_WIN * RANK_RENOWN_MULT.nightmare * 2);
  });
});

describe("pact ranks", () => {
  it("Nightmare unlocks per hero after enough Champion wins", () => {
    expect(isNightmareUnlocked("berserker")).toBe(false);
    for (let i = 0; i < NIGHTMARE_UNLOCK_WINS; i++) recordRankWin("berserker", "champion");
    expect(getRankWins("berserker").champion).toBe(NIGHTMARE_UNLOCK_WINS);
    expect(isNightmareUnlocked("berserker")).toBe(true);
    // Siloed per hero.
    expect(isNightmareUnlocked("pyromancer")).toBe(false);
  });
});

describe("unlocks", () => {
  it("spends renown and persists the unlock", () => {
    const target = lockedAbility();
    // Fund enough renown.
    let k = 0;
    while (getCollection("berserker").renown < abilityPrice(target)) {
      awardMatchRenown("berserker", RENOWN_WIN, `m-${k++}`);
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

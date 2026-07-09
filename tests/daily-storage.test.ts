/**
 * daily-storage.test.ts — the Daily & Weekly Pact (device-clock layer).
 */
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import {
  todayKey, isoWeekKey, featuredHero, dailyPact, DAILY_MUTATORS,
  isFirstDawnAvailable, claimFirstDawn, clearDailyState,
  RENOWN_FIRST_DAWN, RENOWN_FEATURED_BONUS,
} from "../src/store/dailyStorage";
import { computeRenownAward, RENOWN_WIN, RENOWN_LOSS } from "../src/store/collectionStorage";
import { getRegisteredHeroIds } from "../src/content";

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
  clearDailyState();
});

describe("clock keys", () => {
  it("formats stable day and ISO-week keys", () => {
    const d = new Date(2026, 6, 9); // 2026-07-09, a Thursday
    expect(todayKey(d)).toBe("2026-07-09");
    expect(isoWeekKey(d)).toMatch(/^2026-W\d{2}$/);
  });
});

describe("featured hero", () => {
  it("is deterministic within a week and rotates across weeks", () => {
    const monday = new Date(2026, 6, 6);
    const sunday = new Date(2026, 6, 12);
    expect(featuredHero(monday)).toBe(featuredHero(sunday));
    // Over 12 consecutive weeks, more than one hero must appear.
    const seen = new Set<string>();
    for (let w = 0; w < 12; w++) seen.add(featuredHero(new Date(2026, 0, 5 + w * 7)));
    expect(seen.size).toBeGreaterThan(1);
    expect(getRegisteredHeroIds()).toContain(featuredHero(monday));
  });
});

describe("daily pact", () => {
  it("is fixed all day and varies across days", () => {
    const morning = new Date(2026, 6, 9, 8, 0);
    const night   = new Date(2026, 6, 9, 23, 55);
    const a = dailyPact(morning);
    const b = dailyPact(night);
    expect(a.mutator.id).toBe(b.mutator.id);
    expect(a.seed).toBe(b.seed);
    expect(a.coin).toBe(b.coin);
    // Across 14 days, at least 3 distinct mutators and 5 distinct seeds.
    const mutators = new Set<string>();
    const seeds = new Set<number>();
    for (let d = 1; d <= 14; d++) {
      const p = dailyPact(new Date(2026, 6, d));
      mutators.add(p.mutator.id);
      seeds.add(p.seed);
    }
    expect(mutators.size).toBeGreaterThanOrEqual(3);
    expect(seeds.size).toBeGreaterThanOrEqual(5);
  });

  it("every mutator is a legal MatchModifiers shape", () => {
    for (const m of DAILY_MUTATORS) {
      if (!m.modifiers) continue;
      for (const field of ["hp", "cp", "cards"] as const) {
        const f = m.modifiers[field];
        if (!f) continue;
        for (const v of Object.values(f)) expect(Number.isInteger(v)).toBe(true);
      }
    }
  });
});

describe("first dawn", () => {
  it("claims once per day, idempotently", () => {
    const day = new Date(2026, 6, 9);
    expect(isFirstDawnAvailable(day)).toBe(true);
    expect(claimFirstDawn(day)).toBe(true);
    expect(isFirstDawnAvailable(day)).toBe(false);
    expect(claimFirstDawn(day)).toBe(false);
    // Next day resets.
    const next = new Date(2026, 6, 10);
    expect(isFirstDawnAvailable(next)).toBe(true);
  });
});

describe("daily renown lines", () => {
  it("First Dawn pays on wins only; Featured pays win or lose", () => {
    const dawnWin = computeRenownAward(true, { firstDawn: true });
    expect(dawnWin.total).toBe(RENOWN_WIN + RENOWN_FIRST_DAWN);
    expect(dawnWin.breakdown.some(b => b.label === "First Dawn")).toBe(true);
    const dawnLoss = computeRenownAward(false, { firstDawn: true });
    expect(dawnLoss.total).toBe(RENOWN_LOSS);
    const featWin = computeRenownAward(true, { featured: true });
    expect(featWin.total).toBe(RENOWN_WIN + RENOWN_FEATURED_BONUS);
    const featLoss = computeRenownAward(false, { featured: true });
    expect(featLoss.total).toBe(RENOWN_LOSS + RENOWN_FEATURED_BONUS);
  });
});

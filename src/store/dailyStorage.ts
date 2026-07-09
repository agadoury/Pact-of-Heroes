/**
 * Pact of Heroes — the Daily & Weekly Pact (appointment layer).
 *
 * Everything derives from the device clock, no server:
 *   - FIRST DAWN: the first win each calendar day pays +5 Renown.
 *   - FEATURED HERO: an ISO-week hash spotlights one hero; playing them
 *     pays +2 Renown every match, win or lose — the only force that
 *     pulls players off their main.
 *   - THE DAILY PACT: a date hash picks one named rule-bend (start-state
 *     modifiers) plus a FIXED dice seed, all day. Retrying the daily is
 *     solving the seed — a puzzle loop the base mode can't offer.
 *
 * Same fail-soft localStorage posture as the other storage layers.
 */

import type { HeroId, MatchModifiers, PlayerId } from "@/game/types";
import { getRegisteredHeroIds } from "@/content";

const STORAGE_KEY = "pact-of-heroes:daily:v1";
const SCHEMA_VERSION = 1;

export const RENOWN_FIRST_DAWN = 5;
export const RENOWN_FEATURED_BONUS = 2;

// ── clock keys ───────────────────────────────────────────────────────────────

/** Local calendar day, YYYY-MM-DD. */
export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** ISO-8601 week key, e.g. 2026-W28. */
export function isoWeekKey(now: Date = new Date()): string {
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Deterministic 32-bit string hash (FNV-1a). */
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ── featured hero of the week ────────────────────────────────────────────────

export function featuredHero(now: Date = new Date()): HeroId {
  const ids = getRegisteredHeroIds();
  return ids[hash32(isoWeekKey(now)) % ids.length]!;
}

// ── the daily pact mutator ───────────────────────────────────────────────────

export interface DailyMutator {
  id: string;
  name: string;
  blurb: string;
  /** Symmetric start-state rule-bend (may be empty — the bare seed). */
  modifiers: MatchModifiers | undefined;
}

function both(delta: number): Partial<Record<PlayerId, number>> {
  return { p1: delta, p2: delta };
}

/** Hand-authored rule-bends, all within the engine's MatchModifiers
 *  vocabulary. Order matters only for the date hash. */
export const DAILY_MUTATORS: ReadonlyArray<DailyMutator> = [
  { id: "blood-tithe", name: "Blood Tithe",   blurb: "Both duelists offer 6 HP to the pact. Knife fight.", modifiers: { hp: both(-6) } },
  { id: "dawn-vigil",  name: "Dawn Vigil",    blurb: "Both stand at +6 HP. The long war.",                 modifiers: { hp: both(6) } },
  { id: "war-chest",   name: "War Chest",     blurb: "Both open with +2 CP. Spend loud.",                  modifiers: { cp: both(2) } },
  { id: "full-quiver", name: "Full Quiver",   blurb: "Both draw 2 extra cards. Options everywhere.",       modifiers: { cards: both(2) } },
  { id: "lean-winter", name: "Lean Winter",   blurb: "Both start a coin short (−1 CP). Every point hurts.", modifiers: { cp: both(-1) } },
  { id: "bare-pact",   name: "The Bare Pact", blurb: "No bends. One seed. Solve it.",                      modifiers: undefined },
];

export interface DailyPact {
  dateKey: string;
  mutator: DailyMutator;
  /** Fixed dice seed for the whole day — retrying is solving the seed. */
  seed: number;
  /** Deterministic coin flip so the puzzle is identical on every attempt. */
  coin: PlayerId;
  featured: HeroId;
}

export function dailyPact(now: Date = new Date()): DailyPact {
  const dateKey = todayKey(now);
  const h = hash32(dateKey);
  return {
    dateKey,
    mutator: DAILY_MUTATORS[h % DAILY_MUTATORS.length]!,
    seed: (h >>> 8) & 0xffff,
    coin: (h & 0x10000) ? "p1" : "p2",
    featured: featuredHero(now),
  };
}

// ── first dawn persistence ───────────────────────────────────────────────────

interface StorageRoot {
  version: number;
  /** Day key of the last claimed First Dawn. */
  lastFirstDawn: string | null;
}

function readRoot(): StorageRoot {
  try {
    if (typeof localStorage === "undefined") return { version: SCHEMA_VERSION, lastFirstDawn: null };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: SCHEMA_VERSION, lastFirstDawn: null };
    const parsed = JSON.parse(raw) as Partial<StorageRoot>;
    if (!parsed || parsed.version !== SCHEMA_VERSION) return { version: SCHEMA_VERSION, lastFirstDawn: null };
    return { version: SCHEMA_VERSION, lastFirstDawn: parsed.lastFirstDawn ?? null };
  } catch {
    return { version: SCHEMA_VERSION, lastFirstDawn: null };
  }
}

function writeRoot(root: StorageRoot): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
  } catch { /* quota / private mode */ }
}

/** Is today's First Dawn bonus still on the table? */
export function isFirstDawnAvailable(now: Date = new Date()): boolean {
  return readRoot().lastFirstDawn !== todayKey(now);
}

/** Claim today's First Dawn. Returns true on the first claim of the day,
 *  false if already claimed (idempotent). */
export function claimFirstDawn(now: Date = new Date()): boolean {
  const root = readRoot();
  const key = todayKey(now);
  if (root.lastFirstDawn === key) return false;
  writeRoot({ version: SCHEMA_VERSION, lastFirstDawn: key });
  return true;
}

/** Test / debug — reset the daily state. */
export function clearDailyState(): void {
  writeRoot({ version: SCHEMA_VERSION, lastFirstDawn: null });
}

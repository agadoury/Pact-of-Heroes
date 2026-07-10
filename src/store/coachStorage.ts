/**
 * Coach persistence — how many matches the player has seen, so the
 * contextual hint chip teaches during the first few duels and then gets
 * out of the way forever. Fail-soft localStorage, same as the other
 * storage layers.
 */

const STORAGE_KEY = "pact-of-heroes:coach:v1";
const SCHEMA_VERSION = 1;

/** Hints retire after this many matches (or an explicit dismiss). */
export const COACH_MATCH_LIMIT = 3;

interface StorageRoot {
  version: number;
  matchesSeen: number;
  dismissed: boolean;
  /** Idempotency key — the last match counted. */
  lastMatchKey: string | null;
}

function emptyRoot(): StorageRoot {
  return { version: SCHEMA_VERSION, matchesSeen: 0, dismissed: false, lastMatchKey: null };
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
      matchesSeen: parsed.matchesSeen ?? 0,
      dismissed: parsed.dismissed ?? false,
      lastMatchKey: parsed.lastMatchKey ?? null,
    };
  } catch {
    return emptyRoot();
  }
}

function writeRoot(root: StorageRoot): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
  } catch { /* private mode */ }
}

export function getCoachSeen(): { matchesSeen: number; dismissed: boolean } {
  const r = readRoot();
  return { matchesSeen: r.matchesSeen, dismissed: r.dismissed };
}

/** Count a fresh match once (idempotent per matchKey — reloads and
 *  re-mounts of the same match don't advance the counter). */
export function recordCoachMatch(matchKey: string): void {
  const root = readRoot();
  if (root.lastMatchKey === matchKey) return;
  root.lastMatchKey = matchKey;
  root.matchesSeen += 1;
  writeRoot(root);
}

/** The ✕ on the chip — hints never return. */
export function dismissCoach(): void {
  const root = readRoot();
  root.dismissed = true;
  writeRoot(root);
}

/** Test / debug — reset coach state. */
export function clearCoachState(): void {
  writeRoot(emptyRoot());
}

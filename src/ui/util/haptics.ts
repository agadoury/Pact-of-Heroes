/**
 * Haptic feedback — thin wrapper over navigator.vibrate with a persisted
 * on/off setting (key `pact-of-heroes:haptics`, already covered by the
 * legacy-storage migration). Patterns are short and semantic:
 *
 *   tap    8ms      every interactive press during a match
 *   roll   pulse    dice leave the hand
 *   hit    24ms     damage lands on either hero
 *   heavy  triple   killing blow / detonation-class moments
 *
 * No-ops silently where vibration is unsupported (desktop, iOS Safari).
 */

const KEY = 'pact-of-heroes:haptics'

export type HapticKind = 'tap' | 'roll' | 'hit' | 'heavy'

const PATTERNS: Record<HapticKind, number | number[]> = {
  tap:   8,
  roll:  [12, 40, 14],
  hit:   24,
  heavy: [28, 40, 56],
}

export function hapticsSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

/** Default ON — a physical tap response is expected on mobile. */
export function hapticsEnabled(): boolean {
  try {
    if (typeof localStorage === 'undefined') return true
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

export function setHapticsEnabled(on: boolean): void {
  try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* private mode */ }
}

export function haptic(kind: HapticKind = 'tap'): void {
  if (!hapticsSupported() || !hapticsEnabled()) return
  try { navigator.vibrate(PATTERNS[kind]) } catch { /* best effort */ }
}

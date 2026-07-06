/**
 * <Sigil>
 *
 * Die-symbol glyph. One hand-drawn SVG mark per symbol in the game's
 * dice vocabulary, replacing the placeholder first-letter rendering.
 * Inherits `currentColor` so pips/dice tint it through CSS.
 *
 * Silhouettes are deliberately bold — they must read at 10px inside a
 * ladder pip and at 26px on a die face.
 *
 * Bible reference: Part 2.7 (die faces), Part 3.4 (combo pips).
 */

export interface SigilProps {
  /** Namespaced engine symbol, e.g. "berserker:axe". */
  symbol:     string
  size?:      number
  className?: string
}

/** viewBox is 24×24 for every path. */
const PATHS: Record<string, JSX.Element> = {
  // ── Berserker ──────────────────────────────────────────────────────────
  // Bearded war axe — broad crescent blade on a long haft.
  'axe': (
    <>
      <rect x="11.4" y="4" width="2.2" height="18" rx="1.1" transform="rotate(8 12.5 13)" />
      <path d="M12.5 3.5 C8.5 2.8 5 4.2 3 7.5 C5.5 7.2 7.5 8 9 10 C9.8 12 9.5 13.8 8.5 15.5 C13 14.5 15 11 14.5 7 C14.2 5.5 13.5 4.2 12.5 3.5 Z" />
    </>
  ),
  // Wolf howl — muzzle raised with sound arcs.
  'howl': (
    <>
      <path d="M4 20 C4 15 7 13.5 9 13 L14 8.5 C14.5 10.5 13.8 12.4 12.5 13.8 L15 14.5 C13.5 18.5 9.5 20 4 20 Z" />
      <path d="M16 9 A7 7 0 0 1 18.5 4.5 L19.8 5.8 A5.2 5.2 0 0 0 17.8 9.2 Z" />
      <path d="M19.5 12 A10.5 10.5 0 0 1 22 6.5 L23.3 7.8 A8.7 8.7 0 0 0 21.3 12.3 Z" transform="translate(-1.2 1)" />
    </>
  ),
  // Fur — three claw-mark tufts.
  'fur': (
    <>
      <path d="M6 3 C8.5 8 9.5 14 8.5 21 C6 16 5 9.5 6 3 Z" />
      <path d="M12 2.5 C14.5 8 15.5 14.5 14.5 21.5 C12 16 11 9 12 2.5 Z" />
      <path d="M18 3 C20.5 8 21.5 14 20.5 21 C18 16 17 9.5 18 3 Z" />
    </>
  ),
  // ── Pyromancer ─────────────────────────────────────────────────────────
  // Living flame.
  'ember': (
    <path
      fillRule="evenodd"
      d="M12 2 C13 6 16.5 8 17.5 12 C18.5 16.5 15.5 21 12 21 C8.5 21 5.5 16.5 6.5 12 C7.2 9 9 7.5 10 5 C10.6 6.8 10.4 8.2 9.8 9.8 C11 9.2 11.8 7.5 12 2 Z M12 12 C10.8 13.6 10.2 14.8 10.2 16.2 A1.9 1.9 0 0 0 13.8 16.2 C13.8 14.8 13.2 13.6 12 12 Z"
    />
  ),
  // Ash — settling mound with drifting specks.
  'ash': (
    <>
      <path d="M3.5 20.5 C7 16.5 17 16.5 20.5 20.5 Z" />
      <circle cx="8" cy="12" r="1.5" />
      <circle cx="13" cy="8" r="1.7" />
      <circle cx="17" cy="13" r="1.3" />
      <circle cx="11" cy="4" r="1.1" />
    </>
  ),
  // Magma — volcano with a molten fissure.
  'magma': (
    <path
      fillRule="evenodd"
      d="M12 3.5 L22 20.5 L2 20.5 Z M12 7 L11 10.5 L13 13 L11 15.5 L12.5 18 L11.8 20.5 L13.8 20.5 L13 17.8 L14.5 15.2 L12.5 12.8 L13.8 10.2 Z"
    />
  ),
  // Ruin — a shattered diamond, split through the heart.
  'ruin': (
    <>
      <path d="M11 3 L4 12 L10 19.5 C9 16 9.2 8.5 11 3 Z" />
      <path d="M13.5 3.5 L20 12 L13 20.8 C15 15.5 15.2 9 13.5 3.5 Z" />
      <path d="M12.2 5 C10.8 9.5 10.7 15 11.8 19 L12.8 17 L12 14 L13 11 L12 8.5 Z" />
    </>
  ),
  // ── Lightbearer ────────────────────────────────────────────────────────
  // Dawn — sun cresting the horizon.
  'dawn': (
    <>
      <path d="M7 15 A5 5 0 0 1 17 15 Z" />
      <rect x="3" y="16.5" width="18" height="2" rx="1" />
      <rect x="11" y="3" width="2" height="4" rx="1" />
      <rect x="4.6" y="6.4" width="2" height="4" rx="1" transform="rotate(-45 5.6 8.4)" />
      <rect x="17.4" y="6.4" width="2" height="4" rx="1" transform="rotate(45 18.4 8.4)" />
    </>
  ),
  // Sun — full radiance.
  'sun': (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <g>
        <rect x="11.1" y="2" width="1.8" height="3.6" rx="0.9" />
        <rect x="11.1" y="18.4" width="1.8" height="3.6" rx="0.9" />
        <rect x="2" y="11.1" width="3.6" height="1.8" rx="0.9" />
        <rect x="18.4" y="11.1" width="3.6" height="1.8" rx="0.9" />
        <rect x="11.1" y="2" width="1.8" height="3.6" rx="0.9" transform="rotate(45 12 12)" />
        <rect x="11.1" y="18.4" width="1.8" height="3.6" rx="0.9" transform="rotate(45 12 12)" />
        <rect x="2" y="11.1" width="3.6" height="1.8" rx="0.9" transform="rotate(45 12 12)" />
        <rect x="18.4" y="11.1" width="3.6" height="1.8" rx="0.9" transform="rotate(45 12 12)" />
      </g>
    </>
  ),
  // Sword — point-down blade of judgment.
  'sword': (
    <>
      <path d="M12 2 L14.2 4.5 L14.2 13 L12 15.5 L9.8 13 L9.8 4.5 Z" />
      <rect x="6.5" y="15" width="11" height="2" rx="1" />
      <rect x="11" y="17" width="2" height="4.5" rx="1" />
      <circle cx="12" cy="22" r="1.2" />
    </>
  ),
  // Zenith — the apex star.
  'zenith': (
    <path d="M12 1.5 C13 7.5 16.5 11 22.5 12 C16.5 13 13 16.5 12 22.5 C11 16.5 7.5 13 1.5 12 C7.5 11 11 7.5 12 1.5 Z" />
  ),
}

export function Sigil({ symbol, size = 12, className }: SigilProps): JSX.Element {
  const bare = symbol.includes(':') ? symbol.split(':').pop()! : symbol
  const path = PATHS[bare]
  if (!path) {
    // Unknown symbol — legible letter fallback.
    return <span className={className}>{bare.charAt(0).toUpperCase()}</span>
  }
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {path}
    </svg>
  )
}

export default Sigil

/**
 * Card illustration registry — one hand-built vector scene per card id.
 *
 * System:
 *   - Every scene composes on a 96×64 stage: palette wash background
 *     (gradient, unique id per mounted instance via useId) → motif drawn
 *     in flat palette colors + opacity layering (no ids → no collisions
 *     with six cards mounted in a hand at once) → soft vignette.
 *   - The palette comes from the card's hero prefix; generic cards use
 *     the gold identity.
 *
 * Bible reference: Part 2.9 (card anatomy), Part 1 (art direction).
 */

import { useId } from 'react'
import { HERO_PALETTE } from './heroArt'

interface Pal { bright: string; base: string; deep: string; pale: string; night: string }

const GOLD: Pal = { bright: '#f0c668', base: '#d4a548', deep: '#443418', pale: '#ffe09a', night: '#12100a' }

function paletteFor(cardId: string): Pal {
  const prefix = cardId.split('/')[0]
  if (prefix === 'berserker' || prefix === 'pyromancer' || prefix === 'lightbearer') {
    return HERO_PALETTE[prefix]
  }
  return GOLD
}

// ---------------------------------------------------------------------------
// Motifs — one scene per card id, drawn on a 96×64 stage.
// ---------------------------------------------------------------------------

type Motif = (P: Pal) => JSX.Element

const MOTIFS: Record<string, Motif> = {
  // ── Generic ──────────────────────────────────────────────────────────────
  'generic/bandage': P => (
    <g>
      <path d="M30 44 C 34 30 44 22 58 20 L 66 26 C 52 28 42 36 38 48 Z" fill="#7a6a4c" />
      {/* wrapping */}
      <g fill={P.pale} opacity="0.9">
        <path d="M40 34 L 52 26 L 55 30 L 43 38 Z" /><path d="M46 40 L 58 32 L 61 36 L 49 44 Z" />
        <path d="M34 44 L 46 36 L 49 40 L 37 48 Z" />
      </g>
      <g stroke={P.deep} strokeWidth="0.8" opacity="0.6">
        <path d="M40 34 L 43 38" /><path d="M46 40 L 49 44" />
      </g>
      <circle cx="64" cy="22" r="6" fill={P.bright} opacity="0.25" />
      <path d="M62 22 L 66 22 M 64 20 L 64 24" stroke={P.bright} strokeWidth="1.6" />
    </g>
  ),
  'generic/battle-plan': P => (
    <g>
      <path d="M18 16 L 78 12 L 80 48 L 20 52 Z" fill="#c9b98a" />
      <path d="M18 16 L 20 52 L 14 50 L 13 18 Z" fill="#a08850" />
      <path d="M78 12 L 80 48 L 86 46 L 84 14 Z" fill="#a08850" />
      <path d="M28 40 Q 40 24 54 34 T 72 24" fill="none" stroke={P.deep} strokeWidth="1.4" strokeDasharray="3 2" />
      <path d="M69 21 L 75 27 M 75 21 L 69 27" stroke="#8a2a1a" strokeWidth="1.8" />
      <circle cx="28" cy="40" r="2.4" fill={P.deep} />
      <path d="M40 20 L 44 24 M 56 42 L 60 46" stroke={P.deep} strokeWidth="1" opacity="0.5" />
    </g>
  ),
  'generic/cleanse': P => (
    <g>
      <path d="M48 10 C 42 20 36 26 36 36 A 12 12 0 0 0 60 36 C 60 26 54 20 48 10 Z" fill={P.bright} opacity="0.85" />
      <path d="M48 18 C 45 24 42 28 42 34 A 6 6 0 0 0 51 39 C 47 36 46 28 48 18 Z" fill={P.pale} opacity="0.8" />
      <g fill={P.night} opacity="0.55">
        <circle cx="24" cy="48" r="2.2" /><circle cx="34" cy="54" r="1.6" /><circle cx="66" cy="52" r="2" /><circle cx="76" cy="46" r="1.4" />
      </g>
      <g fill={P.pale}>
        <circle cx="28" cy="30" r="1.4" opacity="0.7" /><circle cx="70" cy="26" r="1.2" opacity="0.6" /><circle cx="62" cy="14" r="1" opacity="0.5" />
      </g>
    </g>
  ),
  'generic/focus': P => (
    <g>
      <ellipse cx="48" cy="32" rx="24" ry="14" fill="none" stroke={P.base} strokeWidth="1.6" />
      <circle cx="48" cy="32" r="8" fill={P.deep} />
      <circle cx="48" cy="32" r="4.5" fill={P.bright} />
      <circle cx="46.5" cy="30.5" r="1.4" fill={P.pale} />
      <g stroke={P.base} strokeWidth="1" opacity="0.6">
        <path d="M48 8 L 48 14" /><path d="M48 50 L 48 56" /><path d="M14 32 L 20 32" /><path d="M76 32 L 82 32" />
        <path d="M26 14 L 30 18" /><path d="M70 50 L 66 46" /><path d="M70 14 L 66 18" /><path d="M26 50 L 30 46" />
      </g>
    </g>
  ),
  'generic/quick-draw': P => (
    <g>
      <g transform="rotate(-14 44 40)"><rect x="30" y="18" width="22" height="32" rx="3" fill="#2a2440" stroke={P.deep} strokeWidth="1" /></g>
      <g transform="rotate(2 50 40)"><rect x="38" y="15" width="22" height="32" rx="3" fill="#332a4e" stroke={P.base} strokeWidth="1" /></g>
      <g transform="rotate(18 58 40)"><rect x="46" y="13" width="22" height="32" rx="3" fill="#3d3260" stroke={P.bright} strokeWidth="1.2" /><path d="M52 22 l 5 7 l -5 7 l -5 -7 Z" fill={P.bright} opacity="0.85" transform="translate(5 0)" /></g>
      <path d="M20 20 Q 30 12 44 10" fill="none" stroke={P.pale} strokeWidth="1.2" opacity="0.55" />
      <path d="M16 28 Q 26 20 38 17" fill="none" stroke={P.pale} strokeWidth="1" opacity="0.35" />
    </g>
  ),
  'generic/resolve': P => (
    <g>
      <rect x="44" y="10" width="3" height="42" fill="#5a4a2c" />
      <path d="M47 12 L 78 16 L 70 24 L 78 32 L 47 36 Z" fill={P.base} />
      <path d="M47 12 L 78 16 L 70 24 L 47 22 Z" fill={P.bright} opacity="0.8" />
      <path d="M47 36 Q 40 44 42 52" fill="none" stroke={P.deep} strokeWidth="1.2" opacity="0.6" />
      <circle cx="45.5" cy="10" r="2.4" fill={P.pale} />
      <g stroke={P.pale} strokeWidth="0.9" opacity="0.4"><path d="M24 20 Q 30 22 34 20" /><path d="M20 30 Q 28 33 34 30" /></g>
    </g>
  ),
  'generic/second-wind': P => (
    <g>
      <path d="M14 40 Q 34 32 44 36 Q 58 42 74 32" fill="none" stroke={P.bright} strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
      <path d="M20 28 Q 38 20 50 26 Q 62 32 80 24" fill="none" stroke={P.base} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
      <path d="M28 50 Q 44 44 56 48 Q 66 52 78 46" fill="none" stroke={P.base} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      <path d="M62 22 C 66 14 74 12 80 14 C 74 16 70 20 68 26 Z" fill={P.pale} opacity="0.85" />
      <circle cx="46" cy="34" r="2" fill={P.pale} opacity="0.9" />
      <circle cx="60" cy="30" r="1.4" fill={P.pale} opacity="0.6" />
    </g>
  ),

  // ── Berserker (frost) ────────────────────────────────────────────────────
  'berserker/ancestral-spirits': P => (
    <g>
      {/* campfire */}
      <path d="M44 56 L 52 56 M 42 58 L 54 58" stroke="#3a2a1c" strokeWidth="2" />
      <path d="M48 42 C 45 47 44 50 44 52 A 4 4 0 0 0 52 52 C 52 50 51 47 48 42 Z" fill={P.bright} opacity="0.95" />
      <path d="M48 47 C 47 49 46.5 50 46.5 51.5 A 1.6 1.6 0 0 0 49.5 51.5 C 49.5 50 49 49 48 47 Z" fill="#eaf6ff" />
      <circle cx="48" cy="50" r="9" fill={P.bright} opacity="0.18" />
      {/* ghost-wolf head, left — ears, brow, snout profile facing in */}
      <g fill={P.pale} opacity="0.4">
        <path d="M14 34 C 14 26 18 20 25 18 L 24 12 L 30 16 L 36 14 L 33 20 C 37 24 38 30 35 36 C 30 33 26 33 22 36 C 19 36 16 35 14 34 Z" />
      </g>
      <circle cx="27" cy="24" r="1.3" fill="#eaf6ff" opacity="0.95" />
      {/* ghost-wolf head, right (mirrored) */}
      <g fill={P.pale} opacity="0.32">
        <path d="M82 34 C 82 26 78 20 71 18 L 72 12 L 66 16 L 60 14 L 63 20 C 59 24 58 30 61 36 C 66 33 70 33 74 36 C 77 36 80 35 82 34 Z" />
      </g>
      <circle cx="69" cy="24" r="1.3" fill="#eaf6ff" opacity="0.9" />
      {/* spirit wisps rising into them */}
      <path d="M44 44 Q 36 36 30 32 M 52 44 Q 60 36 66 32" stroke={P.pale} strokeWidth="0.9" fill="none" opacity="0.35" />
    </g>
  ),
  'berserker/berserker-rage': P => (
    <g>
      {/* roaring wolf head, profile facing right, jaws open */}
      <path d="M20 30 C 20 20 28 14 38 14 L 36 6 L 44 12 C 52 12 60 16 66 24 L 56 26 L 62 30
               C 58 31 53 31 48 30 L 46 34 C 52 36 58 38 64 44 L 52 42 L 44 40
               C 36 40 28 38 24 34 Z" fill="#2c405c" />
      {/* upper fangs */}
      <g fill={P.pale}>
        <path d="M50 30 l 2 5 l 2.4 -5 Z" /><path d="M57 30.5 l 1.8 4.4 l 2.2 -4 Z" />
      </g>
      {/* lower fangs */}
      <g fill={P.pale} opacity="0.9">
        <path d="M49 36 l 2.2 -4 l 2.2 4.6 Z" transform="translate(2 3)" />
      </g>
      <circle cx="36" cy="24" r="2.2" fill={P.bright} />
      <circle cx="36" cy="24" r="4.4" fill={P.bright} opacity="0.25" />
      {/* breath / roar burst */}
      <g stroke={P.bright} strokeWidth="1.5" opacity="0.8" fill="none">
        <path d="M70 26 L 84 20" /><path d="M70 34 L 86 34" /><path d="M68 42 L 82 48" />
      </g>
    </g>
  ),
  'berserker/bloodbound': P => (
    <g>
      <path d="M16 40 C 26 32 36 30 46 32 L 46 40 C 36 38 28 40 20 46 Z" fill="#33506e" />
      <path d="M80 40 C 70 32 60 30 50 32 L 50 40 C 60 38 68 40 76 46 Z" fill="#22344c" />
      <g stroke="#a83232" strokeWidth="2" fill="none">
        <path d="M40 30 Q 48 26 56 30" /><path d="M40 36 Q 48 40 56 36" /><path d="M40 30 L 40 36 M 56 30 L 56 36" />
      </g>
      <path d="M48 42 C 47 46 45 48 45 51 A 3 3 0 0 0 51 51 C 51 48 49 46 48 42 Z" fill="#c03030" />
      <circle cx="48" cy="28" r="8" fill={P.bright} opacity="0.15" />
    </g>
  ),
  'berserker/cleave-mastery': P => (
    <g>
      <path d="M40 18 L 56 18 L 60 54 L 36 54 Z" fill="#3a4a60" />
      <path d="M47 18 L 49 18 L 53 54 L 43 54 Z" fill={P.night} />
      <g transform="rotate(-30 48 26)">
        <rect x="46" y="4" width="3.6" height="34" rx="1.8" fill="#2a2018" />
        <path d="M48 6 C 36 5 28 10 24 20 C 32 18 39 20 43 27 L 46 20 Z" fill="#56718e" stroke={P.deep} strokeWidth="0.8" />
      </g>
      <g stroke={P.bright} strokeWidth="1.2" opacity="0.85">
        <path d="M44 30 L 36 40" /><path d="M52 30 L 60 42" /><path d="M48 32 L 48 44" />
      </g>
      <circle cx="48" cy="26" r="5" fill={P.pale} opacity="0.35" />
    </g>
  ),
  'berserker/counterstrike': P => (
    <g>
      <g transform="rotate(40 60 30)"><rect x="58" y="6" width="3" height="34" fill="#8a93a3" /><path d="M58 6 L 61 6 L 59.5 0 Z" fill="#b8c0cc" /></g>
      <g transform="rotate(-35 40 34)">
        <rect x="38" y="16" width="3.4" height="30" rx="1.6" fill="#2a2018" />
        <path d="M40 18 C 30 17 24 22 21 30 C 28 28 34 30 37 36 L 39 30 Z" fill="#56718e" />
      </g>
      <g fill={P.pale}>
        <path d="M50 26 L 53 20 L 54 27 L 60 24 L 55 30 L 61 32 L 54 33 L 56 40 L 50 34 L 46 39 L 47 32 L 41 31 L 47 29 Z" opacity="0.95" />
      </g>
      <circle cx="51" cy="30" r="8" fill={P.bright} opacity="0.3" />
    </g>
  ),
  'berserker/hunters-mark': P => (
    <g>
      {/* antlered stag skull, hollow-eyed */}
      <g stroke="#8a93a3" strokeWidth="2" fill="none" opacity="0.9">
        <path d="M40 20 C 33 16 30 10 31 4 M 40 20 C 36 16 33 13 32 9 M 40 20 C 38 14 38 9 40 5" />
        <path d="M56 20 C 63 16 66 10 65 4 M 56 20 C 60 16 63 13 64 9 M 56 20 C 58 14 58 9 56 5" />
      </g>
      <path d="M40 20 L 56 20 L 54 34 L 51 42 L 45 42 L 42 34 Z" fill="#9aa4b2" />
      <path d="M45 42 L 48 48 L 51 42 Z" fill="#7a8492" />
      <path d="M42 27 a 2.6 2.6 0 1 0 5.2 0 a 2.6 2.6 0 1 0 -5.2 0" fill={P.night} />
      <path d="M48.8 27 a 2.6 2.6 0 1 0 5.2 0 a 2.6 2.6 0 1 0 -5.2 0" fill={P.night} />
      <circle cx="44.6" cy="27" r="0.9" fill={P.bright} />
      <circle cx="51.4" cy="27" r="0.9" fill={P.bright} />
      {/* glowing mark rune floating beside */}
      <circle cx="74" cy="40" r="8" fill="none" stroke={P.bright} strokeWidth="1.3" opacity="0.9" />
      <path d="M74 34 L 74 46 M 68 40 L 80 40" stroke={P.bright} strokeWidth="1.1" opacity="0.9" />
      <circle cx="74" cy="40" r="10.5" fill={P.bright} opacity="0.12" />
    </g>
  ),
  'berserker/iron-focus': P => (
    <g>
      <rect x="38" y="22" width="20" height="20" rx="4" fill="#e8edf4" transform="rotate(8 48 32)" />
      <g transform="rotate(8 48 32)" fill={P.deep}>
        <circle cx="43" cy="27" r="2" /><circle cx="53" cy="27" r="2" /><circle cx="43" cy="37" r="2" /><circle cx="53" cy="37" r="2" /><circle cx="48" cy="32" r="2" />
      </g>
      <path d="M48 6 L 48 16 M 44 12 L 48 16 L 52 12" stroke={P.bright} strokeWidth="1.6" fill="none" />
      <path d="M24 52 C 30 44 38 42 44 44 L 40 48 L 46 48 L 42 52 Z" fill="#33506e" />
      <path d="M72 52 C 66 44 58 42 52 44 L 56 48 L 50 48 L 54 52 Z" fill="#22344c" />
      <circle cx="48" cy="32" r="15" fill={P.bright} opacity="0.12" />
    </g>
  ),
  'berserker/iron-will': P => (
    <g>
      <path d="M28 40 L 68 40 L 62 50 L 34 50 Z" fill="#2a2f38" />
      <path d="M36 40 L 60 40 L 60 34 C 60 30 56 28 48 28 C 40 28 36 30 36 34 Z" fill="#3a4148" />
      <g stroke="#8a93a3" strokeWidth="2.6" fill="none">
        <ellipse cx="34" cy="20" rx="5" ry="3.6" /><ellipse cx="46" cy="18" rx="5" ry="3.6" /><ellipse cx="58" cy="20" rx="5" ry="3.6" />
      </g>
      <circle cx="46" cy="18" r="7" fill={P.bright} opacity="0.2" />
      <g stroke={P.pale} strokeWidth="0.9" opacity="0.5"><path d="M30 46 L 66 46" /></g>
    </g>
  ),
  'berserker/last-stand': P => (
    <g>
      <circle cx="66" cy="20" r="13" fill={P.pale} opacity="0.85" />
      <circle cx="62" cy="18" r="12" fill="#16233a" opacity="0.5" />
      <path d="M10 56 L 34 40 L 52 46 L 74 38 L 86 56 Z" fill="#101a2c" />
      <path d="M34 40 L 34 20 L 44 26 L 34 30 Z" fill="#33506e" />
      <rect x="33" y="20" width="1.8" height="24" fill="#56718e" />
      <path d="M30 44 L 34 34 L 38 44 Z" fill="#22344c" />
      <g fill={P.pale}><circle cx="20" cy="14" r="0.9" opacity="0.6" /><circle cx="46" cy="10" r="0.8" opacity="0.5" /><circle cx="84" cy="26" r="1" opacity="0.5" /></g>
    </g>
  ),
  'berserker/northern-storm': P => (
    <g>
      <path d="M22 54 L 44 18 L 58 38 L 68 26 L 84 54 Z" fill="#1c2b42" />
      <path d="M44 18 L 50 28 L 44 30 L 40 26 Z" fill={P.pale} opacity="0.9" />
      <path d="M68 26 L 72 33 L 66 33 Z" fill={P.pale} opacity="0.7" />
      <g stroke={P.bright} strokeWidth="1.4" fill="none" opacity="0.7">
        <path d="M10 22 Q 26 14 42 20" /><path d="M8 34 Q 30 24 54 30" /><path d="M52 14 Q 68 8 86 14" />
      </g>
      <g fill={P.pale}><circle cx="18" cy="28" r="1.2" opacity="0.8" /><circle cx="34" cy="16" r="1" opacity="0.7" /><circle cx="74" cy="20" r="1.2" opacity="0.6" /><circle cx="60" cy="10" r="0.9" opacity="0.5" /></g>
    </g>
  ),
  'berserker/pelt-of-the-wolf': P => (
    <g>
      <circle cx="78" cy="14" r="8" fill={P.pale} opacity="0.6" />
      {/* wolf-head hood, front-facing: ears, brow, snout */}
      <path d="M38 22 L 34 10 L 43 16 L 48 12 L 53 16 L 62 10 L 58 22 C 60 26 60 30 57 33 L 39 33 C 36 30 36 26 38 22 Z"
        fill="#4a5f7c" />
      <path d="M44 26 L 48 33 L 52 26 Z" fill="#2c405c" />
      <circle cx="43" cy="24" r="1.6" fill={P.bright} />
      <circle cx="53" cy="24" r="1.6" fill={P.bright} />
      {/* pelt draped down as a cloak, jagged fur hem */}
      <path d="M39 33 L 30 38 C 27 44 27 50 29 56 L 34 50 L 36 57 L 41 49 L 44 56 L 48 48 L 52 56 L 55 49 L 60 57 L 62 50 L 67 56 C 69 50 69 44 66 38 L 57 33 Z"
        fill="#33506e" />
      <g stroke={P.pale} strokeWidth="0.8" opacity="0.4">
        <path d="M36 40 L 35 48" /><path d="M48 38 L 48 46" /><path d="M60 40 L 61 48" />
      </g>
    </g>
  ),
  'berserker/twin-strike': P => (
    <g>
      <path d="M18 14 C 40 22 58 36 72 54 L 64 56 C 50 40 34 28 14 20 Z" fill={P.bright} opacity="0.8" />
      <path d="M30 8 C 52 16 68 30 82 46 L 76 50 C 62 34 48 22 26 14 Z" fill={P.pale} opacity="0.55" />
      <path d="M70 50 L 78 54 L 72 58 Z" fill={P.pale} />
      <path d="M80 42 L 86 46 L 82 50 Z" fill={P.pale} opacity="0.8" />
      <g stroke={P.base} strokeWidth="0.8" opacity="0.4"><path d="M22 30 L 30 36" /><path d="M40 40 L 48 46" /></g>
    </g>
  ),
  'berserker/war-cry': P => (
    <g>
      <path d="M22 40 C 22 30 30 24 40 26 L 44 34 C 50 32 58 34 62 40 L 58 48 C 48 44 34 44 26 48 Z" fill="#8a7450" />
      <path d="M22 40 C 20 36 20 32 22 30 L 28 34 Z" fill="#6e5a3c" />
      <circle cx="60" cy="40" r="3" fill={P.night} />
      <g stroke={P.bright} strokeWidth="1.6" fill="none">
        <path d="M66 34 A 10 10 0 0 1 66 46" opacity="0.9" />
        <path d="M71 29 A 17 17 0 0 1 71 51" opacity="0.6" />
        <path d="M76 24 A 24 24 0 0 1 76 56" opacity="0.35" />
      </g>
    </g>
  ),
  'berserker/wolfborn': P => (
    <g>
      <circle cx="30" cy="16" r="10" fill={P.pale} opacity="0.8" />
      <path d="M14 56 L 40 48 L 60 52 L 86 44 L 86 60 L 14 60 Z" fill="#101a2c" />
      <path d="M58 50 L 60 34 C 64 30 68 28 70 22 C 72 26 72 30 70 34 L 76 32 C 74 40 68 44 64 46 L 66 52 Z" fill="#1c2b42" />
      <path d="M70 22 L 72 16 L 74 24 Z" fill="#1c2b42" />
      <g fill={P.pale}><circle cx="52" cy="12" r="0.9" opacity="0.6" /><circle cx="80" cy="18" r="1" opacity="0.5" /></g>
    </g>
  ),

  // ── Pyromancer (ember) ───────────────────────────────────────────────────
  'pyromancer/char': P => (
    <g>
      <path d="M40 54 L 42 30 L 38 26 L 44 24 L 43 16 L 50 24 L 56 20 L 54 28 L 58 32 L 52 34 L 54 54 Z" fill="#1a0d0a" />
      <g stroke={P.bright} strokeWidth="1" opacity="0.85" fill="none">
        <path d="M45 50 L 46 36" /><path d="M50 52 L 49 40" /><path d="M47 32 L 48 26" />
      </g>
      <circle cx="47" cy="42" r="7" fill={P.bright} opacity="0.15" />
      <g fill={P.bright}><circle cx="60" cy="24" r="1.1" opacity="0.7" /><circle cx="36" cy="18" r="0.9" opacity="0.5" /><circle cx="66" cy="40" r="1" opacity="0.4" /></g>
      <ellipse cx="47" cy="56" rx="14" ry="3" fill="#0d0605" />
    </g>
  ),
  'pyromancer/crater-heart': P => (
    <g>
      <path d="M14 56 L 30 30 L 42 38 L 54 38 L 66 30 L 82 56 Z" fill="#241010" />
      <path d="M42 38 L 48 30 L 54 38 Z" fill="#3a1a12" />
      <path d="M48 34 C 44 38 42 42 42 46 C 42 51 45 54 48 54 C 51 54 54 51 54 46 C 54 42 52 38 48 34 Z" fill={P.bright} opacity="0.9" />
      <path d="M48 40 C 46 43 45 45 45 47 C 45 50 46 51 48 51 C 50 51 51 50 51 47 C 51 45 50 43 48 40 Z" fill="#ffd9a0" />
      <g stroke={P.base} strokeWidth="1" opacity="0.7" fill="none">
        <path d="M42 46 Q 34 48 28 54" /><path d="M54 46 Q 62 48 68 54" />
      </g>
    </g>
  ),
  'pyromancer/crater-wind': P => (
    <g>
      <path d="M30 54 C 26 44 28 34 36 28 C 32 38 34 46 40 54 Z" fill={P.base} opacity="0.8" />
      <path d="M44 54 C 40 42 44 30 54 24 C 48 34 48 44 54 54 Z" fill={P.bright} opacity="0.85" />
      <g stroke="#9a8a7a" strokeWidth="1.6" fill="none" opacity="0.7">
        <path d="M18 24 Q 40 16 64 22 Q 76 25 84 20" /><path d="M14 34 Q 36 26 58 32 Q 72 36 84 30" />
      </g>
      <g fill="#c9b9a9"><circle cx="70" cy="18" r="1.2" opacity="0.7" /><circle cx="78" cy="28" r="1" opacity="0.6" /><circle cx="26" cy="20" r="0.9" opacity="0.5" /></g>
    </g>
  ),
  'pyromancer/ember-channel': P => (
    <g>
      <path d="M26 52 C 30 46 36 44 42 46 L 40 50 L 46 49 L 44 54 Z" fill="#3a1a12" />
      <path d="M70 52 C 66 46 60 44 54 46 L 56 50 L 50 49 L 52 54 Z" fill="#2c120c" />
      <g fill={P.bright}>
        <circle cx="48" cy="42" r="2.2" opacity="0.95" /><circle cx="46" cy="34" r="1.8" opacity="0.85" />
        <circle cx="50" cy="27" r="1.5" opacity="0.75" /><circle cx="47" cy="20" r="1.2" opacity="0.6" /><circle cx="50" cy="13" r="1" opacity="0.45" />
      </g>
      <path d="M44 46 Q 48 30 48 12" fill="none" stroke={P.base} strokeWidth="1" opacity="0.35" />
      <path d="M52 46 Q 49 30 50 12" fill="none" stroke={P.base} strokeWidth="0.8" opacity="0.25" />
    </g>
  ),
  'pyromancer/ember-strike-mastery': P => (
    <g>
      <circle cx="48" cy="24" r="9" fill={P.bright} />
      <circle cx="48" cy="24" r="5" fill="#ffd9a0" />
      <path d="M40 18 Q 30 8 20 6 M 44 14 Q 40 6 34 2 M 56 18 Q 64 10 74 8" stroke={P.base} strokeWidth="1.6" fill="none" opacity="0.7" />
      <path d="M14 54 L 82 54 L 78 48 L 60 50 L 54 42 L 42 42 L 36 50 L 18 48 Z" fill="#241010" />
      <g stroke={P.bright} strokeWidth="1.1" opacity="0.8" fill="none">
        <path d="M48 33 L 48 42" /><path d="M42 36 L 34 46" /><path d="M54 36 L 62 46" />
      </g>
    </g>
  ),
  'pyromancer/final-heat': P => (
    <g>
      <rect x="44" y="34" width="8" height="16" rx="2" fill="#d8cbb0" />
      <path d="M44 50 L 52 50 L 54 54 L 42 54 Z" fill="#8a7a60" />
      <path d="M48 18 C 45 24 43 27 43 30 A 5 5 0 0 0 53 30 C 53 27 51 24 48 18 Z" fill={P.bright} />
      <path d="M48 24 C 47 27 46 28 46 30 A 2 2 0 0 0 50 30 C 50 28 49 27 48 24 Z" fill="#ffe9c0" />
      <circle cx="48" cy="27" r="12" fill={P.bright} opacity="0.18" />
      <circle cx="48" cy="27" r="20" fill={P.base} opacity="0.08" />
      <path d="M46 34 Q 44 32 44 30 M 52 33 Q 53 31 52 29" stroke="#9a8a7a" strokeWidth="0.7" opacity="0.6" fill="none" />
    </g>
  ),
  'pyromancer/forge': P => (
    <g>
      <path d="M26 42 L 70 42 L 64 52 L 32 52 Z" fill="#2a2024" />
      <path d="M34 42 L 62 42 L 62 36 C 62 32 57 30 48 30 C 39 30 34 32 34 36 Z" fill="#3a2e30" />
      <path d="M48 30 L 60 30 L 60 34 L 48 34 Z" fill={P.bright} opacity="0.55" />
      <g transform="rotate(-38 66 20)"><rect x="64" y="6" width="4" height="22" rx="2" fill="#4a3626" /><rect x="58" y="2" width="16" height="9" rx="2" fill="#5a5a64" /></g>
      <g fill={P.bright}>
        <path d="M44 26 l 1.4 -5 l 1.4 5 Z" /><path d="M52 24 l 1.2 -4 l 1.2 4 Z" /><circle cx="40" cy="22" r="1" /><circle cx="58" cy="20" r="1.1" />
      </g>
    </g>
  ),
  'pyromancer/mountains-patience': P => (
    <g>
      <path d="M14 54 L 40 20 L 58 40 L 70 28 L 86 54 Z" fill="#20100e" />
      <path d="M40 20 L 46 28 L 40 30 L 36 26 Z" fill="#3a1a12" />
      <path d="M40 20 Q 42 12 40 6" fill="none" stroke="#8a7a72" strokeWidth="1.4" opacity="0.6" />
      <path d="M40 14 Q 44 10 43 4" fill="none" stroke="#8a7a72" strokeWidth="1" opacity="0.4" />
      <g fill={P.pale}><circle cx="18" cy="14" r="0.9" opacity="0.6" /><circle cx="60" cy="10" r="0.8" opacity="0.5" /><circle cx="78" cy="18" r="1" opacity="0.5" /><circle cx="30" cy="8" r="0.7" opacity="0.4" /></g>
      <path d="M38 28 L 42 30" stroke={P.bright} strokeWidth="0.9" opacity="0.7" />
    </g>
  ),
  'pyromancer/phoenix-form': P => (
    <g>
      <path d="M48 16 C 46 24 44 30 44 36 L 52 36 C 52 30 50 24 48 16 Z" fill="#ffd9a0" />
      <path d="M44 30 C 34 26 24 28 16 36 C 26 34 34 37 40 42 Z" fill={P.bright} opacity="0.9" />
      <path d="M52 30 C 62 26 72 28 80 36 C 70 34 62 37 56 42 Z" fill={P.bright} opacity="0.9" />
      <path d="M42 34 C 34 34 28 38 24 44 C 32 42 38 44 42 48 Z" fill={P.base} opacity="0.8" />
      <path d="M54 34 C 62 34 68 38 72 44 C 64 42 58 44 54 48 Z" fill={P.base} opacity="0.8" />
      <path d="M46 36 L 48 56 L 50 36 Z" fill={P.base} opacity="0.9" />
      <path d="M48 12 L 46 17 L 50 17 Z" fill="#ffd9a0" />
      <circle cx="48" cy="20" r="2.6" fill="#ffedc2" />
      <circle cx="48" cy="30" r="16" fill={P.bright} opacity="0.12" />
    </g>
  ),
  'pyromancer/phoenix-stir': P => (
    <g>
      <path d="M30 50 C 30 42 38 38 48 38 C 58 38 66 42 66 50 Z" fill="#2c1a12" />
      <g stroke="#4a3020" strokeWidth="1.2" fill="none" opacity="0.8">
        <path d="M32 46 L 42 42" /><path d="M64 46 L 54 42" /><path d="M40 48 L 56 44" />
      </g>
      <ellipse cx="48" cy="32" rx="10" ry="13" fill="#d8c8b0" />
      <path d="M44 24 L 48 32 L 45 38 L 51 30 L 48 26" fill="none" stroke={P.bright} strokeWidth="1.4" />
      <circle cx="48" cy="31" r="9" fill={P.bright} opacity="0.2" />
      <circle cx="60" cy="20" r="1" fill={P.bright} opacity="0.6" />
    </g>
  ),
  'pyromancer/phoenix-veil': P => (
    <g>
      <path d="M48 46 C 44 40 44 32 48 24 C 52 32 52 40 48 46 Z" fill="#1c1014" />
      <path d="M46 22 C 34 20 24 24 18 34 C 26 30 34 32 40 38 C 42 32 44 26 46 22 Z" fill={P.bright} opacity="0.9" />
      <path d="M50 22 C 62 20 72 24 78 34 C 70 30 62 32 56 38 C 54 32 52 26 50 22 Z" fill={P.bright} opacity="0.9" />
      <path d="M44 26 C 36 26 28 30 24 38 C 31 35 38 37 42 42 Z" fill={P.base} opacity="0.85" />
      <path d="M52 26 C 60 26 68 30 72 38 C 65 35 58 37 54 42 Z" fill={P.base} opacity="0.85" />
      <circle cx="48" cy="20" r="2.2" fill="#ffedc2" />
      <path d="M40 46 Q 48 52 56 46" fill="none" stroke={P.bright} strokeWidth="1" opacity="0.5" />
    </g>
  ),
  'pyromancer/pyromantic-surge': P => (
    <g>
      <path d="M42 56 L 40 34 C 40 24 44 16 48 10 C 52 16 56 24 56 34 L 54 56 Z" fill={P.bright} opacity="0.9" />
      <path d="M46 56 L 45 36 C 45 28 46 22 48 18 C 50 22 51 28 51 36 L 50 56 Z" fill="#ffd9a0" />
      <path d="M40 40 C 36 38 34 34 34 30 C 37 33 39 34 41 34 Z" fill={P.base} opacity="0.8" />
      <path d="M56 40 C 60 38 62 34 62 30 C 59 33 57 34 55 34 Z" fill={P.base} opacity="0.8" />
      <ellipse cx="48" cy="56" rx="12" ry="3" fill="#241010" />
      <g fill={P.bright}><circle cx="38" cy="20" r="1" opacity="0.6" /><circle cx="60" cy="16" r="1.2" opacity="0.6" /><circle cx="52" cy="8" r="0.9" opacity="0.5" /></g>
    </g>
  ),
  'pyromancer/volcanic-awakening': P => (
    <g>
      <path d="M12 56 L 34 26 L 48 34 L 62 26 L 84 56 Z" fill="#241010" />
      <path d="M34 26 L 48 20 L 62 26 L 55 32 L 48 28 L 41 32 Z" fill="#3a1a12" />
      <path d="M48 20 C 46 14 46 9 48 4 C 50 9 50 14 48 20 Z" fill={P.bright} />
      <path d="M42 22 Q 36 14 36 8 M 54 22 Q 60 14 60 8" stroke={P.bright} strokeWidth="1.6" fill="none" opacity="0.8" />
      <g stroke={P.bright} strokeWidth="1.2" opacity="0.9" fill="none">
        <path d="M44 32 Q 42 42 38 50" /><path d="M52 32 Q 54 42 58 50" />
      </g>
      <g fill="#ffd9a0"><circle cx="34" cy="10" r="1.2" /><circle cx="64" cy="12" r="1" /><circle cx="48" cy="2" r="0.9" /></g>
    </g>
  ),

  // ── Lightbearer (dawn) ───────────────────────────────────────────────────
  'lightbearer/aegis-of-dawn': P => (
    <g>
      <path d="M48 10 C 58 14 66 15 72 14 C 72 34 64 48 48 56 C 32 48 24 34 24 14 C 30 15 38 14 48 10 Z" fill="#3c3018" stroke={P.base} strokeWidth="1.4" />
      <path d="M48 14 C 56 17 62 18 67 17 C 67 33 60 44 48 51 Z" fill="#5a4820" />
      <path d="M28 30 A 20 12 0 0 1 68 30 L 62 30 A 14 8 0 0 0 34 30 Z" fill={P.bright} opacity="0.9" />
      <g stroke={P.bright} strokeWidth="1.2" opacity="0.85">
        <path d="M48 18 L 48 24" /><path d="M38 20 L 41 25" /><path d="M58 20 L 55 25" />
      </g>
      <path d="M70 8 L 62 18" stroke="#b8c0cc" strokeWidth="2" />
      <path d="M60 16 L 56 22 L 62 20 Z" fill={P.pale} />
    </g>
  ),
  'lightbearer/cathedral-light': P => (
    <g>
      <circle cx="48" cy="24" r="14" fill="none" stroke={P.base} strokeWidth="2" />
      <circle cx="48" cy="24" r="5" fill={P.bright} />
      <g stroke={P.base} strokeWidth="1.2">
        <path d="M48 10 L 48 38" /><path d="M34 24 L 62 24" /><path d="M38 14 L 58 34" /><path d="M58 14 L 38 34" />
      </g>
      <path d="M36 34 L 24 58 L 40 58 Z" fill={P.pale} opacity="0.25" />
      <path d="M48 36 L 42 58 L 54 58 Z" fill={P.pale} opacity="0.35" />
      <path d="M60 34 L 56 58 L 72 58 Z" fill={P.pale} opacity="0.25" />
    </g>
  ),
  'lightbearer/dawnblade-mastery': P => (
    <g>
      <circle cx="70" cy="18" r="10" fill={P.bright} opacity="0.9" />
      <circle cx="70" cy="18" r="16" fill={P.base} opacity="0.25" />
      <path d="M40 52 L 62 22 L 66 25 L 46 56 Z" fill="#d8dde6" />
      <path d="M62 22 L 66 25 L 68 18 Z" fill={P.pale} />
      <path d="M40 52 L 46 56 L 40 60 L 36 56 Z" fill="#8a7440" />
      <path d="M38 50 L 48 54" stroke={P.base} strokeWidth="2" />
      <path d="M58 28 L 64 32" stroke={P.pale} strokeWidth="1" opacity="0.8" />
    </g>
  ),
  'lightbearer/dawnsong': P => (
    <g>
      <path d="M40 30 C 40 22 44 18 50 18 C 56 18 60 22 60 30 L 60 40 L 40 40 Z" fill="#6a5426" />
      <path d="M46 40 L 54 40 L 52 46 L 48 46 Z" fill="#4c3c1c" />
      <circle cx="50" cy="47" r="2" fill={P.base} />
      <path d="M44 18 C 40 12 42 6 48 6 C 46 10 46 14 48 17 Z" fill={P.bright} />
      <circle cx="46" cy="9" r="1.4" fill={P.night} />
      <path d="M48 8 L 54 6 L 50 11 Z" fill={P.base} />
      <g stroke={P.bright} strokeWidth="1.2" fill="none" opacity="0.7">
        <path d="M64 20 A 8 8 0 0 1 64 32" /><path d="M69 16 A 14 14 0 0 1 69 36" opacity="0.5" />
      </g>
    </g>
  ),
  'lightbearer/faith': P => (
    <g>
      {/* praying hands: two palms together, fingertips up */}
      <path d="M46.5 20 C 43 26 41 34 41 42 C 41 48 43 52 46.5 54 L 46.5 20 Z" fill="#a08850" />
      <path d="M49.5 20 C 53 26 55 34 55 42 C 55 48 53 52 49.5 54 L 49.5 20 Z" fill="#7a6438" />
      <path d="M46.5 20 L 48 16 L 49.5 20 L 49.5 54 L 46.5 54 Z" fill="#8a7450" />
      {/* cuffs */}
      <path d="M40 52 L 56 52 L 57 58 L 39 58 Z" fill="#4c3c1c" />
      {/* rising light */}
      <g fill={P.bright}>
        <circle cx="48" cy="12" r="1.6" opacity="0.95" /><circle cx="45" cy="7" r="1.2" opacity="0.7" /><circle cx="51" cy="5" r="1" opacity="0.55" />
      </g>
      <circle cx="48" cy="26" r="16" fill={P.bright} opacity="0.10" />
      <g stroke={P.pale} strokeWidth="0.9" opacity="0.5">
        <path d="M34 26 L 38 30" /><path d="M62 26 L 58 30" /><path d="M32 38 L 37 38" /><path d="M64 38 L 59 38" />
      </g>
    </g>
  ),
  'lightbearer/resolve': P => (
    <g>
      <rect x="45" y="26" width="6" height="20" rx="1.5" fill="#e8dcc0" />
      <path d="M43 46 L 53 46 L 55 52 L 41 52 Z" fill="#8a7450" />
      <path d="M48 14 C 46 19 44 21 44 24 A 4 4 0 0 0 52 24 C 52 21 50 19 48 14 Z" fill={P.bright} />
      <g stroke="#9a8a6a" strokeWidth="1.4" fill="none" opacity="0.7">
        <path d="M24 22 Q 32 24 38 22" /><path d="M20 32 Q 30 35 38 32" /><path d="M26 42 Q 33 44 40 42" />
      </g>
      <circle cx="48" cy="21" r="9" fill={P.bright} opacity="0.2" />
    </g>
  ),
  'lightbearer/sanctuary': P => (
    <g>
      <path d="M28 54 L 28 36 C 28 26 36 18 48 18 C 60 18 68 26 68 36 L 68 54 Z" fill="#4c3c1c" />
      <path d="M48 18 L 48 10 M 44 13 L 52 13" stroke={P.bright} strokeWidth="1.8" />
      <path d="M42 54 L 42 42 C 42 38 44 36 48 36 C 52 36 54 38 54 42 L 54 54 Z" fill={P.bright} opacity="0.75" />
      <path d="M20 56 A 34 30 0 0 1 76 56" fill="none" stroke={P.pale} strokeWidth="1.2" opacity="0.5" strokeDasharray="4 3" />
      <circle cx="34" cy="30" r="2.4" fill={P.bright} opacity="0.7" />
      <circle cx="62" cy="30" r="2.4" fill={P.bright} opacity="0.7" />
    </g>
  ),
  'lightbearer/solar-devotion': P => (
    <g>
      <circle cx="48" cy="20" r="9" fill={P.bright} />
      <g stroke={P.base} strokeWidth="1.4" opacity="0.8">
        <path d="M48 6 L 48 10" /><path d="M48 30 L 48 34" /><path d="M34 20 L 38 20" /><path d="M58 20 L 62 20" />
        <path d="M38 10 L 41 13" /><path d="M58 30 L 55 27" /><path d="M58 10 L 55 13" /><path d="M38 30 L 41 27" />
      </g>
      <path d="M40 56 L 42 46 C 44 40 48 38 52 40 L 56 44 L 52 46 L 54 56 Z" fill="#5a4820" />
      <path d="M52 40 C 54 36 56 34 56 30 L 60 34 C 60 38 57 41 54 43 Z" fill="#8a7450" />
      <ellipse cx="48" cy="57" rx="16" ry="2.4" fill="#141008" />
    </g>
  ),
  'lightbearer/steady-light': P => (
    <g>
      <path d="M48 8 L 48 14" stroke="#8a7450" strokeWidth="1.6" />
      <path d="M40 14 L 56 14 L 58 20 L 38 20 Z" fill="#6a5426" />
      <path d="M38 20 L 58 20 L 55 44 L 41 44 Z" fill="#3c3018" stroke={P.base} strokeWidth="1" />
      <path d="M42 22 L 54 22 L 52 42 L 44 42 Z" fill={P.bright} opacity="0.35" />
      <path d="M48 26 C 46 30 45 32 45 34 A 3 3 0 0 0 51 34 C 51 32 50 30 48 26 Z" fill="#ffedc2" />
      <path d="M41 44 L 55 44 L 53 48 L 43 48 Z" fill="#6a5426" />
      <g stroke={P.pale} strokeWidth="1" opacity="0.5"><path d="M30 32 L 36 32" /><path d="M60 32 L 66 32" /></g>
    </g>
  ),
  'lightbearer/sunblade-mastery': P => (
    <g>
      <path d="M46 8 L 50 8 L 52 40 L 44 40 Z" fill={P.bright} />
      <path d="M47 10 L 49 10 L 50 38 L 46 38 Z" fill="#fff6d8" />
      <path d="M38 40 L 58 40 L 56 45 L 40 45 Z" fill="#8a7440" />
      <rect x="46" y="45" width="4" height="10" rx="2" fill="#6a5426" />
      <circle cx="48" cy="57" r="2" fill={P.base} />
      <g stroke={P.bright} strokeWidth="1" opacity="0.6">
        <path d="M40 16 L 34 12" /><path d="M56 16 L 62 12" /><path d="M38 26 L 32 24" /><path d="M58 26 L 64 24" />
      </g>
      <circle cx="48" cy="22" r="14" fill={P.bright} opacity="0.12" />
    </g>
  ),
  'lightbearer/sunburst': P => (
    <g>
      <path d="M12 46 L 84 46" stroke={P.deep} strokeWidth="2" />
      <path d="M28 46 A 20 20 0 0 1 68 46 Z" fill={P.bright} />
      <path d="M34 46 A 14 14 0 0 1 62 46 Z" fill="#fff2c8" />
      <g stroke={P.bright} strokeWidth="1.8" opacity="0.85">
        <path d="M48 20 L 48 12" /><path d="M30 26 L 24 20" /><path d="M66 26 L 72 20" />
        <path d="M22 38 L 14 34" /><path d="M74 38 L 82 34" />
      </g>
      <path d="M12 50 L 84 50 M 20 54 L 76 54" stroke={P.deep} strokeWidth="1" opacity="0.5" />
    </g>
  ),
  'lightbearer/vow-of-service': P => (
    <g>
      {/* solid radiant heart */}
      <path d="M48 44 C 40 38 34 32 34 25 C 34 20 38 17 42 17 C 45 17 47 19 48 21 C 49 19 51 17 54 17 C 58 17 62 20 62 25 C 62 32 56 38 48 44 Z"
        fill={P.bright} />
      <path d="M42 21 C 40 21 38 23 38 25 C 38 27 39 29 41 31 C 39 27 40 23 42 21 Z" fill="#fff6d8" />
      {/* seal ring around the heart */}
      <circle cx="48" cy="29" r="18" fill="none" stroke={P.base} strokeWidth="1.3" strokeDasharray="5 3" opacity="0.85" />
      <circle cx="48" cy="29" r="22" fill={P.bright} opacity="0.08" />
      {/* oath ribbon below */}
      <path d="M28 50 L 40 47 L 48 49 L 56 47 L 68 50 L 64 55 L 48 52 L 32 55 Z" fill="#8a7450" />
      <path d="M34 51 L 48 49.5 L 62 51" stroke="#5a4820" strokeWidth="0.9" fill="none" />
    </g>
  ),
}

export const CARD_ART_IDS = Object.keys(MOTIFS)

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface CardArtProps {
  cardId:     string
  className?: string
}

/** 96×64 illustrated scene for the card, or null when no art exists
 *  (callers keep their category-glyph fallback). */
export function CardArt({ cardId, className }: CardArtProps): JSX.Element | null {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const motif = MOTIFS[cardId]
  if (!motif) return null
  const P = paletteFor(cardId)
  const washId = `wash-${uid}`
  const vinId = `vin-${uid}`
  return (
    <svg
      viewBox="0 0 96 64"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={washId} cx="50%" cy="34%" r="80%">
          <stop offset="0%" stopColor={P.deep} />
          <stop offset="55%" stopColor={mix(P.deep, P.night)} />
          <stop offset="100%" stopColor={P.night} />
        </radialGradient>
        <radialGradient id={vinId} cx="50%" cy="50%" r="72%">
          <stop offset="62%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <rect width="96" height="64" fill={`url(#${washId})`} />
      {/* faint ambient motes for depth */}
      <g fill={P.pale}>
        <circle cx="12" cy="12" r="0.8" opacity="0.25" />
        <circle cx="86" cy="18" r="0.7" opacity="0.2" />
        <circle cx="80" cy="52" r="0.8" opacity="0.15" />
        <circle cx="10" cy="50" r="0.6" opacity="0.15" />
      </g>
      {motif(P)}
      <rect width="96" height="64" fill={`url(#${vinId})`} />
    </svg>
  )
}

/** Cheap midpoint mix of two hex colors. */
function mix(a: string, b: string): string {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const r = (((pa >> 16) & 255) + ((pb >> 16) & 255)) >> 1
  const g = (((pa >> 8) & 255) + ((pb >> 8) & 255)) >> 1
  const bl = ((pa & 255) + (pb & 255)) >> 1
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0')}`
}

export default CardArt

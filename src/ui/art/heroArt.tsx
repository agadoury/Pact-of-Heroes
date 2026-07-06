/**
 * Hero portrait + crest artwork — the game's visual identity anchors.
 *
 * Hand-built layered vector "paintings": background aura → body masses
 * (dark to light) → costume detail → face shadow with glowing eyes →
 * rim light. Faces stay shadowed/abstract on purpose — stylized reads
 * premium at every size, from the 44px strip orb to the 120px intro
 * pedestal.
 *
 * All gradient/clip ids are prefixed per hero so multiple portraits can
 * mount at once without id collisions.
 *
 * Bible reference: Part 1 (art direction), Part 2.4 (portrait orb).
 */

import type { HeroId } from '@/game/types'

export interface HeroArtProps {
  heroId:     HeroId
  size?:      number
  className?: string
}

/** Concrete palette (SVG can't read CSS vars inside gradients reliably). */
export const HERO_PALETTE: Record<HeroId, {
  bright: string; base: string; deep: string; pale: string; night: string
}> = {
  berserker:   { bright: '#6cb0e8', base: '#4a8cc8', deep: '#1a3a5a', pale: '#a8d0f0', night: '#0a0e1c' },
  pyromancer:  { bright: '#f06848', base: '#c84a2a', deep: '#6e2010', pale: '#ffb08a', night: '#160a0a' },
  lightbearer: { bright: '#fde088', base: '#fbbf24', deep: '#8a6810', pale: '#fff2c8', night: '#141008' },
}

// ---------------------------------------------------------------------------
// Berserker — wolf-pelted northman, frost element
// ---------------------------------------------------------------------------

function BerserkerPortrait(): JSX.Element {
  const P = HERO_PALETTE.berserker
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" role="img" aria-label="The Berserker">
      <defs>
        <radialGradient id="bz-bg" cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor={P.deep} />
          <stop offset="55%" stopColor="#101a2e" />
          <stop offset="100%" stopColor={P.night} />
        </radialGradient>
        <linearGradient id="bz-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2a3c54" />
          <stop offset="100%" stopColor="#141e30" />
        </linearGradient>
        <linearGradient id="bz-fur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8fb6d8" />
          <stop offset="100%" stopColor="#33506e" />
        </linearGradient>
        <radialGradient id="bz-face" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#1c2434" />
          <stop offset="100%" stopColor="#0a0e18" />
        </radialGradient>
        <radialGradient id="bz-eye" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e8f6ff" />
          <stop offset="45%" stopColor={P.bright} />
          <stop offset="100%" stopColor={P.bright} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="120" height="120" fill="url(#bz-bg)" />
      {/* aurora streak + snow */}
      <path d="M-4 30 Q 34 16 62 26 T 126 20 L 126 8 Q 70 20 34 12 T -4 18 Z" fill={P.base} opacity="0.10" />
      <g fill={P.pale}>
        <circle cx="16" cy="22" r="1.1" opacity="0.5" />
        <circle cx="102" cy="16" r="0.9" opacity="0.45" />
        <circle cx="88" cy="40" r="1.2" opacity="0.35" />
        <circle cx="26" cy="58" r="0.8" opacity="0.4" />
        <circle cx="108" cy="70" r="1.0" opacity="0.3" />
        <circle cx="12" cy="86" r="1.2" opacity="0.25" />
      </g>

      {/* axe over the right shoulder */}
      <g transform="rotate(24 92 44)">
        <rect x="90" y="8" width="4.5" height="76" rx="2" fill="#2a2018" />
        <rect x="90" y="8" width="1.6" height="76" rx="0.8" fill="#4a3a28" />
        <path d="M92 12 C 78 10 68 16 63 28 C 72 26 79 28 84 35 C 87 42 86 49 82 55 C 97 51 104 39 102 25 C 101 19 97 14 92 12 Z"
          fill="#3d4f66" stroke={P.deep} strokeWidth="1" />
        <path d="M66 26 C 73 25 79 27 83 33 C 85 37 85 42 84 46 C 90 41 92 33 88 26 C 82 21 72 22 66 26 Z" fill="#56718e" />
      </g>

      {/* shoulders + pelt */}
      <path d="M8 122 C 10 92 26 76 42 70 L 78 70 C 96 76 110 92 112 122 Z" fill="url(#bz-body)" />
      {/* fur ruff — jagged tufts along the collar */}
      <g fill="url(#bz-fur)">
        <path d="M14 122 C 16 100 24 86 36 78 L 40 88 L 46 76 L 50 88 L 55 75 L 58 86 L 60 78 L 60 122 Z" />
        <path d="M106 122 C 104 100 96 86 84 78 L 80 88 L 74 76 L 70 88 L 65 75 L 62 86 L 60 78 L 60 122 Z" opacity="0.92" />
      </g>
      <g stroke={P.pale} strokeWidth="1" opacity="0.35" fill="none">
        <path d="M30 92 L 33 80" /><path d="M42 86 L 44 74" /><path d="M90 92 L 87 80" /><path d="M78 86 L 76 74" />
      </g>

      {/* wolf-skull hood */}
      <path d="M60 18 C 44 18 36 30 36 44 C 36 52 39 58 44 62 L 76 62 C 81 58 84 52 84 44 C 84 30 76 18 60 18 Z"
        fill="#3a4a60" />
      <path d="M60 14 C 52 14 46 18 43 24 L 50 22 L 47 30 L 56 26 L 60 32 L 64 26 L 73 30 L 70 22 L 77 24 C 74 18 68 14 60 14 Z"
        fill="#56718e" />
      {/* wolf ears */}
      <path d="M40 26 L 34 12 L 46 20 Z" fill="#3a4a60" />
      <path d="M80 26 L 86 12 L 74 20 Z" fill="#3a4a60" />
      <path d="M41 24 L 37 15 L 45 20 Z" fill={P.deep} opacity="0.8" />
      <path d="M79 24 L 83 15 L 75 20 Z" fill={P.deep} opacity="0.8" />
      {/* snout above the brow */}
      <path d="M52 30 L 60 22 L 68 30 L 64 36 L 56 36 Z" fill="#6f8cab" />
      <circle cx="56.5" cy="31" r="1.4" fill={P.night} />
      <circle cx="63.5" cy="31" r="1.4" fill={P.night} />

      {/* face cavity + glowing eyes */}
      <path d="M46 40 C 46 56 51 66 60 66 C 69 66 74 56 74 40 C 70 36 66 34 60 34 C 54 34 50 36 46 40 Z" fill="url(#bz-face)" />
      <circle cx="53" cy="49" r="5" fill="url(#bz-eye)" />
      <circle cx="67" cy="49" r="5" fill="url(#bz-eye)" />
      <circle cx="53" cy="49" r="1.6" fill="#eaf6ff" />
      <circle cx="67" cy="49" r="1.6" fill="#eaf6ff" />
      {/* braided beard */}
      <path d="M54 62 L 60 78 L 66 62 C 64 64 56 64 54 62 Z" fill="#33506e" />
      <path d="M58 64 L 60 74 L 62 64" fill="none" stroke={P.deep} strokeWidth="1" opacity="0.8" />

      {/* chest strap + wolf-tooth necklace */}
      <path d="M40 122 L 74 78 L 80 84 L 50 122 Z" fill="#1c2838" />
      <g fill={P.pale} opacity="0.85">
        <path d="M50 90 l 2.4 7 l 2.4 -7 Z" /><path d="M58 96 l 2.4 7 l 2.4 -7 Z" /><path d="M66 90 l 2.4 7 l 2.4 -7 Z" />
      </g>

      {/* rim light, left edge */}
      <path d="M42 70 C 28 76 16 90 13 112" fill="none" stroke={P.pale} strokeWidth="1.6" opacity="0.5" />
      <path d="M36 44 C 36 32 42 21 52 17" fill="none" stroke={P.pale} strokeWidth="1.4" opacity="0.55" />

      {/* frost breath */}
      <ellipse cx="60" cy="70" rx="10" ry="3" fill={P.pale} opacity="0.10" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Pyromancer — hooded keeper of the mountain, ember element
// ---------------------------------------------------------------------------

function PyromancerPortrait(): JSX.Element {
  const P = HERO_PALETTE.pyromancer
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" role="img" aria-label="The Pyromancer">
      <defs>
        <radialGradient id="py-bg" cx="50%" cy="40%" r="72%">
          <stop offset="0%" stopColor="#3a1410" />
          <stop offset="55%" stopColor="#200c0c" />
          <stop offset="100%" stopColor={P.night} />
        </radialGradient>
        <linearGradient id="py-robe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a2018" />
          <stop offset="100%" stopColor="#241010" />
        </linearGradient>
        <linearGradient id="py-hood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5c2a1c" />
          <stop offset="100%" stopColor="#301410" />
        </linearGradient>
        <radialGradient id="py-face" cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="#241016" />
          <stop offset="100%" stopColor="#100608" />
        </radialGradient>
        <radialGradient id="py-eye" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffe9b0" />
          <stop offset="45%" stopColor={P.bright} />
          <stop offset="100%" stopColor={P.bright} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="py-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd9a0" />
          <stop offset="40%" stopColor={P.bright} />
          <stop offset="100%" stopColor={P.bright} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="120" height="120" fill="url(#py-bg)" />
      {/* distant caldera glow + rising embers */}
      <path d="M0 96 L 26 68 L 44 84 L 70 58 L 96 82 L 120 66 L 120 120 L 0 120 Z" fill="#1a0b0b" />
      <path d="M62 62 L 70 58 L 78 64 L 70 68 Z" fill={P.base} opacity="0.5" />
      <g fill={P.bright}>
        <circle cx="20" cy="44" r="1.2" opacity="0.55" />
        <circle cx="30" cy="24" r="0.9" opacity="0.4" />
        <circle cx="96" cy="34" r="1.3" opacity="0.5" />
        <circle cx="106" cy="56" r="0.8" opacity="0.4" />
        <circle cx="88" cy="14" r="1.0" opacity="0.35" />
        <circle cx="12" cy="66" r="1.0" opacity="0.3" />
      </g>

      {/* robed shoulders */}
      <path d="M10 122 C 13 94 28 78 44 72 L 76 72 C 92 78 107 94 110 122 Z" fill="url(#py-robe)" />
      {/* obsidian pauldrons */}
      <path d="M12 122 C 14 100 22 88 34 82 L 42 92 L 36 104 L 42 116 L 38 122 Z" fill="#1c0e0c" />
      <path d="M108 122 C 106 100 98 88 86 82 L 78 92 L 84 104 L 78 116 L 82 122 Z" fill="#1c0e0c" />
      <path d="M34 82 L 42 92 L 36 104" fill="none" stroke={P.base} strokeWidth="1.1" opacity="0.7" />
      <path d="M86 82 L 78 92 L 84 104" fill="none" stroke={P.base} strokeWidth="1.1" opacity="0.7" />

      {/* chest core — the mountain's heart */}
      <path d="M60 80 L 68 92 L 60 110 L 52 92 Z" fill="#180a0a" stroke="#3a1a12" strokeWidth="1" />
      <circle cx="60" cy="93" r="9" fill="url(#py-core)" opacity="0.9" />
      <path d="M60 86 L 63 92 L 60 100 L 57 92 Z" fill="#ffd9a0" />
      {/* molten crack lines radiating from the core */}
      <g stroke={P.bright} strokeWidth="1" fill="none" opacity="0.65">
        <path d="M54 90 Q 44 92 38 100" />
        <path d="M66 90 Q 76 92 82 100" />
        <path d="M58 102 Q 54 110 55 118" />
        <path d="M63 102 Q 67 110 66 118" />
      </g>

      {/* deep hood — bright outer rim so it separates from the dark bg */}
      <path d="M60 12 C 42 12 33 27 33 44 C 33 57 39 65 46 69 L 74 69 C 81 65 87 57 87 44 C 87 27 78 12 60 12 Z"
        fill="#8a4426" />
      <path d="M60 14 C 43 14 35 28 35 44 C 35 56 40 64 47 68 L 73 68 C 80 64 85 56 85 44 C 85 28 77 14 60 14 Z"
        fill="url(#py-hood)" />
      <path d="M60 14 C 50 14 43 20 39 30 C 45 24 52 21 60 21 C 68 21 75 24 81 30 C 77 20 70 14 60 14 Z" fill="#8a4426" />
      {/* hood cracks glowing */}
      <g stroke={P.bright} strokeWidth="0.9" fill="none" opacity="0.7">
        <path d="M42 34 Q 46 40 44 48" />
        <path d="M78 34 Q 74 40 76 48" />
        <path d="M60 16 L 60 22" />
      </g>

      {/* face shadow + ember eyes */}
      <path d="M45 38 C 44 54 50 66 60 66 C 70 66 76 54 75 38 C 71 33 66 31 60 31 C 54 31 49 33 45 38 Z" fill="url(#py-face)" />
      <circle cx="53" cy="48" r="6" fill="url(#py-eye)" />
      <circle cx="67" cy="48" r="6" fill="url(#py-eye)" />
      <circle cx="53" cy="48" r="1.9" fill="#ffedc2" />
      <circle cx="67" cy="48" r="1.9" fill="#ffedc2" />
      {/* breath of smoke */}
      <path d="M56 62 Q 60 60 64 62 Q 62 65 60 65 Q 58 65 56 62 Z" fill={P.bright} opacity="0.25" />

      {/* rim light */}
      <path d="M44 72 C 30 78 18 92 15 112" fill="none" stroke={P.pale} strokeWidth="1.5" opacity="0.45" />
      <path d="M35 44 C 35 32 41 20 51 16" fill="none" stroke={P.pale} strokeWidth="1.3" opacity="0.5" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Lightbearer — haloed paladin of the dawn, dawn element
// ---------------------------------------------------------------------------

function LightbearerPortrait(): JSX.Element {
  const P = HERO_PALETTE.lightbearer
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" role="img" aria-label="The Lightbearer">
      <defs>
        <radialGradient id="lb-bg" cx="50%" cy="34%" r="75%">
          <stop offset="0%" stopColor="#3a2c10" />
          <stop offset="50%" stopColor="#201808" />
          <stop offset="100%" stopColor={P.night} />
        </radialGradient>
        <linearGradient id="lb-armor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a7440" />
          <stop offset="100%" stopColor="#3c3018" />
        </linearGradient>
        <linearGradient id="lb-helm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8a860" />
          <stop offset="100%" stopColor="#6a5426" />
        </linearGradient>
        <radialGradient id="lb-face" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#2a2210" />
          <stop offset="100%" stopColor="#140f06" />
        </radialGradient>
        <radialGradient id="lb-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={P.pale} stopOpacity="0.9" />
          <stop offset="55%" stopColor={P.base} stopOpacity="0.35" />
          <stop offset="100%" stopColor={P.base} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lb-eye" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffbe8" />
          <stop offset="45%" stopColor={P.bright} />
          <stop offset="100%" stopColor={P.bright} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="120" height="120" fill="url(#lb-bg)" />

      {/* halo disc + spokes behind the head */}
      <circle cx="60" cy="40" r="34" fill="url(#lb-halo)" />
      <g stroke={P.bright} strokeWidth="1.4" opacity="0.55">
        <path d="M60 2 L 60 16" /><path d="M60 64 L 60 74" />
        <path d="M22 40 L 34 40" /><path d="M86 40 L 98 40" />
        <path d="M33 13 L 42 22" /><path d="M78 58 L 87 67" />
        <path d="M87 13 L 78 22" /><path d="M42 58 L 33 67" />
      </g>
      <circle cx="60" cy="40" r="25" fill="none" stroke={P.base} strokeWidth="1" opacity="0.5" />
      {/* light motes */}
      <g fill={P.pale}>
        <circle cx="24" cy="70" r="1.1" opacity="0.6" />
        <circle cx="98" cy="62" r="1.3" opacity="0.5" />
        <circle cx="14" cy="34" r="0.9" opacity="0.5" />
        <circle cx="104" cy="26" r="1.0" opacity="0.45" />
        <circle cx="90" cy="88" r="1.2" opacity="0.35" />
      </g>

      {/* armored shoulders */}
      <path d="M12 122 C 15 94 30 78 45 73 L 75 73 C 90 78 105 94 108 122 Z" fill="url(#lb-armor)" />
      {/* pauldrons with layered plates */}
      <path d="M14 122 C 16 100 24 86 37 80 C 32 90 30 100 31 112 L 26 122 Z" fill="#a08850" />
      <path d="M106 122 C 104 100 96 86 83 80 C 88 90 90 100 89 112 L 94 122 Z" fill="#a08850" />
      <path d="M18 108 C 20 96 26 87 34 82" fill="none" stroke={P.pale} strokeWidth="1.2" opacity="0.6" />
      <path d="M102 108 C 100 96 94 87 86 82" fill="none" stroke={P.pale} strokeWidth="1.2" opacity="0.6" />

      {/* breastplate with sun emblem */}
      <path d="M44 122 C 44 98 50 84 60 82 C 70 84 76 98 76 122 Z" fill="#4c3c1c" />
      <circle cx="60" cy="98" r="8" fill="none" stroke={P.bright} strokeWidth="1.4" opacity="0.9" />
      <circle cx="60" cy="98" r="3.4" fill={P.bright} opacity="0.95" />
      <g stroke={P.bright} strokeWidth="1.1" opacity="0.8">
        <path d="M60 86 L 60 90" /><path d="M60 106 L 60 110" />
        <path d="M48 98 L 52 98" /><path d="M68 98 L 72 98" />
      </g>

      {/* helm — crowned, serene */}
      <path d="M60 20 C 47 20 41 30 41 43 C 41 54 46 62 52 66 L 68 66 C 74 62 79 54 79 43 C 79 30 73 20 60 20 Z"
        fill="url(#lb-helm)" />
      {/* crown points */}
      <path d="M44 30 L 42 18 L 50 26 L 56 12 L 60 24 L 64 12 L 70 26 L 78 18 L 76 30 C 71 24 66 22 60 22 C 54 22 49 24 44 30 Z"
        fill="#d8b868" />
      <path d="M56 12 L 60 24 L 64 12" fill="none" stroke={P.pale} strokeWidth="0.8" opacity="0.7" />
      {/* face opening + calm glowing gaze */}
      <path d="M48 40 C 48 54 53 63 60 63 C 67 63 72 54 72 40 C 68 36 64 34 60 34 C 56 34 52 36 48 40 Z" fill="url(#lb-face)" />
      <path d="M50 47 L 58 47" stroke="url(#lb-eye)" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M62 47 L 70 47" stroke="url(#lb-eye)" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M52 47 L 56 47" stroke="#fffbe8" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M64 47 L 68 47" stroke="#fffbe8" strokeWidth="1.2" strokeLinecap="round" />
      {/* cheek guards */}
      <path d="M46 44 C 45 52 47 60 51 64 L 51 46 Z" fill="#8a7440" />
      <path d="M74 44 C 75 52 73 60 69 64 L 69 46 Z" fill="#8a7440" />

      {/* rim light */}
      <path d="M45 73 C 31 79 19 93 16 113" fill="none" stroke={P.pale} strokeWidth="1.6" opacity="0.55" />
      <path d="M41 43 C 41 32 47 22 56 19" fill="none" stroke={P.pale} strokeWidth="1.4" opacity="0.6" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Public components
// ---------------------------------------------------------------------------

const PORTRAITS: Record<HeroId, () => JSX.Element> = {
  berserker:   BerserkerPortrait,
  pyromancer:  PyromancerPortrait,
  lightbearer: LightbearerPortrait,
}

export function HeroPortraitArt({ heroId, size, className }: HeroArtProps): JSX.Element {
  const Comp = PORTRAITS[heroId] ?? BerserkerPortrait
  return (
    <span
      className={className}
      style={{ width: size, height: size, display: 'inline-block', lineHeight: 0 }}
    >
      <Comp />
    </span>
  )
}

export default HeroPortraitArt

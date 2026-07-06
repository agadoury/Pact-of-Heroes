/**
 * <HeroSilhouette>
 *
 * Stylized SVG silhouette per hero. Not final character art — these are
 * geometric emblems that convey each hero's identity: berserker (axe +
 * wolfhead), pyromancer (flame + torch), lightbearer (sunburst + halo).
 * They render at any size and color-tint from currentColor.
 */

import { clsx } from '@/ui/util/clsx'
import type { HeroId } from '@/game/types'
import { HERO_ELEMENT, ELEMENT_COLOR_BRIGHT_VAR } from '@/ui/types/ui'
import s from './HeroSilhouette.module.css'

export interface HeroSilhouetteProps {
  heroId:     HeroId
  size?:      number
  variant?:   'crest' | 'portrait'
  className?: string
}

const PATHS: Record<HeroId, string> = {
  // Berserker — axe head + wolfmask geometry
  berserker: `
    <path d="M32 6 L44 14 L44 30 L54 30 L54 42 L44 42 L44 58 L20 58 L20 42 L10 42 L10 30 L20 30 L20 14 Z" opacity="0.9"/>
    <circle cx="24" cy="24" r="2" opacity="0.6"/>
    <circle cx="40" cy="24" r="2" opacity="0.6"/>
    <path d="M20 40 L32 46 L44 40" fill="none" stroke="currentColor" stroke-width="1.5"/>
  `,
  // Pyromancer — rising flame + wick
  pyromancer: `
    <path d="M32 4 C 28 14, 20 20, 22 30 C 24 40, 32 42, 32 56 C 32 42, 40 40, 42 30 C 44 20, 36 14, 32 4 Z" opacity="0.9"/>
    <path d="M32 20 C 30 24, 28 28, 30 34 C 32 30, 34 28, 32 20 Z" opacity="0.6"/>
    <rect x="26" y="56" width="12" height="6" opacity="0.7"/>
  `,
  // Lightbearer — sunburst + shield rim
  lightbearer: `
    <circle cx="32" cy="32" r="12" opacity="0.9"/>
    <g opacity="0.75">
      <path d="M32 2 L34 20 L30 20 Z"/>
      <path d="M32 62 L34 44 L30 44 Z"/>
      <path d="M2 32 L20 30 L20 34 Z"/>
      <path d="M62 32 L44 30 L44 34 Z"/>
      <path d="M11 11 L24 22 L22 24 Z"/>
      <path d="M53 53 L40 42 L42 40 Z"/>
      <path d="M53 11 L42 24 L40 22 Z"/>
      <path d="M11 53 L22 40 L24 42 Z"/>
    </g>
    <circle cx="32" cy="32" r="5" fill="var(--night-deep)" opacity="0.7"/>
  `,
}

export function HeroSilhouette({
  heroId,
  size    = 48,
  variant = 'crest',
  className,
}: HeroSilhouetteProps): JSX.Element {
  const element = HERO_ELEMENT[heroId] ?? 'ember'
  const colorVar = ELEMENT_COLOR_BRIGHT_VAR[element]
  const path = PATHS[heroId] ?? PATHS.berserker
  return (
    <span
      className={clsx(s.wrap, s[variant], className)}
      style={{
        width: size,
        height: size,
        color: `var(${colorVar})`,
      }}
      aria-label={`${heroId} silhouette`}
      role="img"
    >
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill="currentColor"
        dangerouslySetInnerHTML={{ __html: path }}
      />
    </span>
  )
}

export default HeroSilhouette

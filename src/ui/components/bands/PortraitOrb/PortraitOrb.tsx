/**
 * <PortraitOrb>
 *
 * The circular hero avatar on each strip. Self is 48×48 with frost tint;
 * opponent is 44×44 with ember tint. Highlight prop drives brief glow
 * shifts for damage/heal/resource/trigger events.
 *
 * Bible reference: Part 2.4.
 */

import { clsx } from '@/ui/util/clsx'
import type { HeroId, PlayerId } from '@/ui/types/ui'
import { HERO_ELEMENT } from '@/ui/types/ui'
import s from './PortraitOrb.module.css'

export type PortraitHighlight = 'damage' | 'heal' | 'resource' | 'trigger' | null

export interface PortraitOrbProps {
  heroId:      HeroId
  playerId:    PlayerId
  viewerId:    PlayerId
  highlight?:  PortraitHighlight
  className?:  string
}

export function PortraitOrb({
  heroId,
  playerId,
  viewerId,
  highlight = null,
  className,
}: PortraitOrbProps): JSX.Element {
  const perspective = playerId === viewerId ? 'self' : 'opponent'
  const element     = HERO_ELEMENT[heroId] ?? 'ember'

  return (
    <div
      className={clsx(
        s.orb,
        s[perspective],
        s[`element-${element}`],
        highlight && s[`highlight-${highlight}`],
        className,
      )}
      role="img"
      aria-label={`${heroId} portrait`}
      data-perspective={perspective}
      data-element={element}
    >
      <span className={s.initial}>{heroId.charAt(0).toUpperCase()}</span>
    </div>
  )
}

export default PortraitOrb

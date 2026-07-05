/**
 * <HeroStrip>
 *
 * The unified component for both OpponentStrip and SelfStrip — the strips
 * differ only by portrait size, tint, and which signature elements they
 * render. Everything else (three-row layout, HP bar, CP number, status
 * track) is shared. See DECISIONS.md for the consolidation.
 *
 * Bible reference: Parts 2.2 + 2.3.
 */

import { clsx } from '@/ui/util/clsx'
import type { HeroSnapshot } from '@/game/types'
import type { PlayerId } from '@/ui/types/ui'
import { HERO_ELEMENT } from '@/ui/types/ui'
import { StatLabel } from '@/ui/components/atoms/StatLabel'
import { StatValue } from '@/ui/components/atoms/StatValue'
import { PortraitOrb } from '../PortraitOrb'
import { HPTrack } from '../HPTrack'
import { CPValue } from '../CPValue'
import s from './HeroStrip.module.css'

export interface HeroStripProps {
  playerId:              PlayerId
  viewerId:              PlayerId
  snapshot:              HeroSnapshot
  cpMax?:                number
  recentDamageTaken?:    number | null
  className?:            string
  /** Slot for the deck indicator + opponent hand indicator (right of name). */
  nameRowRight?:         React.ReactNode
  /** Slot for the status track chip list (right of CP number). */
  statusTrackSlot?:      React.ReactNode
}

const DEFAULT_CP_MAX = 15
const LOW_HP_THRESHOLD = 0.25

export function HeroStrip({
  playerId,
  viewerId,
  snapshot,
  cpMax = DEFAULT_CP_MAX,
  recentDamageTaken,
  className,
  nameRowRight,
  statusTrackSlot,
}: HeroStripProps): JSX.Element {
  const perspective = playerId === viewerId ? 'self' : 'opponent'
  const element     = HERO_ELEMENT[snapshot.hero] ?? 'ember'
  const lowHp       = snapshot.hp <= LOW_HP_THRESHOLD * snapshot.hpStart

  return (
    <div
      className={clsx(
        s.strip,
        s[perspective],
        s[`element-${element}`],
        recentDamageTaken ? s.damageFlash : undefined,
        className,
      )}
      data-perspective={perspective}
      data-hero-element={element}
    >
      <PortraitOrb
        heroId={snapshot.hero}
        playerId={playerId}
        viewerId={viewerId}
        highlight={recentDamageTaken ? 'damage' : null}
      />
      <div className={s.info}>
        <div className={s.nameRow}>
          <span className={s.name}>{heroDisplayName(snapshot.hero)}</span>
          {nameRowRight}
        </div>
        <div className={s.hpRow}>
          <StatLabel>HP</StatLabel>
          <StatValue emphasis={lowHp ? 'critical' : 'normal'}>
            {snapshot.hp}
          </StatValue>
          <HPTrack
            hp={snapshot.hp}
            hpStart={snapshot.hpStart}
            perspective={perspective}
            lethal={lowHp}
          />
        </div>
        <div className={s.cpRow}>
          <StatLabel>CP</StatLabel>
          <CPValue cp={snapshot.cp} cpMax={cpMax} />
          <div className={s.statusTrackSlot}>{statusTrackSlot}</div>
        </div>
      </div>
    </div>
  )
}

function heroDisplayName(heroId: string): string {
  return heroId.charAt(0).toUpperCase() + heroId.slice(1)
}

export default HeroStrip

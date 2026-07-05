/**
 * <DiceTray>
 *
 * Row of 5 dice. Renders the active player's dice regardless of viewer
 * (bible Part 7.3.5.1). Tumble stagger via rollDelay.
 *
 * Bible reference: Part 2.7.
 */

import { clsx } from '@/ui/util/clsx'
import type { Die as EngineDie, HeroId } from '@/game/types'
import { Die } from '../Die'
import s from './DiceTray.module.css'

export interface DiceTrayProps {
  dice:          readonly EngineDie[]
  isRolling?:    boolean
  interactable?: boolean
  heroId?:       HeroId
  onDieTap?:     (index: number) => void
  className?:    string
}

export function DiceTray({
  dice,
  isRolling,
  interactable = true,
  heroId,
  onDieTap,
  className,
}: DiceTrayProps): JSX.Element {
  return (
    <div className={clsx(s.tray, className)}>
      <span className={s.rule} data-side="left" />
      {dice.map((d, i) => (
        <Die
          key={d.index}
          face={d.faces[d.current]!}
          locked={d.locked}
          isRolling={isRolling && !d.locked}
          rollDelay={i * 80}
          interactable={interactable}
          heroId={heroId}
          onTap={onDieTap ? () => onDieTap(d.index) : undefined}
        />
      ))}
      <span className={s.rule} data-side="right" />
    </div>
  )
}

export default DiceTray

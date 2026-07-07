/**
 * <DiceTray>
 *
 * Row of 5 dice. Renders the active player's dice regardless of viewer
 * (bible Part 7.3.5.1). Each rising edge of `rollSignal` throws the
 * unlocked dice; `rollDelay` staggers their landings left→right.
 *
 * Bible reference: Part 2.7.
 */

import { clsx } from '@/ui/util/clsx'
import type { Die as EngineDie, HeroId } from '@/game/types'
import { Die } from '../Die'
import s from './DiceTray.module.css'

export interface DiceTrayProps {
  dice:          readonly EngineDie[]
  rollSignal?:   number
  interactable?: boolean
  heroId?:       HeroId
  onDieTap?:     (index: number) => void
  className?:    string
}

export function DiceTray({
  dice,
  rollSignal,
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
          faces={d.faces}
          locked={d.locked}
          rollSignal={rollSignal}
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

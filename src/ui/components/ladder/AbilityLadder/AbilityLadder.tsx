/**
 * <AbilityLadder>
 *
 * 4 ability rows stacked vertically, T4 at top → T1 at bottom.
 *
 * Bible reference: Part 3.1.
 */

import { clsx } from '@/ui/util/clsx'
import type { LadderAbility } from '@/ui/types/ability'
import { AbilityRow } from '../AbilityRow'
import s from './AbilityLadder.module.css'

export interface AbilityLadderProps {
  abilities:      LadderAbility[]
  opacity?:       number
  onRowTap?:      (id: string) => void
  interactable?:  boolean
  className?:     string
}

export function AbilityLadder({
  abilities,
  opacity = 1,
  onRowTap,
  interactable = true,
  className,
}: AbilityLadderProps): JSX.Element {
  const display = [...abilities].sort((a, b) => b.tier - a.tier)
  return (
    <div
      className={clsx(s.ladder, !interactable && s.readonly, className)}
      style={{ opacity }}
    >
      {display.map((a) => (
        <AbilityRow
          key={a.id}
          ability={a}
          onTap={interactable && onRowTap ? () => onRowTap(a.id) : undefined}
        />
      ))}
    </div>
  )
}

export default AbilityLadder

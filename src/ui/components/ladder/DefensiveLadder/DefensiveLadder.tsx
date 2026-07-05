/**
 * <DefensiveLadder>
 *
 * Two-row defensive picker. Equal visual weight — no engine recommendation.
 *
 * Bible reference: Part 3.6.
 */

import { clsx } from '@/ui/util/clsx'
import { DefensiveRow, type DefensiveOption } from '../DefensiveRow'
import s from './DefensiveLadder.module.css'

export interface DefensiveLadderProps {
  defenses:    DefensiveOption[]
  selectedId?: string | null
  onSelect?:   (id: string) => void
  className?:  string
}

export function DefensiveLadder({
  defenses,
  selectedId,
  onSelect,
  className,
}: DefensiveLadderProps): JSX.Element {
  return (
    <div className={clsx(s.ladder, className)}>
      {defenses.map((d) => (
        <DefensiveRow
          key={d.id}
          option={d}
          selected={selectedId === d.id}
          onTap={onSelect ? () => onSelect(d.id) : undefined}
        />
      ))}
    </div>
  )
}

export default DefensiveLadder

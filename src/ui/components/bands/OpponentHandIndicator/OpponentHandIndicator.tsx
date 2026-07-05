/**
 * <OpponentHandIndicator>
 *
 * Small stacked-cards icon + count, rendered inline in opponent strip
 * name row left of the DeckIndicator.
 *
 * Bible reference: Part 2.11.
 */

import { clsx } from '@/ui/util/clsx'
import s from './OpponentHandIndicator.module.css'

export interface OpponentHandIndicatorProps {
  count:      number
  className?: string
}

export function OpponentHandIndicator({
  count,
  className,
}: OpponentHandIndicatorProps): JSX.Element {
  return (
    <span
      className={clsx(s.indicator, className)}
      aria-label={`Opponent hand: ${count} cards`}
    >
      <span className={s.icon} aria-hidden="true">▤▤</span>
      <span className={s.count}>{count}</span>
    </span>
  )
}

export default OpponentHandIndicator

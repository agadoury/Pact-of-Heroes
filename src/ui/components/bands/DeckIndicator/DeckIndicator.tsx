/**
 * <DeckIndicator>
 *
 * Inline card-back stack + count, rendered in the strip name row. Low
 * state (count ≤ 3) pulses; empty state dims.
 *
 * Bible reference: Part 2.9.2.
 */

import { clsx } from '@/ui/util/clsx'
import s from './DeckIndicator.module.css'

export interface DeckIndicatorProps {
  count:      number
  variant?:   'default' | 'opp'
  className?: string
}

export function DeckIndicator({
  count,
  variant = 'default',
  className,
}: DeckIndicatorProps): JSX.Element {
  const state = count === 0 ? 'empty' : count <= 3 ? 'low' : 'default'
  return (
    <span
      className={clsx(s.indicator, s[variant], s[state], className)}
      aria-label={`Deck: ${count} cards`}
    >
      <span className={s.count}>{count}</span>
    </span>
  )
}

export default DeckIndicator

/**
 * <DefDiceBadge>
 *
 * Small pill on defensive rows showing the die count that defense rolls.
 *
 * Bible reference: Part 3.6.
 */

import { clsx } from '@/ui/util/clsx'
import s from './DefDiceBadge.module.css'

export interface DefDiceBadgeProps {
  count:      number
  className?: string
}

export function DefDiceBadge({ count, className }: DefDiceBadgeProps): JSX.Element {
  return (
    <span className={clsx(s.badge, className)}>{count}D</span>
  )
}

export default DefDiceBadge

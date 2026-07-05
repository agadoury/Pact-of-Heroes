/**
 * <CPValue>
 *
 * Numeric CP readout (0–15) rendered inline on the strip's CP row. No bar
 * — CP scale is small enough that players internalize it as a number.
 * Capped state (cp === 15) shifts to dawn coloring per Part 2.5.1.
 *
 * Bible reference: Part 2.5.1.
 */

import { clsx } from '@/ui/util/clsx'
import s from './CPValue.module.css'

export interface CPValueProps {
  cp:          number
  cpMax:       number
  isGaining?:  boolean
  isSpending?: boolean
  className?:  string
}

export function CPValue({
  cp,
  cpMax,
  isGaining,
  isSpending,
  className,
}: CPValueProps): JSX.Element {
  const capped = cp >= cpMax
  return (
    <span
      className={clsx(
        s.value,
        capped && s.capped,
        isGaining && s.gaining,
        isSpending && s.spending,
        className,
      )}
      aria-label={`CP ${cp}`}
    >
      {cp}
    </span>
  )
}

export default CPValue

/**
 * <StatValue>
 *
 * Numeric stat readout — HP, CP, count digits.
 * `emphasis="critical"` switches to ember for low-HP warnings.
 *
 * Bible reference: Part 1.10.
 */

import type { ReactNode } from 'react'
import { clsx } from '@/ui/util/clsx'
import s from './StatValue.module.css'

export interface StatValueProps {
  children:   ReactNode
  emphasis?:  'normal' | 'critical' | 'resource' | 'capped'
  className?: string
}

export function StatValue({
  children,
  emphasis = 'normal',
  className,
}: StatValueProps): JSX.Element {
  return (
    <span className={clsx(s.value, s[emphasis], className)}>
      {children}
    </span>
  )
}

export default StatValue

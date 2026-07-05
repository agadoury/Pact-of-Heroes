/**
 * <StatLabel>
 *
 * Small uppercase label — "HP", "CP" — that precedes a StatValue. Purely
 * decorative; semantic value lives on the adjacent StatValue.
 *
 * Bible reference: Part 1.10.
 */

import type { ReactNode } from 'react'
import { clsx } from '@/ui/util/clsx'
import s from './StatLabel.module.css'

export interface StatLabelProps {
  children:   ReactNode
  className?: string
}

export function StatLabel({ children, className }: StatLabelProps): JSX.Element {
  return <span className={clsx(s.label, className)}>{children}</span>
}

export default StatLabel

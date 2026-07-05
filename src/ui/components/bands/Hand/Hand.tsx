/**
 * <Hand>
 *
 * Horizontal scroll container holding HandCards. Snap points on left edge;
 * scrollbar hidden.
 *
 * Bible reference: Part 2.9.
 */

import type { ReactNode } from 'react'
import { clsx } from '@/ui/util/clsx'
import s from './Hand.module.css'

export interface HandProps {
  children:   ReactNode
  className?: string
}

export function Hand({ children, className }: HandProps): JSX.Element {
  return <div className={clsx(s.hand, className)}>{children}</div>
}

export default Hand

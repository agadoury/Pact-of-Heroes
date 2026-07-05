/**
 * <MiddleBand>
 *
 * Dumb 28%-height container hosting the ability ladder + FOP overlay.
 *
 * Bible reference: Part 2.10.
 */

import type { ReactNode } from 'react'
import { clsx } from '@/ui/util/clsx'
import s from './MiddleBand.module.css'

export interface MiddleBandProps {
  children:   ReactNode
  className?: string
}

export function MiddleBand({ children, className }: MiddleBandProps): JSX.Element {
  return <div className={clsx(s.band, className)}>{children}</div>
}

export default MiddleBand

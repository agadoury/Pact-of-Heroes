/**
 * <StatDivider>
 *
 * Mid-dot glyph (·) between two inline stat blocks. Used in inline
 * "HP 22 · CP 8" renderings — not in the vertical strip rows.
 *
 * Bible reference: Part 1.10.
 */

import { clsx } from '@/ui/util/clsx'
import s from './StatDivider.module.css'

export interface StatDividerProps {
  className?: string
}

export function StatDivider({ className }: StatDividerProps): JSX.Element {
  return <span className={clsx(s.divider, className)} aria-hidden="true">·</span>
}

export default StatDivider

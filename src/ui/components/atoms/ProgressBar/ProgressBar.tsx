/**
 * <ProgressBar>
 *
 * Bar primitive used by HPTrack + any other fill-based readout. Handles
 * smooth width transitions and gradient variants. HP magnitude carries
 * information under reduced motion, so the width transition stays on
 * under prefers-reduced-motion (bible Part 1.6).
 *
 * Bible reference: Part 2.5.
 */

import type { CSSProperties } from 'react'
import { clsx } from '@/ui/util/clsx'
import s from './ProgressBar.module.css'

export type ProgressBarVariant =
  | 'normal-frost'
  | 'normal-ember'
  | 'lethal'

export interface ProgressBarProps {
  value:      number         // 0–max
  max:        number
  variant?:   ProgressBarVariant
  height?:    number         // px; default 5
  className?: string
}

export function ProgressBar({
  value,
  max,
  variant = 'normal-frost',
  height  = 5,
  className,
}: ProgressBarProps): JSX.Element {
  const clamped = Math.max(0, Math.min(value, max))
  const pct = max <= 0 ? 0 : (clamped / max) * 100
  const style: CSSProperties = {
    height,
    ['--fill-pct' as string]: `${pct}%`,
  }
  return (
    <div
      className={clsx(s.bar, className)}
      style={style}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped}
    >
      <div className={clsx(s.fill, s[variant])} />
    </div>
  )
}

export default ProgressBar

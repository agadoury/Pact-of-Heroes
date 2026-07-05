/**
 * <HPTrack>
 *
 * Thin flex-growing bar showing hp/hpStart. Wraps ProgressBar with the
 * strip-appropriate variant (frost for self, ember for opponent, crimson
 * for lethal state).
 *
 * Bible reference: Part 2.5.
 */

import { ProgressBar } from '@/ui/components/atoms/ProgressBar'
import type { Perspective } from '@/ui/types/ui'
import s from './HPTrack.module.css'

export interface HPTrackProps {
  hp:          number
  hpStart:     number
  perspective: Perspective
  lethal?:     boolean
  className?:  string
}

export function HPTrack({
  hp,
  hpStart,
  perspective,
  lethal,
  className,
}: HPTrackProps): JSX.Element {
  const variant = lethal
    ? 'lethal'
    : perspective === 'self'
      ? 'normal-frost'
      : 'normal-ember'
  return (
    <div className={s.wrap}>
      <ProgressBar
        value={hp}
        max={hpStart}
        variant={variant}
        className={className}
      />
    </div>
  )
}

export default HPTrack

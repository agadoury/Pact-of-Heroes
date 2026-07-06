/**
 * <AmbientBackdrop>
 *
 * Slow-drift particle canvas used behind menu screens (Home, HeroSelect,
 * Summary). All motion is CSS-only — deterministic pseudo-random
 * placement so re-renders don't reshuffle.
 *
 * `intensity` prop scales particle count. `tone` picks the color family.
 */

import { useMemo } from 'react'
import { clsx } from '@/ui/util/clsx'
import { useReducedMotion } from '@/ui/hooks/useReducedMotion'
import s from './AmbientBackdrop.module.css'

export type BackdropTone = 'gold' | 'frost' | 'ember' | 'dawn' | 'crimson'

export interface AmbientBackdropProps {
  tone?:      BackdropTone
  intensity?: 'low' | 'standard' | 'high'
  className?: string
}

const COUNT = { low: 18, standard: 32, high: 48 }

export function AmbientBackdrop({
  tone = 'gold',
  intensity = 'standard',
  className,
}: AmbientBackdropProps): JSX.Element | null {
  const reduced = useReducedMotion()
  const particles = useMemo(() => {
    const n = COUNT[intensity]
    return Array.from({ length: n }, (_, i) => ({
      key:      i,
      left:     (i * 37 + 13) % 100,
      top:      (i * 61 + 41) % 100,
      size:     2 + (i * 7) % 4,
      delay:    (i * 190) % 6000,
      duration: 8000 + (i * 271) % 6000,
      opacity:  0.25 + ((i * 17) % 55) / 100,
    }))
  }, [intensity])

  if (reduced) return <div className={clsx(s.backdrop, s[tone], className)} />

  return (
    <div className={clsx(s.backdrop, s[tone], className)} aria-hidden="true">
      <div className={s.aurora} />
      {particles.map(p => (
        <span
          key={p.key}
          className={s.mote}
          style={{
            left:            `${p.left}%`,
            top:             `${p.top}%`,
            width:           `${p.size}px`,
            height:          `${p.size}px`,
            opacity:         p.opacity,
            animationDelay:  `${p.delay}ms`,
            animationDuration: `${p.duration}ms`,
          }}
        />
      ))}
    </div>
  )
}

export default AmbientBackdrop

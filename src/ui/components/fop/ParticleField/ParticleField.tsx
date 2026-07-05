/**
 * <ParticleField>
 *
 * Ambient CSS-animated particles during FOP scenes. Density levels match
 * the bible's low/standard/high/burst caps.
 *
 * Bible reference: Part 5.5.
 */

import { useMemo } from 'react'
import { clsx } from '@/ui/util/clsx'
import { useReducedMotion } from '@/ui/hooks/useReducedMotion'
import type { Tone } from '@/ui/types/ui'
import s from './ParticleField.module.css'

export type ParticleDensity = 'low' | 'standard' | 'high' | 'burst'

const COUNT: Record<ParticleDensity, number> = {
  low:      4,
  standard: 8,
  high:     12,
  burst:    16,
}

export interface ParticleFieldProps {
  density?:  ParticleDensity
  tone?:     Tone
  className?: string
}

interface Particle {
  key:    number
  x:      number
  y:      number
  size:   number
  delay:  number
  opacity: number
}

export function ParticleField({
  density = 'standard',
  tone    = 'gold',
  className,
}: ParticleFieldProps): JSX.Element | null {
  const reduced = useReducedMotion()
  const particles = useMemo<Particle[]>(() => {
    const n = COUNT[density]
    // Deterministic pseudo-random layout — seeded per render so particles
    // don't re-randomize with each parent re-render.
    return Array.from({ length: n }, (_, i) => ({
      key:     i,
      x:       ((i * 37) % 100),
      y:       ((i * 53) % 100),
      size:    3 + ((i * 7) % 5),
      delay:   (i * 90) % 1200,
      opacity: 0.5 + ((i * 13) % 50) / 100,
    }))
  }, [density])
  if (reduced) return null
  return (
    <div className={clsx(s.field, s[`tone-${tone}`], className)} aria-hidden="true">
      {particles.map(p => (
        <span
          key={p.key}
          className={s.particle}
          style={{
            left:              `${p.x}%`,
            top:               `${p.y}%`,
            width:             `${p.size}px`,
            height:            `${p.size}px`,
            opacity:           p.opacity,
            animationDelay:    `${p.delay}ms`,
          }}
        />
      ))}
    </div>
  )
}

export default ParticleField

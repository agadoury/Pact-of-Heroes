/**
 * <EffectRows>
 *
 * Multi-effect breakdown rendered below the damage number. Rows stagger
 * in at 100ms intervals during effects-in.
 *
 * Bible reference: Part 5.4.
 */

import { clsx } from '@/ui/util/clsx'
import type { ResolutionEffect, ResolutionPhase } from '@/ui/types/fop'
import s from './EffectRows.module.css'

export interface EffectRowsProps {
  effects:   ResolutionEffect[]
  phase:     ResolutionPhase
  className?: string
}

const HIDE_BEFORE: ResolutionPhase[] = ['idle', 'preconfirm', 'fade-in', 'name-in', 'damage-in']

export function EffectRows({ effects, phase, className }: EffectRowsProps): JSX.Element {
  const hidden = HIDE_BEFORE.includes(phase) || phase === 'fade-out'
  return (
    <div className={clsx(s.rows, className)}>
      {effects.map((effect, i) => (
        <div
          key={i}
          className={clsx(s.row, s[`kind-${effect.kind}`], hidden ? s.hidden : s.visible)}
          style={{ transitionDelay: `${i * 100}ms` }}
        >
          <span className={clsx(s.marker, s[`kind-${effect.kind}`])} />
          <span className={s.desc}>{effect.description}</span>
        </div>
      ))}
    </div>
  )
}

export default EffectRows

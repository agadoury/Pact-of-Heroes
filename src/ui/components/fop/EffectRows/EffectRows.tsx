/**
 * <EffectRows>
 *
 * Multi-effect breakdown rendered below the damage number: one labeled
 * row per effect (icon + text + YOU/FOE target tag), staggering in at
 * 100ms intervals during effects-in.
 *
 * Bible reference: Part 5.4.
 */

import { clsx } from '@/ui/util/clsx'
import { Icon } from '@/ui/components/atoms/Icon'
import type { IconName } from '@/ui/types/icon'
import { useUIStore } from '@/ui/store/uiStore'
import type { ResolutionEffect, ResolutionPhase } from '@/ui/types/fop'
import s from './EffectRows.module.css'

export interface EffectRowsProps {
  effects:   ResolutionEffect[]
  phase:     ResolutionPhase
  className?: string
}

const HIDE_BEFORE: ResolutionPhase[] = ['idle', 'preconfirm', 'fade-in', 'name-in', 'damage-in']

const ICON_BY_KIND: Record<ResolutionEffect['kind'], IconName> = {
  damage:   'flame',
  heal:     'heart-pulse',
  resource: 'sparkles',
  token:    'star',
  status:   'star',
  block:    'shield',
}

export function EffectRows({ effects, phase, className }: EffectRowsProps): JSX.Element {
  const viewerId = useUIStore(state => state.viewerId)
  const hidden = HIDE_BEFORE.includes(phase) || phase === 'fade-out'
  return (
    <div className={clsx(s.rows, className)}>
      {effects.map((effect, i) => (
        <div
          key={i}
          className={clsx(s.row, s[`kind-${effect.kind}`], hidden ? s.hidden : s.visible)}
          style={{ transitionDelay: `${i * 100}ms` }}
        >
          <span className={s.marker}>
            <Icon name={ICON_BY_KIND[effect.kind]} size={11} />
          </span>
          <span className={s.desc}>{effect.description}</span>
          {effect.target ? (
            <span className={clsx(s.tag, effect.target === viewerId ? s.tagYou : s.tagFoe)}>
              {effect.target === viewerId ? 'You' : 'Foe'}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export default EffectRows

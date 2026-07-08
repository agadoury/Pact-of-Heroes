/**
 * <StatusChip>
 *
 * 22×22 circular chip with Lucide-style icon, color-tinted per effect.
 * Universal engine statuses + passive counters (Frenzy / Radiance) render
 * through this component.
 *
 * Bible reference: Part 4.4.
 */

import { clsx } from '@/ui/util/clsx'
import { Icon } from '@/ui/components/atoms/Icon'
import type { IconName } from '@/ui/types/icon'
import type { ChipEffect } from '@/ui/types/status'
import s from './StatusChip.module.css'

export interface StatusChipProps {
  effect:      ChipEffect
  count?:      number
  isApplying?: boolean
  isExpiring?: boolean
  isTicking?:  boolean
  /** Tap handler — receives the chip's anchor point (center-top of its
   *  rect) for tooltip placement. Renders as a real <button> when set. */
  onTap?:      (anchor: { x: number; y: number }) => void
  className?:  string
}

const ICON_BY_EFFECT: Partial<Record<ChipEffect, IconName>> = {
  burn:     'flame',
  stun:     'zap',
  protect:  'shield',
  shield:   'shield',
  regen:    'heart-pulse',
  bleeding: 'droplet',
  radiance: 'sparkles',
  frenzy:   'arrow-up',
  'berserker:frostbite': 'snowflake',
  'pyromancer:cinder':   'flame',
  'lightbearer:verdict': 'sparkles',
  'pyromancer:defense-handicap-1': 'skull',
}

const CLASS_BY_EFFECT: Partial<Record<ChipEffect, string>> = {
  burn:     'burn',
  stun:     'stun',
  protect:  'protect',
  shield:   'shield',
  regen:    'regen',
  bleeding: 'bleeding',
  radiance: 'radiance',
  frenzy:   'frenzy',
  'berserker:frostbite': 'frostbite',
  'pyromancer:cinder':   'cinder',
  'lightbearer:verdict': 'verdict',
  'pyromancer:defense-handicap-1': 'defense-handicap',
}

export function StatusChip({
  effect,
  count,
  isApplying,
  isExpiring,
  isTicking,
  onTap,
  className,
}: StatusChipProps): JSX.Element {
  const icon = ICON_BY_EFFECT[effect] ?? 'star'
  const kindClass = CLASS_BY_EFFECT[effect] ?? 'default'
  const cls = clsx(
    s.chip,
    s[kindClass],
    isApplying && s.applying,
    isExpiring && s.expiring,
    isTicking  && s.ticking,
    className,
  )
  const inner = (
    <>
      <Icon name={icon} size={13} />
      {count != null && count > 0 ? (
        <span className={s.badge}>{count}</span>
      ) : null}
    </>
  )
  if (onTap) {
    return (
      <button
        type="button"
        data-status-chip
        className={cls}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          onTap({ x: r.left + r.width / 2, y: r.top })
        }}
        aria-label={`${String(effect)} ${count ?? ''} — tap for details`}
      >
        {inner}
      </button>
    )
  }
  return (
    <span className={cls} aria-label={`${String(effect)} ${count ?? ''}`}>
      {inner}
    </span>
  )
}

export default StatusChip

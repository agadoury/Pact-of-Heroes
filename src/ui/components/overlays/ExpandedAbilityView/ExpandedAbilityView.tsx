/**
 * <ExpandedAbilityView>
 *
 * Modal opened by tapping an ability row. Full effect prose, combo
 * readiness panel, Cancel/Activate buttons. Read-only mode hides Activate.
 *
 * Bible reference: Part 6.7.
 */

import { clsx } from '@/ui/util/clsx'
import type { LadderAbility } from '@/ui/types/ability'
import type { EffectSegment } from '@/ui/types/card'
import { KEYWORD_REGISTRY } from '@/ui/types/card'
import { AbilityValueBadge } from '@/ui/components/ladder/AbilityValueBadge'
import { Button } from '@/ui/components/atoms/Button'
import { Icon } from '@/ui/components/atoms/Icon'
import s from './ExpandedAbilityView.module.css'

export interface ExpandedAbilityViewProps {
  active:       boolean
  ability:      LadderAbility | null
  activatable?: boolean
  readOnly?:    boolean
  unactivatableReason?: string
  onCancel:     () => void
  onActivate?:  () => void
  className?:   string
}

export function ExpandedAbilityView({
  active,
  ability,
  activatable = false,
  readOnly = false,
  unactivatableReason,
  onCancel,
  onActivate,
  className,
}: ExpandedAbilityViewProps): JSX.Element | null {
  if (!active || !ability) return null

  const isLethal = ability.willKill && ability.isUltimate
  const label    = isLethal ? '— Lethal Strike —' : '— Ability —'
  const badgeVariant = isLethal
    ? 'lethal'
    : ability.comboState.status === 'eligible'
      ? (ability.isUltimate ? 'ultimate-eligible' : 'eligible')
      : 'default'

  return (
    <div
      className={clsx(s.overlay, isLethal && s.lethal, className)}
      data-lethal={isLethal}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className={s.header}>
        <span className={s.eyebrow}>{label}</span>
        <button
          type="button"
          className={s.close}
          onClick={onCancel}
          aria-label="Close"
        >
          <Icon name="cross" size={12} />
        </button>
      </div>

      <div className={s.heroBlock}>
        <AbilityValueBadge value={ability.value} variant={badgeVariant} size="large" />
        <div className={s.heroInfo}>
          <div className={s.name}>{ability.name}</div>
          <div className={s.tier}>
            Tier {ability.tier}
            {ability.isUltimate ? ' · Ultimate' : ''}
          </div>
        </div>
      </div>

      <div className={s.prose}>
        <RenderSegments segments={ability.fullEffect} />
      </div>

      {isLethal ? (
        <div className={s.lethalCallout}>
          ⚠ LETHAL · will kill target
        </div>
      ) : null}

      <div className={s.actions}>
        <Button variant="default" onClick={onCancel} weight={1}>Cancel</Button>
        {!readOnly ? (
          <Button
            variant={activatable ? (isLethal ? 'crimson' : 'primary') : 'disabled'}
            onClick={activatable ? onActivate : undefined}
            iconRight="chevron-right"
            weight={1.5}
          >
            {isLethal ? 'Lethal Strike' : 'Activate'}
          </Button>
        ) : null}
      </div>
      {!activatable && !readOnly && unactivatableReason ? (
        <div className={s.hint}>{unactivatableReason}</div>
      ) : null}
    </div>
  )
}

function RenderSegments({ segments }: { segments: EffectSegment[] }): JSX.Element {
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.kind === 'text')  return <span key={i}>{seg.content}</span>
        if (seg.kind === 'value') return <span key={i} className={s.value}>{seg.content}</span>
        const kw = KEYWORD_REGISTRY[seg.id]
        return <span key={i} className={s.keyword}>{kw?.displayLabel ?? seg.id}</span>
      })}
    </>
  )
}

export default ExpandedAbilityView

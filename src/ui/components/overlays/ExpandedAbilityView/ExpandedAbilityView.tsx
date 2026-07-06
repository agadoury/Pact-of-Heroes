/**
 * <ExpandedAbilityView>
 *
 * Modal opened by tapping an ability row. Full effect prose, combo
 * readiness panel, Cancel/Activate buttons. Read-only mode hides Activate.
 *
 * Bible reference: Part 6.7.
 */

import { clsx } from '@/ui/util/clsx'
import type { ComboDescriptor, LadderAbility } from '@/ui/types/ability'
import type { EffectSegment } from '@/ui/types/card'
import { KEYWORD_REGISTRY } from '@/ui/types/card'
import { AbilityValueBadge } from '@/ui/components/ladder/AbilityValueBadge'
import { ComboGlyphStrip } from '@/ui/components/ladder/ComboGlyphStrip'
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

      <div className={s.comboPanel}>
        <div className={s.comboLabel}>— Requires —</div>
        <ComboGlyphStrip
          descriptor={ability.combo}
          state={ability.comboState}
          size="prominent"
          className={s.comboStrip}
        />
        <div className={s.comboText}>{describeCombo(ability.combo)}</div>
        <div
          className={clsx(
            s.comboStatus,
            ability.comboState.status === 'eligible' && s.statusEligible,
            ability.comboState.status === 'near-eligible' && s.statusNear,
          )}
        >
          {ability.comboState.status === 'eligible'
            ? '◆ Combo met — ready to fire'
            : ability.comboState.status === 'near-eligible'
              ? '◇ One die away'
              : '◇ Combo not met'}
        </div>
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

function describeCombo(combo: ComboDescriptor): string {
  switch (combo.kind) {
    case 'sigil': {
      const counts = new Map<string, number>()
      for (const sym of combo.symbols) {
        const bare = sym.includes(':') ? sym.split(':').pop()! : sym
        counts.set(bare, (counts.get(bare) ?? 0) + 1)
      }
      return Array.from(counts.entries())
        .map(([bare, n]) => `${n} × ${bare.charAt(0).toUpperCase() + bare.slice(1)}`)
        .join(' + ')
    }
    case 'straight':
      return `Straight of ${combo.length}`
    case 'n-of-a-kind':
      return `${combo.count} of a kind`
    case 'compound':
      return combo.clauses.map(describeCombo).join(combo.op === 'and' ? ' + ' : '  or  ')
  }
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

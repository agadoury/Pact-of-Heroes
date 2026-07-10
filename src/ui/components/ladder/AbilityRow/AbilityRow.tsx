/**
 * <AbilityRow>
 *
 * One ladder entry. Composed of AbilityValueBadge (left) + name/text
 * (middle) + ComboGlyphStrip (right). Six state variations driven by combo
 * status + tier + will-kill flag.
 *
 * Bible reference: Part 3.2.
 */

import { clsx } from '@/ui/util/clsx'
import type { LadderAbility } from '@/ui/types/ability'
import { AbilityValueBadge, type AbilityValueBadgeVariant } from '../AbilityValueBadge'
import { ComboGlyphStrip } from '../ComboGlyphStrip'
import { comboNeedText } from '@/ui/util/comboText'
import s from './AbilityRow.module.css'

export interface AbilityRowProps {
  ability:    LadderAbility
  onTap?:     () => void
  className?: string
}

export function AbilityRow({ ability, onTap, className }: AbilityRowProps): JSX.Element {
  const state = deriveRowState(ability)
  const badgeVariant = deriveBadgeVariant(ability, state)

  return (
    <div
      className={clsx(s.row, s[state], className)}
      data-tier={ability.tier}
      data-state={state}
      onClick={onTap}
      role="button"
      aria-label={`${ability.name} (Tier ${ability.tier})`}
    >
      <AbilityValueBadge value={ability.value} variant={badgeVariant} />
      <div className={s.info}>
        <div className={s.name}>
          {ability.name}
          {ability.isUpgraded ? (
            <span className={s.upgraded} title="Upgraded by a Mastery">{'\u2605'}</span>
          ) : null}
        </div>
        {ability.willKill && ability.isUltimate ? (
          <div className={s.lethalCondition}>Lethal · will kill</div>
        ) : state === 'near-eligible' ? (
          // The teachable moment: one die short — say the distance in
          // words instead of making players decode the pip strip.
          <div className={s.need}>
            {comboNeedText(ability.combo, ability.comboState) ?? ability.effectText}
          </div>
        ) : (
          <div className={s.text}>{ability.effectText}</div>
        )}
      </div>
      <ComboGlyphStrip
        descriptor={ability.combo}
        state={ability.comboState}
        size="prominent"
      />
    </div>
  )
}

type RowState =
  | 'default'
  | 'eligible'
  | 'near-eligible'
  | 'ultimate'
  | 'ultimate-eligible'
  | 'ultimate-lethal'

function deriveRowState(a: LadderAbility): RowState {
  if (a.isUltimate) {
    if (a.willKill && a.comboState.status === 'eligible') return 'ultimate-lethal'
    if (a.comboState.status === 'eligible')                return 'ultimate-eligible'
    return 'ultimate'
  }
  if (a.comboState.status === 'eligible')      return 'eligible'
  if (a.comboState.status === 'near-eligible') return 'near-eligible'
  return 'default'
}

function deriveBadgeVariant(_a: LadderAbility, state: RowState): AbilityValueBadgeVariant {
  if (state === 'ultimate-lethal')    return 'lethal'
  if (state === 'ultimate-eligible')  return 'ultimate-eligible'
  if (state === 'eligible')           return 'eligible'
  return 'default'
}

export default AbilityRow

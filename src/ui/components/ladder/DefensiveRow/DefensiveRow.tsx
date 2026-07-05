/**
 * <DefensiveRow>
 *
 * One row of the defensive picker. No TierBadge — the two-row layout
 * uniquely identifies each slot. Selected state adds a dawn halo.
 *
 * Bible reference: Part 3.6.
 */

import { clsx } from '@/ui/util/clsx'
import { ComboGlyphStrip } from '../ComboGlyphStrip'
import { DefDiceBadge } from '../DefDiceBadge'
import type { ComboDescriptor, ComboState } from '@/ui/types/ability'
import s from './DefensiveRow.module.css'

export interface DefensiveOption {
  id:          string
  name:        string
  effectText:  string
  descriptor:  ComboDescriptor
  comboState:  ComboState
  diceCount:   number
}

export interface DefensiveRowProps {
  option:     DefensiveOption
  selected?:  boolean
  onTap?:     () => void
  className?: string
}

export function DefensiveRow({
  option,
  selected,
  onTap,
  className,
}: DefensiveRowProps): JSX.Element {
  return (
    <div
      className={clsx(s.row, selected && s.selected, className)}
      onClick={onTap}
      role="button"
      aria-pressed={selected}
      aria-label={option.name}
    >
      <div className={s.info}>
        <div className={s.name}>{option.name}</div>
        <div className={s.text}>{option.effectText}</div>
      </div>
      <ComboGlyphStrip
        descriptor={option.descriptor}
        state={option.comboState}
        variant="defensive"
      />
      <DefDiceBadge count={option.diceCount} />
    </div>
  )
}

export default DefensiveRow

/**
 * <OffensivePickPrompt>
 *
 * Modal that appears when the engine sets pendingOffensiveChoice with
 * multiple matching abilities. Player picks which to commit; declining
 * dispatches select-offensive-ability with abilityIndex: null (fizzle).
 *
 * Bible: not explicitly covered — added because engine surfaces this
 * pending state that the UI must resolve.
 */

import { useState } from 'react'
import { clsx } from '@/ui/util/clsx'
import type { GameState } from '@/game/types'
import { Button } from '@/ui/components/atoms/Button'
import { Icon } from '@/ui/components/atoms/Icon'
import s from './OffensivePickPrompt.module.css'

export interface OffensivePickPromptProps {
  active:    boolean
  matches:   NonNullable<GameState['pendingOffensiveChoice']>['matches'] | []
  onSelect:  (abilityIndex: number) => void
  onDecline: () => void
  className?: string
}

export function OffensivePickPrompt({
  active,
  matches,
  onSelect,
  onDecline,
  className,
}: OffensivePickPromptProps): JSX.Element | null {
  const [selected, setSelected] = useState<number | null>(null)
  if (!active || matches.length === 0) return null

  const commit = () => {
    if (selected == null) return
    onSelect(selected)
  }

  return (
    <div className={clsx(s.overlay, className)}>
      <div className={s.header}>
        <span className={s.eyebrow}>— Choose Ability —</span>
        <button
          type="button"
          className={s.close}
          onClick={onDecline}
          aria-label="Decline"
        >
          <Icon name="cross" size={12} />
        </button>
      </div>
      <div className={s.list}>
        {matches.map((m) => (
          <button
            type="button"
            key={m.abilityIndex}
            className={clsx(s.row, selected === m.abilityIndex && s.selected)}
            onClick={() => setSelected(m.abilityIndex)}
          >
            <span className={s.tier}>T{m.tier}</span>
            <div className={s.rowInfo}>
              <div className={s.name}>{m.abilityName}</div>
              <div className={s.text}>
                {m.baseDamage > 0 ? `${m.baseDamage} damage` : ''} · {m.damageType}
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className={s.actions}>
        <Button variant="default" onClick={onDecline} weight={1}>Fizzle</Button>
        <Button
          variant={selected != null ? 'primary' : 'disabled'}
          iconRight="chevron-right"
          onClick={commit}
          weight={1.5}
        >
          Fire
        </Button>
      </div>
    </div>
  )
}

export default OffensivePickPrompt

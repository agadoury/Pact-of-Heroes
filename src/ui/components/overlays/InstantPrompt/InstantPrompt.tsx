/**
 * <InstantPrompt>
 *
 * Compact prompt that surfaces when the engine pauses on
 * `pendingStatusRemoval` — the holder can play an Instant to prevent it,
 * or dispatch respond-to-status-removal with cardId: null to accept.
 *
 * Bible: hooks into Part 6.4 modal stacking + Part 7.3.5.6 Instant flow.
 */

import { useState } from 'react'
import { clsx } from '@/ui/util/clsx'
import type { Card } from '@/game/types'
import { Button } from '@/ui/components/atoms/Button'
import { Icon } from '@/ui/components/atoms/Icon'
import s from './InstantPrompt.module.css'

export interface InstantPromptProps {
  active:    boolean
  title:     string
  subtitle?: string
  candidates: Card[]
  onPlay:    (cardId: string) => void
  onDecline: () => void
  className?: string
}

export function InstantPrompt({
  active,
  title,
  subtitle,
  candidates,
  onPlay,
  onDecline,
  className,
}: InstantPromptProps): JSX.Element | null {
  const [selected, setSelected] = useState<string | null>(candidates[0]?.id ?? null)
  if (!active) return null

  const commit = () => {
    if (!selected) return
    onPlay(selected)
  }

  return (
    <div className={clsx(s.overlay, className)}>
      <div className={s.header}>
        <span className={s.eyebrow}>— Instant Opportunity —</span>
        <button
          type="button"
          className={s.close}
          onClick={onDecline}
          aria-label="Decline"
        >
          <Icon name="cross" size={12} />
        </button>
      </div>
      <div className={s.title}>{title}</div>
      {subtitle ? <div className={s.subtitle}>{subtitle}</div> : null}
      <div className={s.list}>
        {candidates.map(card => (
          <button
            type="button"
            key={card.id}
            className={clsx(s.row, selected === card.id && s.selected)}
            onClick={() => setSelected(card.id)}
          >
            <span className={s.cost}>{card.cost}</span>
            <div className={s.info}>
              <div className={s.name}>{card.name}</div>
              <div className={s.text}>{card.text}</div>
            </div>
          </button>
        ))}
      </div>
      <div className={s.actions}>
        <Button variant="default" onClick={onDecline} weight={1}>Pass</Button>
        <Button
          variant={selected ? 'primary' : 'disabled'}
          iconRight="chevron-right"
          onClick={commit}
          weight={1.5}
        >
          Play Instant
        </Button>
      </div>
    </div>
  )
}

export default InstantPrompt

/**
 * <ExpandedCardView>
 *
 * Modal opened by tapping a hand card. Full effect prose, Cancel/Play.
 *
 * Bible reference: Part 6.6.
 */

import { clsx } from '@/ui/util/clsx'
import type { Card } from '@/game/types'
import type { EffectSegment } from '@/ui/types/card'
import { KEYWORD_REGISTRY } from '@/ui/types/card'
import { Button } from '@/ui/components/atoms/Button'
import { Icon } from '@/ui/components/atoms/Icon'
import { parseEffectText } from '@/ui/util/parseEffect'
import { deriveCardVisualStyle } from '@/ui/selectors/cardVisual'
import s from './ExpandedCardView.module.css'

export interface ExpandedCardViewProps {
  active:      boolean
  card:        Card | null
  affordable?: boolean
  playable?:   boolean
  unplayableReason?: string
  mode?:       'in-match' | 'inspection'
  onCancel:    () => void
  onPlay?:     () => void
  className?:  string
}

export function ExpandedCardView({
  active,
  card,
  affordable = true,
  playable = true,
  unplayableReason,
  mode = 'in-match',
  onCancel,
  onPlay,
  className,
}: ExpandedCardViewProps): JSX.Element | null {
  if (!active || !card) return null
  const style    = deriveCardVisualStyle(card)
  const segments = parseEffectText(card.text)

  return (
    <div
      className={clsx(s.overlay, className)}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className={s.header}>
        <span className={s.eyebrow}>— Card —</span>
        <button
          type="button"
          className={s.close}
          onClick={onCancel}
          aria-label="Close"
        >
          <Icon name="cross" size={12} />
        </button>
      </div>

      <div className={clsx(s.card, s[`style-${style}`])}>
        <span className={clsx(s.costPip, !affordable && s.unaffordable)}>{card.cost}</span>
        <div className={s.illustration}>
          {style === 'attack'  ? <Icon name="flame"       size={32} /> :
           style === 'defense' ? <Icon name="shield"      size={32} /> :
           style === 'buff'    ? <Icon name="trending-up" size={32} /> :
                                 <Icon name="diamond"     size={32} />}
        </div>
        <div className={s.name}>{card.name}</div>
        <div className={s.categoryLine}>
          {card.kind.replace('-', ' ').toUpperCase()} · {card.cost} CP
        </div>
        <div className={s.effectText}>
          <RenderSegments segments={segments} />
        </div>
      </div>

      <div className={s.actions}>
        <Button variant="default" onClick={onCancel} weight={1}>
          {mode === 'inspection' ? 'Back' : 'Cancel'}
        </Button>
        {mode === 'in-match' ? (
          <Button
            variant={playable ? 'primary' : 'disabled'}
            onClick={playable ? onPlay : undefined}
            iconRight="chevron-right"
            weight={1.5}
          >
            Play
          </Button>
        ) : (
          <Button variant="default" onClick={onCancel} weight={1.5}>Close</Button>
        )}
      </div>
      {!playable && mode === 'in-match' && unplayableReason ? (
        <div className={s.hint}>{unplayableReason}</div>
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

export default ExpandedCardView

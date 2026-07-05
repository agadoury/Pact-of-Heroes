/**
 * <HandCard>
 *
 * 76×112 card in the hand: cost pip, illustration slot, name strip,
 * effect prose. Playable/affordable states drive border + brightness.
 *
 * Bible reference: Part 2.9.3.
 */

import { clsx } from '@/ui/util/clsx'
import type { Card } from '@/game/types'
import { Icon } from '@/ui/components/atoms/Icon'
import type { EffectSegment } from '@/ui/types/card'
import { KEYWORD_REGISTRY } from '@/ui/types/card'
import { deriveCardVisualStyle } from '@/ui/selectors/cardVisual'
import { parseEffectText, truncateSegments } from '@/ui/util/parseEffect'
import s from './HandCard.module.css'

export type PlayableState =
  | 'playable'
  | 'unaffordable'
  | 'wrong-timing-modal'
  | 'wrong-timing-opp'
  | 'resolution-active'

export interface HandCardProps {
  card:        Card
  position?:   number
  state:       PlayableState
  focused?:    boolean
  onTap?:      () => void
  onLongPress?: () => void
  className?:  string
}

export function HandCard({
  card,
  state,
  focused,
  onTap,
  className,
}: HandCardProps): JSX.Element {
  const style      = deriveCardVisualStyle(card)
  const affordable = state !== 'unaffordable'
  const segments   = truncateSegments(parseEffectText(card.text), 60)
  const hasKeyword = segments.some(s => s.kind === 'keyword')

  return (
    <div
      className={clsx(
        s.card,
        s[state],
        s[`style-${style}`],
        focused && s.focused,
        className,
      )}
      onClick={onTap}
      data-card-id={card.id}
      role="button"
      aria-label={`${card.name}, cost ${card.cost}`}
    >
      <span className={clsx(s.costPip, !affordable && s.unaffordable)}>
        {card.cost}
      </span>
      <div className={s.illustration}>
        <IllustrationGlyph style={style} />
      </div>
      <div className={s.nameStrip}>
        <span className={s.categoryIcon} aria-hidden="true">
          <IllustrationGlyph style={style} tiny />
        </span>
        <span className={s.name}>{card.name}</span>
        {card.kind === 'instant' ? <span className={s.instantTag} title="Instant">⚡</span> : null}
      </div>
      <div className={s.effect}>
        <RenderSegments segments={segments} />
      </div>
      {hasKeyword ? <span className={s.keywordDot} aria-hidden="true" /> : null}
      {card.oncePerMatch ? <span className={s.opmTag}>1×</span> : null}
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

function IllustrationGlyph({ style, tiny }: { style: string; tiny?: boolean }): JSX.Element {
  const size = tiny ? 10 : 22
  switch (style) {
    case 'attack':  return <Icon name="flame"       size={size} />
    case 'defense': return <Icon name="shield"      size={size} />
    case 'buff':    return <Icon name="trending-up" size={size} />
    case 'utility': return <Icon name="diamond"     size={size} />
    default:        return <Icon name="star"        size={size} />
  }
}

export default HandCard

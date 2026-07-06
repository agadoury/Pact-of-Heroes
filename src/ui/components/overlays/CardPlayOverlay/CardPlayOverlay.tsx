/**
 * <CardPlayOverlay>
 *
 * ~1700ms cinematic when a card is played. Renders the played card at
 * readable center-stage size, holds, then slides to the discard corner.
 *
 * Bible reference: Part 6.6.5.
 */

import { useEffect, useRef } from 'react'
import { clsx } from '@/ui/util/clsx'
import type { Card } from '@/game/types'
import type { EffectSegment } from '@/ui/types/card'
import { KEYWORD_REGISTRY } from '@/ui/types/card'
import { parseEffectText } from '@/ui/util/parseEffect'
import { deriveCardVisualStyle } from '@/ui/selectors/cardVisual'
import { CardArt } from '@/ui/art/cardArt'
import s from './CardPlayOverlay.module.css'

export type CardPlayTone = 'frost' | 'ember' | 'dawn' | 'gold'

export interface CardPlayOverlayProps {
  active:      boolean
  card:        Card | null
  tone?:       CardPlayTone
  onComplete?: () => void
  className?:  string
}

const BEAT_MS = 1700

export function CardPlayOverlay({
  active,
  card,
  tone = 'gold',
  onComplete,
  className,
}: CardPlayOverlayProps): JSX.Element | null {
  // The dismiss timer keys on activation + card identity ONLY. Parents pass
  // inline onComplete closures (new identity every render), and MatchScreen
  // re-renders every few hundred ms during resolution sequences — keying the
  // effect on onComplete restarted the timer forever, leaving an invisible
  // tap-eating layer over the dice tray for the whole resolution run.
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  useEffect(() => {
    if (!active) return
    const t = window.setTimeout(() => onCompleteRef.current?.(), BEAT_MS)
    return () => window.clearTimeout(t)
  }, [active, card?.id])

  if (!active || !card) return null
  const style    = deriveCardVisualStyle(card)
  const segments = parseEffectText(card.text)

  return (
    <div className={clsx(s.overlay, s[`tone-${tone}`], className)}>
      <div className={clsx(s.card, s[`style-${style}`], s[`tone-${tone}`])}>
        <span className={s.cost}>{card.cost}</span>
        <div className={s.art}>
          <CardArt cardId={card.id} />
        </div>
        <div className={s.name}>{card.name}</div>
        <div className={s.effect}>
          <RenderSegments segments={segments} />
        </div>
      </div>
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

export default CardPlayOverlay

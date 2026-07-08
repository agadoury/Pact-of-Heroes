/**
 * <TooltipRenderer>
 *
 * Renders the current uiStore.tooltipTarget with viewport clamping.
 * Auto-dismisses after 5s.
 *
 * Bible reference: Part 6.3.
 */

import { useEffect } from 'react'
import { clsx } from '@/ui/util/clsx'
import { useUIStore } from '@/ui/store/uiStore'
import { DURATION } from '@/ui/util/duration'
import type { TooltipContent } from '@/ui/types/tooltip'
import s from './TooltipRenderer.module.css'

export function TooltipRenderer(): JSX.Element | null {
  const target = useUIStore(state => state.tooltipTarget)
  const clear  = useUIStore(state => state.setTooltip)

  useEffect(() => {
    if (!target) return
    const t = window.setTimeout(() => clear(null), DURATION.toastTooltip)
    return () => window.clearTimeout(t)
  }, [target, clear])

  // Tap-away dismissal. Chip taps are excluded — the chip's own click
  // handler owns the toggle (clearing here first would break tap-again-
  // to-close), and the tooltip itself clears via its onClick.
  useEffect(() => {
    if (!target) return
    const onDown = (e: PointerEvent) => {
      const el = e.target as Element | null
      if (el?.closest('[role="tooltip"]') || el?.closest('[data-status-chip]')) return
      clear(null)
    }
    window.addEventListener('pointerdown', onDown, true)
    return () => window.removeEventListener('pointerdown', onDown, true)
  }, [target, clear])

  if (!target) return null

  const { anchor, content } = target
  const { title, body } = renderContent(content)

  // Anchors near the top of the screen (opponent-strip chips) flip the
  // tooltip below the anchor so it can't clip off the viewport.
  const below = anchor.y < 180
  // The box is translated -50% horizontally, so the clamp must keep its
  // HALF-width inside the viewport, not its left edge (a left-edge chip
  // used to push half the tooltip off-screen).
  const half = 140 // max-width 280 / 2
  const style: React.CSSProperties = {
    left: Math.max(8 + half, Math.min(anchor.x, window.innerWidth - 8 - half)),
    ...(below
      ? { top: anchor.y + 28, transform: 'translate(-50%, 0)' }
      : { top: Math.max(48, anchor.y - 8), transform: 'translate(-50%, -100%)' }),
  }

  return (
    <div
      className={clsx(s.tooltip, below && s.below)}
      style={style}
      role="tooltip"
      onClick={() => clear(null)}
    >
      <div className={s.title}>{title}</div>
      <div className={s.body}>{body}</div>
    </div>
  )
}

function renderContent(c: TooltipContent): { title: string; body: string } {
  switch (c.kind) {
    case 'signature-token':
      return { title: c.name, body: `${c.hero} signature. ${c.count} stacks. ${c.mechanic}` }
    case 'generic-status':
      return { title: c.name, body: `${c.mechanic} ${c.decay}` }
    case 'card-buff':
      return { title: c.name, body: `${c.mechanic} · Source: ${c.source} · Remaining: ${c.remaining}` }
    case 'resource':
      return { title: c.name, body: `${c.value}/${c.max}. Spend options: ${c.spendOptions.join(', ')}` }
    case 'ability':
      return { title: `${c.name} · T${c.tier}`, body: `Combo: ${c.combo}. Effect: ${c.effect}${c.lethal ? ` · ⚠ ${c.lethal}` : ''}` }
    case 'die':
      return { title: c.face, body: `${c.meaning}` }
    case 'card':
      return { title: c.card.name, body: `${c.card.cost} CP · ${c.card.text.slice(0, 80)}` }
    case 'free-text':
      return { title: c.title, body: c.body }
  }
}

export default TooltipRenderer
